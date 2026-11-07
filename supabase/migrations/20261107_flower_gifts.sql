-- Flower & letter gift links: server-backed, revocable shares
-- Migration: 20261107_flower_gifts.sql
--
-- The first gifting version embedded the whole letter in the URL hash, so a
-- link could never be revoked. This migration stores each gift as a row the
-- author can list and hard-delete; deleting a row immediately stops the link
-- from serving content. Every access path is one of the RPCs below: the table
-- itself has RLS enabled with NO policies, so no direct table read or write is
-- possible for anyone, and there is no public listing route. A recipient needs
-- the exact 256-bit token (plus the optional passcode) to open a gift.
-- Gifts carry a snapshot of what the author typed for the recipient; they
-- never reference the notes table, so private letters are never exposed
-- through this API.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.flower_gifts (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  token text not null,
  bouquet text not null,
  font smallint not null default 0,
  to_name text,
  from_name text,
  message text not null,
  passcode_hash text,
  opened_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint flower_gifts_token_shape check (char_length(token) = 64),
  constraint flower_gifts_bouquet_known check (bouquet in ('rose','sunshine','meadow','tulip','peony','hydrangea','lily','lotus')),
  constraint flower_gifts_font_range check (font between 0 and 3),
  constraint flower_gifts_to_len check (to_name is null or char_length(to_name) <= 120),
  constraint flower_gifts_from_len check (from_name is null or char_length(from_name) <= 120),
  constraint flower_gifts_message_len check (char_length(message) between 1 and 10000)
);

create unique index if not exists idx_flower_gifts_token on public.flower_gifts (token);
create index if not exists idx_flower_gifts_owner on public.flower_gifts (owner_id, created_at desc);

alter table public.flower_gifts enable row level security;
revoke all on public.flower_gifts from anon, authenticated;

-- 1. Mint a gift. Only signed-in writers (including guest sign-ins). The token
--    is generated here, never supplied by the client. The same rule engine
--    that guards public notes blocks abusive content at creation.
create or replace function public.create_flower_gift(
  p_bouquet text,
  p_to_name text,
  p_from_name text,
  p_message text,
  p_font smallint default 0,
  p_passcode text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_owner uuid := auth.uid();
  v_token text;
  v_id uuid;
  v_created timestamptz;
begin
  if v_owner is null then
    raise exception 'not_authenticated';
  end if;

  if p_bouquet is null or p_bouquet not in ('rose','sunshine','meadow','tulip','peony','hydrangea','lily','lotus') then
    raise exception 'invalid_bouquet';
  end if;
  if p_font is null or p_font < 0 or p_font > 3 then
    raise exception 'invalid_font';
  end if;
  if p_message is null or char_length(p_message) < 1 or char_length(p_message) > 10000 then
    raise exception 'invalid_message';
  end if;
  if char_length(coalesce(p_to_name, '')) > 120 or char_length(coalesce(p_from_name, '')) > 120 then
    raise exception 'invalid_name';
  end if;
  if p_passcode is not null and (char_length(p_passcode) < 4 or char_length(p_passcode) > 64) then
    raise exception 'invalid_passcode';
  end if;

  if public.screen_text(coalesce(p_to_name, '') || ' ' || coalesce(p_from_name, '') || ' ' || p_message) = 'abuse' then
    raise exception 'content_blocked';
  end if;

  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

  insert into public.flower_gifts (owner_id, token, bouquet, font, to_name, from_name, message, passcode_hash)
  values (
    v_owner,
    v_token,
    p_bouquet,
    p_font,
    nullif(p_to_name, ''),
    nullif(p_from_name, ''),
    p_message,
    case when p_passcode is null then null
         else extensions.crypt(p_passcode, extensions.gen_salt('bf'))
    end
  )
  returning id, created_at into v_id, v_created;

  return jsonb_build_object('id', v_id, 'token', v_token, 'created_at', v_created);
end;
$$;

-- 2. The author's own list: what they made, whether it was opened, and the
--    token (so they can copy the link again). Owner only.
create or replace function public.list_my_flower_gifts()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_owner uuid := auth.uid();
begin
  if v_owner is null then
    raise exception 'not_authenticated';
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', g.id,
          'token', g.token,
          'bouquet', g.bouquet,
          'font', g.font,
          'to_name', g.to_name,
          'from_name', g.from_name,
          'message', g.message,
          'has_passcode', g.passcode_hash is not null,
          'opened_at', g.opened_at,
          'created_at', g.created_at
        )
        order by g.created_at desc
      )
      from public.flower_gifts g
      where g.owner_id = v_owner
    ),
    '[]'::jsonb
  );
end;
$$;

-- 3. Revoke. Hard delete, owner only; the link stops serving immediately.
create or replace function public.delete_flower_gift(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_owner uuid := auth.uid();
  v_deleted uuid;
begin
  if v_owner is null then
    raise exception 'not_authenticated';
  end if;

  delete from public.flower_gifts
  where id = p_id and owner_id = v_owner
  returning id into v_deleted;

  return jsonb_build_object('deleted', v_deleted is not null);
end;
$$;

-- 4. Open a gift. Callable anonymously; the 256-bit token is the bearer
--    credential. Unknown, malformed and deleted tokens all return the same
--    not_found, so existence cannot be probed. A passcode-protected gift asks
--    for the passcode first; the hash is bcrypt via pgcrypto. The first
--    successful open stamps opened_at so the author can see it was received.
create or replace function public.open_flower_gift(
  p_token text,
  p_passcode text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  g public.flower_gifts%rowtype;
begin
  if p_token is null or char_length(p_token) <> 64 then
    return jsonb_build_object('status', 'not_found');
  end if;

  select * into g from public.flower_gifts where token = p_token;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if g.passcode_hash is not null then
    if p_passcode is null then
      return jsonb_build_object('status', 'passcode_required', 'to_name', g.to_name);
    end if;
    if extensions.crypt(p_passcode, g.passcode_hash) <> g.passcode_hash then
      return jsonb_build_object('status', 'invalid_passcode', 'to_name', g.to_name);
    end if;
  end if;

  update public.flower_gifts
  set opened_at = coalesce(opened_at, now())
  where id = g.id;

  return jsonb_build_object(
    'status', 'ok',
    'bouquet', g.bouquet,
    'font', g.font,
    'to_name', g.to_name,
    'from_name', g.from_name,
    'message', g.message,
    'created_at', g.created_at
  );
end;
$$;

-- Tight grants: no default PUBLIC execute on these functions.
revoke all on function public.create_flower_gift(text, text, text, text, smallint, text) from public;
revoke all on function public.list_my_flower_gifts() from public;
revoke all on function public.delete_flower_gift(uuid) from public;
revoke all on function public.open_flower_gift(text, text) from public;

grant execute on function public.create_flower_gift(text, text, text, text, smallint, text) to authenticated;
grant execute on function public.list_my_flower_gifts() to authenticated;
grant execute on function public.delete_flower_gift(uuid) to authenticated;
grant execute on function public.open_flower_gift(text, text) to anon, authenticated;
