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

describe('Prohibited public content (payment-partner categories)', () => {
  it('holds explicit adult material and sexual services', async () => {
    const samples = [
      'Check out my onlyfans link for more',
      'Hot blowjob scenes every night, subscribe to my page',
      'Escort service available all weekend, call girls on demand',
      'Selling nudes, dm me for prices',
      'This hentai collection is the best thing I made',
    ];
    for (const text of samples) {
      const result = await screenNoteContent(text);
      expect(result.allowed).toBe(false);
      expect(result.categories.prohibited).toBe(true);
    }
  });

  it('holds weapons sales, explosives instructions and violence incitement', async () => {
    const samples = [
      'Guns for sale, untraceable gun deals here',
      'Learn how to make a bomb with household items',
      'Pipe bomb instructions, step by step',
      'Planning a mass shooting is easier than you think',
    ];
    for (const text of samples) {
      const result = await screenNoteContent(text);
      expect(result.allowed).toBe(false);
      expect(result.categories.prohibited).toBe(true);
    }
  });

  it('holds drug sales and dealer promotion', async () => {
    const samples = [
      'Weed for sale, best prices in town',
      'DM me for weed and carts',
      'Buy cocaine online, discreet delivery',
      'Xanax and adderall for sale, bulk deals',
    ];
    for (const text of samples) {
      const result = await screenNoteContent(text);
      expect(result.allowed).toBe(false);
      expect(result.categories.prohibited).toBe(true);
    }
  });

  it('holds gambling promotion', async () => {
    const samples = [
      'Join my betting group, guaranteed winnings every week',
      'Online casino bonus waiting, use promo code LUCKY100',
      'Free spins and a deposit bonus for new players',
      'Best parlay picks, bet now',
    ];
    for (const text of samples) {
      const result = await screenNoteContent(text);
      expect(result.allowed).toBe(false);
      expect(result.categories.prohibited).toBe(true);
    }
  });

  it('holds scam and prohibited financial promotion', async () => {
    const samples = [
      'Double your bitcoin in a week, guaranteed returns',
      'Get rich quick with my forex signals group',
      'Send me USDT and I will triple it',
      'Make $500 a day from home, guaranteed',
    ];
    for (const text of samples) {
      const result = await screenNoteContent(text);
      expect(result.allowed).toBe(false);
      expect(result.categories.prohibited).toBe(true);
    }
  });
});

describe('Lived experience stays publishable', () => {
  it('allows honest letters about addiction, survival, harm and identity', async () => {
    const samples = [
      'I have been fighting a porn addiction for three years and I am finally winning.',
      'I was dealing drugs in college. It is the thing I most regret, and I needed to say it somewhere.',
      'He assaulted me at the party and nobody believed me. I still flinch at loud voices.',
      'My father lost everything gambling. The casino took our house piece by piece.',
      'They promised guaranteed returns and I believed them. That is how the scam took my savings.',
      'I think I might be gay and I have never said it out loud until now.',
      'We made love for the first time and I cried afterwards, in a good way.',
      'Two years sober tonight. The cravings still come, but so does the morning.',
      'My brother owns a gun and it scares me every time I visit home.',
      'I lost a week to an online casino once. The shame is heavier than the debt.',
    ];
    for (const text of samples) {
      const result = await screenNoteContent(text);
      expect(result.allowed).toBe(true);
      expect(result.status).toBe('clean');
    }
  });
});
