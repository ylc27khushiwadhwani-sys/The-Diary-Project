-- The Library of Unsent Things: Automated Database Triggers
-- Migration: 20261016_triggers.sql

-- 1. Automatic Profile & Shelf Provisioning on User Signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  adjectives text[] := array['Wandering', 'Silent', 'Midnight', 'Gentle', 'Quiet', 'Patient', 'Distant', 'Amber', 'Hollow', 'Golden', 'Fading', 'Velvet'];
  nouns text[] := array['Quill', 'Lantern', 'Echo', 'Sparrow', 'River', 'Shadow', 'Whisper', 'Compass', 'Archive', 'Keeper', 'Poet', 'Haven'];
  chosen_name text;
  random_adj text;
  random_noun text;
  random_suffix int;
begin
  random_adj := adjectives[floor(random() * array_length(adjectives, 1) + 1)];
  random_noun := nouns[floor(random() * array_length(nouns, 1) + 1)];
  random_suffix := floor(random() * 900 + 100)::int;
  chosen_name := random_adj || ' ' || random_noun || ' #' || random_suffix;

  -- Create anonymous profile
  insert into public.profiles (id, pen_name, avatar_color)
  values (new.id, chosen_name, '#52796F')
  on conflict (id) do nothing;

  -- Seed starter shelves for the writer
  insert into public.shelves (user_id, name, icon)
  values 
    (new.id, 'Unspoken Words', 'feather'),
    (new.id, 'Things I Kept to Myself', 'book-open'),
    (new.id, 'Letters Never Sent', 'mail');

  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Automatic Auto-Hide on Report Threshold
create or replace function public.handle_note_report_threshold()
returns trigger as $$
declare
  current_count int;
begin
  -- Increment report count on the note
  update public.notes
  set report_count = report_count + 1
  where id = new.note_id
  returning report_count into current_count;

  -- Auto-hide if threshold of 3 distinct reports is reached
  if current_count >= 3 then
    update public.notes
    set moderation_status = 'flagged_hidden'
    where id = new.note_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_note_reported on public.note_reports;
create trigger on_note_reported
  after insert on public.note_reports
  for each row execute function public.handle_note_report_threshold();
