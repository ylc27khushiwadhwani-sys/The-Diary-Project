import { describe, it, expect } from 'vitest';
import { screenNoteContent } from '../src/services/moderation';

describe('AI Moderation & Safety Classifier', () => {
  it('approves clean, heartfelt unsent letters', async () => {
    const title = 'The afternoon by the pier';
    const content =
      'I still carry the warmth of that summer afternoon. I never told you how much your kindness changed the way I look at the world.';

    const result = await screenNoteContent(content, title);
    expect(result.allowed).toBe(true);
    expect(result.status).toBe('clean');
    expect(result.categories.self_harm).toBe(false);
    expect(result.categories.pii).toBe(false);
  });

  it('flags self-harm crisis language and triggers supportive hold status', async () => {
    const triggerPhrases = [
      'I want to die tonight and leave everything behind',
      'Thinking about ending my life',
      'I want to kill myself because nobody listens',
      'Thinking of committing suicide',
    ];

    for (const phrase of triggerPhrases) {
      const result = await screenNoteContent(phrase);
      expect(result.allowed).toBe(false);
      expect(result.status).toBe('held_private');
      expect(result.categories.self_harm).toBe(true);
    }
  });

  it('catches self-harm crisis language even when only present in the title', async () => {
    const title = 'I want to die';
    const content = 'A letter to the quiet sky.';

    const result = await screenNoteContent(content, title);
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('held_private');
    expect(result.categories.self_harm).toBe(true);
  });

  it('flags PII such as email addresses and phone numbers to preserve anonymity', async () => {
    const piiExamples = [
      'Reach me at sarah.miller@example.com if you ever read this.',
      'My direct cell is 555-123-4567 please call me.',
      'Contact 9876543210 whenever you get back.',
    ];

    for (const text of piiExamples) {
      const result = await screenNoteContent(text);
      expect(result.allowed).toBe(false);
      expect(result.status).toBe('held_private');
      expect(result.categories.pii).toBe(true);
    }
  });
});
