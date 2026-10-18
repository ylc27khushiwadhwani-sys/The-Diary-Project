import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ModerationResult } from '../types/database';

const LOCAL_SELF_HARM_PATTERNS = [
  /suicid/i,
  /kill(?:ing)?\s+myself/i,
  /want(?:ing)?\s+to\s+die/i,
  /end(?:ing)?\s+(?:my|this)\s+life/i,
  /self[- ]harm/i,
  /cut(?:ting)?\s+myself/i,
  /take\s+my\s+(?:own\s+)?life/i,
  /hang(?:ing)?\s+myself/i,
  /overdose/i,
  /better\s+off\s+dead/i,
];

const LOCAL_PII_PATTERNS = [
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  /\b\d{10}\b/,
];

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
