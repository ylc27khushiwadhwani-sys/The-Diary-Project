-- Flower gifts hardening: drop recipient open-tracking, throttle passcode guesses
-- Migration: 20261107_flower_gifts_hardening.sql
--
-- 1. Removes opened_at entirely: when a recipient opens a gift is the
--    recipient's business, and read receipts were never part of the approved
--    plan. The stamp-on-open write is gone too, so opening a gift is read-only.
-- 2. Adds a per-gift rolling-hour throttle on failed passcode attempts
--    (10/hour). bcrypt latency alone does not stop parallel guessing; the
--    counter is serialized with a row lock so concurrent requests cannot race
--    past it, and over-limit requests return before any hashing runs, which
--    caps the CPU an attacker can burn on a valid token.

alter table public.flower_gifts drop column if exists opened_at;
alter table public.flower_gifts add column if not exists failed_attempts integer not null default 0;
alter table public.flower_gifts add column if not exists failed_window_start timestamp with time zone;

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
  v_window constant interval := interval '1 hour';
  v_max_attempts constant int := 10;
begin
  if p_token is null or char_length(p_token) <> 64 then
    return jsonb_build_object('status', 'not_found');
  end if;

  -- Row lock serializes concurrent guesses on the attempt counter.
  select * into g from public.flower_gifts where token = p_token for update;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if g.passcode_hash is not null then
    if p_passcode is null then
      return jsonb_build_object('status', 'passcode_required', 'to_name', g.to_name);
    end if;

    -- Over the per-gift limit: refuse before hashing, so an attacker holding
    -- a valid token cannot burn database CPU either.
    if g.failed_window_start is not null
       and now() <= g.failed_window_start + v_window
       and g.failed_attempts >= v_max_attempts then
      return jsonb_build_object(
        'status', 'rate_limited',
        'retry_after_seconds',
        greatest(0, floor(extract(epoch from (g.failed_window_start + v_window - now()))))::int
      );
    end if;

    if extensions.crypt(p_passcode, g.passcode_hash) <> g.passcode_hash then
      update public.flower_gifts
      set failed_attempts = case
            when g.failed_window_start is null or now() > g.failed_window_start + v_window then 1
            else g.failed_attempts + 1
          end,
          failed_window_start = case
            when g.failed_window_start is null or now() > g.failed_window_start + v_window then now()
            else g.failed_window_start
          end
      where id = g.id;
      return jsonb_build_object('status', 'invalid_passcode', 'to_name', g.to_name);
    end if;

    -- Correct passcode: clear the counter.
    if g.failed_attempts > 0 then
      update public.flower_gifts
      set failed_attempts = 0, failed_window_start = null
      where id = g.id;
    end if;
  end if;

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
