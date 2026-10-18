import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('RLS Security & Privacy Architecture Policies', () => {
  const schemaSql = fs.readFileSync(
    path.resolve(__dirname, '../supabase/migrations/20261016_initial_schema.sql'),
    'utf-8'
  );
  const rlsSql = fs.readFileSync(
    path.resolve(__dirname, '../supabase/migrations/20261016_rls_policies.sql'),
    'utf-8'
  );
  const triggersSql = fs.readFileSync(
    path.resolve(__dirname, '../supabase/migrations/20261016_triggers.sql'),
    'utf-8'
  );

  it('enables Row-Level Security on all five core data tables', () => {
    const requiredTables = ['profiles', 'shelves', 'notes', 'response_letters', 'note_reports'];

    for (const table of requiredTables) {
      const enableRegex = new RegExp(
        `ALTER TABLE\\s+public\\.${table}\\s+ENABLE ROW LEVEL SECURITY;`,
        'i'
      );
      expect(rlsSql).toMatch(enableRegex);
    }
  });

  it('guarantees profiles table contains no email column to preserve pseudonymous identity', () => {
    // The profiles table should never define an email column
    expect(schemaSql).not.toMatch(/CREATE TABLE public\.profiles[^;]+email/is);
    expect(schemaSql).toMatch(/pen_name text.*unique/i);
    expect(schemaSql).toMatch(/avatar_color text DEFAULT/i);
  });

  it('enforces strict public read policy on notes requiring both is_public and clean moderation', () => {
    expect(rlsSql).toMatch(/CREATE POLICY "Notes visibility policy"/i);
    expect(rlsSql).toMatch(/is_public = true\s+and\s+moderation_status = 'clean'/i);
  });

  it('enforces note tenant isolation so authors can only manage their own notes', () => {
    expect(rlsSql).toMatch(/auth\.uid\(\) = user_id/i);
  });

  it('restricts public response letters so only author-approved clean letters are visible', () => {
    expect(rlsSql).toMatch(/CREATE POLICY "Response letters visibility policy"/i);
    expect(rlsSql).toMatch(/is_approved_by_note_owner = true\s+and\s+moderation_status = 'clean'/i);
  });

  it('implements automated community safety threshold trigger at 3 reports', () => {
    expect(triggersSql).toMatch(/current_count >= 3/i);
    expect(triggersSql).toMatch(/moderation_status = 'flagged_hidden'/i);
  });
});
