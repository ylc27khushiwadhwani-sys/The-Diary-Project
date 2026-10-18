-- The Library of Unsent Things: Initial Database Schema
-- Migration: 20261016_initial_schema.sql

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Anonymous Pen Names)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  pen_name text unique not null,
  avatar_color text default '#52796F',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_profiles_pen_name on public.profiles (pen_name);

-- 2. Shelves Table (Private Organization)
create table if not exists public.shelves (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  icon text default 'bookmark',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_shelves_user_id on public.shelves (user_id);

-- 3. Notes Table (Private & Selectively Shared Letters)
create table if not exists public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  shelf_id uuid references public.shelves(id) on delete set null,
  title text,
  content text not null,
  prompt_id text,
  is_locked boolean default false not null,
  passcode_hash text,
  is_public boolean default false not null,
  allow_responses boolean default false not null,
  moderation_status text default 'clean' not null check (moderation_status in ('clean', 'held_private', 'flagged_hidden')),
  report_count integer default 0 not null,
  published_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_notes_user_id on public.notes (user_id);
create index if not exists idx_notes_shelf_id on public.notes (shelf_id);
create index if not exists idx_notes_public_clean on public.notes (is_public, moderation_status, created_at desc) where is_public = true and moderation_status = 'clean';

-- 4. Response Letters Table (Threaded Anonymous Letters in Response)
create table if not exists public.response_letters (
  id uuid default gen_random_uuid() primary key,
  note_id uuid references public.notes(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_approved_by_note_owner boolean default false not null,
  moderation_status text default 'clean' not null check (moderation_status in ('clean', 'held_private', 'flagged_hidden')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_response_letters_note_id on public.response_letters (note_id);
create index if not exists idx_response_letters_author_id on public.response_letters (author_id);
create index if not exists idx_response_letters_approved on public.response_letters (note_id, is_approved_by_note_owner) where is_approved_by_note_owner = true;

-- 5. Note Reports Table (Community Backstop)
create table if not exists public.note_reports (
  id uuid default gen_random_uuid() primary key,
  note_id uuid references public.notes(id) on delete cascade not null,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_note_reports_note_id on public.note_reports (note_id);
