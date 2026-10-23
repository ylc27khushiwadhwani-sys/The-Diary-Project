-- The Library of Unsent Things: Tags for private-library discovery
-- Migration: 20261023_add_note_tags.sql

-- Writer-assigned tags, searched client-side alongside title/content (R6).
alter table public.notes
  add column if not exists tags text[] default '{}';
