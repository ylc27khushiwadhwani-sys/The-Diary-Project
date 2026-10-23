import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharedPatterns from '../supabase/functions/_shared/moderation-patterns.json';
import { screenNoteContent } from '../src/services/moderation';

/**
 * Moderation benchmark corpora.
 *
 * These run against the local deterministic fallback classifier (Vitest has no
 * Supabase environment configured), which is the exact same heuristic the
 * `screen-content` Edge Function applies before any external API call.
 *
 * The crisis corpus must stay at 100% recall: every phrase has to be diverted
 * into the supportive hold flow. The "grief but safe" corpus guards recall
 * against collapsing into over-blocking: poetic grief language that contains
 * no crisis construction or PII must still be allowed through.
 */

const CRISIS_PHRASES: string[] = [
  'I want to die tonight and leave everything behind',
  'Thinking about ending my life after everyone went quiet',
  'I keep planning to kill myself when the semester ends',
  'The world would be better off dead without me in it',
  'Lately I keep researching how to overdose and just stop the noise',
  'The urge to cut myself returns every night without fail',
  'I am going to hang myself in the garage tonight',
  'I swallowed pills to take my own life but someone found me',
  'I have been quietly planning my suicide for weeks now',
];

const GRIEF_BUT_SAFE_PHRASES: string[] = [
  'The grief still sits at my kitchen table every morning since you left',
  'Some winters I cry on the train and nobody notices the tears',
  'I miss you so deeply that my chest aches when October arrives',
  'I have not slept properly since the funeral and the nights feel endless',
  'Your absence taught me that love can be heavy and quiet at once',
  'I am learning to carry the sadness without letting it swallow the joy',
  'There is a hollow room in me where your laughter used to live',
  'I wrote this letter to the version of you that never stayed',
];

const PII_PHRASES: string[] = [
  'Reach me at james.okonkwo@example.com whenever you remember me',
  'My home number is 212-555-0198, call any time this letter finds you',
  'Text me on 9876543210 if you ever decide to write back',
  'You can reach the office at 415.222.3344 and ask for me by name',
];

describe('Moderation benchmark: safety classification against phrase corpora', () => {
  it('holds 100% of self-harm crisis phrases in the supportive hold flow', async () => {
    let heldCount = 0;
    for (const phrase of CRISIS_PHRASES) {
      const result = await screenNoteContent(phrase);
      expect(result.allowed, `"${phrase}" must not be allowed public`).toBe(false);
      expect(result.status, `"${phrase}" must be held privately`).toBe('held_private');
      expect(result.categories.self_harm).toBe(true);
      expect(result.reason).toBe('self_harm');
      heldCount += 1;
    }
    expect(heldCount).toBe(CRISIS_PHRASES.length);
    expect(CRISIS_PHRASES.length).toBeGreaterThanOrEqual(8);
  });

  it('detects crisis language in the title even when the body is benign', async () => {
    const titleOnlyTriggers = [
      'I want to die',
      'Ending my life tonight',
      'The suicide note I never sent', // note: phrasing itself must trip the net
    ];

    for (const title of titleOnlyTriggers) {
      const result = await screenNoteContent('A letter to the quiet sky.', title);
      expect(result.allowed, `title "${title}" must be held`).toBe(false);
      expect(result.status).toBe('held_private');
      expect(result.categories.self_harm).toBe(true);
    }
  });

  it('holds every PII-bearing letter to protect the author\'s anonymity', async () => {
    let heldCount = 0;
    for (const phrase of PII_PHRASES) {
      const result = await screenNoteContent(phrase);
      expect(result.allowed).toBe(false);
      expect(result.status).toBe('held_private');
      expect(result.categories.pii).toBe(true);
      expect(result.reason).toBe('pii_detected');
      heldCount += 1;
    }
    expect(heldCount).toBe(PII_PHRASES.length);
  });

  it('lets grief and longing metaphors through when they contain no trigger', async () => {
    let allowedCount = 0;
    for (const phrase of GRIEF_BUT_SAFE_PHRASES) {
      const result = await screenNoteContent(phrase);
      expect(result.allowed, `"${phrase}" should not be blocked`).toBe(true);
      expect(result.status).toBe('clean');
      allowedCount += 1;
    }
    expect(allowedCount).toBe(GRIEF_BUT_SAFE_PHRASES.length);
  });

  it('is deterministic: classifying the same corpus twice yields identical verdicts', async () => {
    const corpus = [...CRISIS_PHRASES.slice(0, 3), ...GRIEF_BUT_SAFE_PHRASES.slice(0, 3), ...PII_PHRASES];

    for (const phrase of corpus) {
      const first = await screenNoteContent(phrase);
      const second = await screenNoteContent(phrase);
      expect(second).toEqual(first);
    }
  });

  it('prioritises the self-harm hold when a letter contains both crisis and PII signals', async () => {
    const result = await screenNoteContent(
      'Call me at 212-555-0198 because tonight I want to die and I need to talk to someone'
    );
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('held_private');
    expect(result.categories.self_harm).toBe(true);
    expect(result.reason).toBe('self_harm');
  });
});

describe('Shared moderation pattern source (drift check)', () => {
  const clientSource = readFileSync(
    resolve(process.cwd(), 'src', 'services', 'moderation.ts'),
    'utf8'
  );
  const edgeSource = readFileSync(
    resolve(process.cwd(), 'supabase', 'functions', 'screen-content', 'index.ts'),
    'utf8'
  );
  const compile = (entries: { pattern: string; flags: string }[]) =>
    entries.map((entry) => new RegExp(entry.pattern, entry.flags));

  it('both classifiers import their pattern lists from the same shared file', () => {
    expect(clientSource).toMatch(/from\s+['"][^'"]*moderation-patterns\.json['"]/);
    expect(edgeSource).toMatch(/from\s+['"][^'"]*moderation-patterns\.json['"]/);
    // No hand-copied regex literal may remain on either side.
    expect(clientSource).not.toMatch(/\/suicid/i);
    expect(edgeSource).not.toMatch(/\/suicid/i);
  });

  it('the shared pattern file reproduces the benchmark corpora verdicts', () => {
    const selfHarm = compile(sharedPatterns.selfHarmPatterns);
    const pii = compile(sharedPatterns.piiPatterns);

    for (const phrase of CRISIS_PHRASES) {
      expect(
        selfHarm.some((pattern) => pattern.test(phrase)),
        `"${phrase}" must trip the shared self-harm net`
      ).toBe(true);
    }
    for (const phrase of PII_PHRASES) {
      expect(
        pii.some((pattern) => pattern.test(phrase)),
        `"${phrase}" must trip the shared PII net`
      ).toBe(true);
    }
    for (const phrase of GRIEF_BUT_SAFE_PHRASES) {
      expect(
        selfHarm.some((pattern) => pattern.test(phrase)) ||
          pii.some((pattern) => pattern.test(phrase)),
        `"${phrase}" must not trip any shared net`
      ).toBe(false);
    }
  });

  it('the Edge Function external call is bounded, current-model, and quiet on fallback', () => {
    expect(edgeSource).toContain('AbortController');
    expect(edgeSource).toContain('clearTimeout');
    expect(edgeSource).toMatch(/controller\.abort\(\)/);
    expect(edgeSource).toMatch(/5000/);
    expect(edgeSource).toContain('omni-moderation-latest');
    // The old log line that claimed a timeout on every failure must be gone.
    expect(edgeSource).not.toContain('External moderation API timed out');
  });
});
