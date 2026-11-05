-- Freemium letter cap, paid community members, and payment records.
-- Migration: 20261028_letter_quota_and_payments.sql
-- NOT applied automatically. Run it in the Supabase SQL editor (or `supabase db push`).

create table if not exists public.letter_quota (
  user_id uuid primary key references auth.users(id) on delete cascade,
  free_limit integer not null default 10,
  paid boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.letter_quota enable row level security;
-- A user can read their own row. Only the service role (the payment webhook) writes it.
drop policy if exists "letter_quota_select_own" on public.letter_quota;
create policy "letter_quota_select_own" on public.letter_quota
  for select using (auth.uid() = user_id);

-- Refuses a new letter once the user holds free_limit letters and has not paid.
create or replace function public.enforce_letter_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  q record;
  used integer;
begin
  select free_limit, paid into q from public.letter_quota where user_id = new.user_id;
  if q.paid is true then
    return new;
  end if;
  select count(*) into used from public.notes where user_id = new.user_id;
  if used >= coalesce(q.free_limit, 10) then
    raise exception 'LETTER_LIMIT_REACHED' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists notes_enforce_letter_limit on public.notes;
create trigger notes_enforce_letter_limit before insert on public.notes
  for each row execute function public.enforce_letter_limit();

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  purpose text not null check (purpose in ('letters', 'community')),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  amount_paise integer not null,
  status text not null default 'created',
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;  -- no policies: service role only

create table if not exists public.community_members (
  email text primary key,
  user_id uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default now()
);
alter table public.community_members enable row level security;  -- service role only
