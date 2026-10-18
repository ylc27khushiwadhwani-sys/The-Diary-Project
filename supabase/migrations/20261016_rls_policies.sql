-- The Library of Unsent Things: Row-Level Security Policies
-- Migration: 20261016_rls_policies.sql

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.shelves enable row level security;
alter table public.notes enable row level security;
alter table public.response_letters enable row level security;
alter table public.note_reports enable row level security;

-- ==============================================================================
-- 1. Profiles Policies
-- ==============================================================================
-- Anyone can view pen names (needed to display author of public notes)
create policy "Public profiles are readable by anyone"
  on public.profiles for select
  using (true);

-- Users can update only their own profile pen name / avatar
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ==============================================================================
-- 2. Shelves Policies
-- ==============================================================================
-- Strictly private to the owning writer
create policy "Users can view their own shelves only"
  on public.shelves for select
  using (auth.uid() = user_id);

create policy "Users can create their own shelves"
  on public.shelves for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own shelves"
  on public.shelves for update
  using (auth.uid() = user_id);

create policy "Users can delete their own shelves"
  on public.shelves for delete
  using (auth.uid() = user_id);

-- ==============================================================================
-- 3. Notes Policies
-- ==============================================================================
-- An author sees their own notes. Public readers see only public, clean, unlocked notes.
create policy "Notes visibility policy"
  on public.notes for select
  using (
    (auth.uid() = user_id)
    or
    (is_public = true and moderation_status = 'clean' and is_locked = false)
  );

create policy "Users can create their own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on public.notes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- ==============================================================================
-- 4. Response Letters Policies
-- ==============================================================================
-- Select: Author of response, or author of target note, or public if approved & clean
create policy "Response letters visibility policy"
  on public.response_letters for select
  using (
    (auth.uid() = author_id)
    or
    (auth.uid() in (select user_id from public.notes where id = response_letters.note_id))
    or
    (is_approved_by_note_owner = true and moderation_status = 'clean')
  );

-- Only authenticated users can write a response letter under their profile
create policy "Users can submit response letters"
  on public.response_letters for insert
  with check (auth.uid() = author_id);

-- Only the owner of the target note can update the approval status (Pin / Unpin)
create policy "Note authors can update approval of responses"
  on public.response_letters for update
  using (auth.uid() in (select user_id from public.notes where id = response_letters.note_id));

-- Response author or Note author can delete a response
create policy "Response author or note author can delete responses"
  on public.response_letters for delete
  using (
    (auth.uid() = author_id)
    or
    (auth.uid() in (select user_id from public.notes where id = response_letters.note_id))
  );

-- ==============================================================================
-- 5. Note Reports Policies
-- ==============================================================================
-- Authenticated users can submit a report
create policy "Authenticated users can submit reports"
  on public.note_reports for insert
  with check (auth.role() = 'authenticated');
