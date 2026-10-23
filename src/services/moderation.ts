import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ModerationResult } from '../types/database';
import sharedPatterns from '../../supabase/functions/_shared/moderation-patterns.json';

// One shared pattern source (supabase/functions/_shared/moderation-patterns.json),
// compiled identically here and in the screen-content Edge Function so the two
// classifiers can never drift apart.
const compilePatterns = (entries: { pattern: string; flags: string }[]) =>
  entries.map((entry) => new RegExp(entry.pattern, entry.flags));

const LOCAL_SELF_HARM_PATTERNS = compilePatterns(sharedPatterns.selfHarmPatterns);
const LOCAL_PII_PATTERNS = compilePatterns(sharedPatterns.piiPatterns);

export async function screenNoteContent(content: string, title: string = ''): Promise<ModerationResult> {
  const fullText = `${title} ${content}`.trim();

  // If live Supabase Edge Function is configured, invoke it
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('screen-content', {
        body: { content, title },
      });
      if (!error && data) {
        return data as ModerationResult;
      }
    } catch (err) {
      console.warn('Edge function invoke failed, using local safety classifier fallback:', err);
    }
  }

  // Local fallback classifier
  const isSelfHarm = LOCAL_SELF_HARM_PATTERNS.some((pattern) => pattern.test(fullText));
  const isPII = LOCAL_PII_PATTERNS.some((pattern) => pattern.test(fullText));

  if (isSelfHarm) {
    return {
      allowed: false,
      status: 'held_private',
      categories: {
        self_harm: true,
        pii: false,
        abuse: false,
      },
      reason: 'self_harm',
    };
  }

  if (isPII) {
    return {
      allowed: false,
      status: 'held_private',
      categories: {
        self_harm: false,
        pii: true,
        abuse: false,
      },
      reason: 'pii_detected',
    };
  }

  return {
    allowed: true,
    status: 'clean',
    categories: {
      self_harm: false,
      pii: false,
      abuse: false,
    },
  };
}
