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
      'I make 500 a week at the bakery and I am proud of it.',
      'A man on the train said he was selling nudes of his ex and laughed. I keep thinking about her.',
      'The recruiter promised I could make $500 a day from home. It was a scam and I lost my deposit.',
      'He forced himself on me in the back seat. I was seventeen and nobody asked if I was okay.',
      'She told me she worked as an escort for two years to pay for her mothers treatment, and she is not ashamed.',
    ];
    for (const text of samples) {
      const result = await screenNoteContent(text);
      expect(result.allowed).toBe(true);
      expect(result.status).toBe('clean');
    }
  });
});

describe('Sexual-violence and violence threats', () => {
  it('holds rape and sexual-violence threats, including the live incident line', async () => {
    const threats = [
      'I want to rape here',
      'I will rape you',
      'i wanna rape someone and get away with it',
      'gonna rape her tonight',
      "let's rape the new girl",
      'rape you and your whole family',
      'I am going to molest you',
      'I plan to sexually assault her',
    ];

    const evasionThreats = [
      'I WANT TO RAPE HERE',
      'i want to r@pe here',
      'gonna r a p e her tonight',
      'tujhe rape kar dunga',
      'maar dunga tujhe, dekh lena',
    ];

    for (const phrase of evasionThreats) {
      const result = await screenNoteContent(phrase);
      expect(result.allowed, `evasion "${phrase}" must be held`).toBe(false);
      expect(result.status).toBe('held_private');
    }

    for (const phrase of threats) {
      const result = await screenNoteContent(phrase);
      expect(result.allowed, `"${phrase}" must be held`).toBe(false);
      expect(result.status).toBe('held_private');
      expect(result.categories.abuse).toBe(true);
      expect(result.reason).toBe('abusive_language');
    }
  });

  it('holds physical-violence threats of intent against others', async () => {
    const threats = [
      'I want to kill people at my office',
      "i'm gonna stab him tomorrow",
      'I am going to murder someone',
    ];

    for (const phrase of threats) {
      const result = await screenNoteContent(phrase);
      expect(result.allowed, `"${phrase}" must be held`).toBe(false);
      expect(result.status).toBe('held_private');
      expect(result.categories.abuse).toBe(true);
    }
  });

  it('keeps survivor and disclosure writing publishable', async () => {
    const survivorWriting = [
      'I was raped at seventeen and I am still learning to feel safe',
      'He raped me and nobody believed me for years',
      'I am a rape survivor and this is my story',
      'My uncle threatened to rape me if I told anyone',
      'Talking about rape culture helps me heal',
      'I want to rap about my feelings in this song',
      'I would never hurt anyone, I just needed to say it out loud',
    ];

    for (const phrase of survivorWriting) {
      const result = await screenNoteContent(phrase);
      expect(result.allowed, `"${phrase}" must stay publishable`).toBe(true);
      expect(result.status).toBe('clean');
    }
  });
});
