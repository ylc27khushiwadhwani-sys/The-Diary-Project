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
const LOCAL_ABUSE_PATTERNS = compilePatterns(
  (sharedPatterns as { abusePatterns?: { pattern: string; flags: string }[] })
    .abusePatterns ?? [],
);

// Public-publishing guardrails for payment-partner prohibited-content
// categories. These patterns target explicit or promotional content only:
// personal writing about addiction, assault survival, gambling harm,
// recovery or one's own sexuality is legitimate and stays publishable.
const PROHIBITED_GROUPS = [
  'adultContentPatterns',
  'violenceWeaponsPatterns',
  'drugPromotionPatterns',
  'gamblingPromotionPatterns',
  'scamPromotionPatterns',
] as const;
// Threat and evasion patterns evaluated on normalized text (lowercase,
// leetspeak undone, punctuation collapsed) - the same normalization the
// database screen_text() applies, so case, spacing and simple leet tricks
// cannot slip threats past the client while the database would hold them.
const normalizeForThreatScreen = (t: string): string =>
  ' ' +
  t
    .toLowerCase()
    .replace(/[01345@$7]/g, (ch) => 'oieasast'['01345@$7'.indexOf(ch)])
    .replace(/[^a-z0-9]+/g, ' ') +
  ' ';
const LOCAL_THREAT_PATTERNS = compilePatterns(
  (sharedPatterns as { threatPatterns?: { pattern: string; flags: string }[] })
    .threatPatterns ?? [],
);

const LOCAL_PROHIBITED_PATTERNS = compilePatterns(
  PROHIBITED_GROUPS.flatMap(
    (group) =>
      (sharedPatterns as Record<string, { pattern: string; flags: string }[]>)[
        group
      ] ?? [],
  ),
);

const blocked = (
  reason: 'self_harm' | 'pii_detected' | 'abusive_language' | 'prohibited_content',
): ModerationResult => ({
  allowed: false,
  status: 'held_private',
  categories: {
    self_harm: reason === 'self_harm',
    pii: reason === 'pii_detected',
    abuse: reason === 'abusive_language',
    prohibited: reason === 'prohibited_content',
  },
  reason,
});

// Local rule-based check. It always runs first, so an unreachable or failing
// edge function can never turn into an automatic "allowed". It is a keyword
// and pattern screen, not a trained classifier.
export function localScreen(fullText: string): ModerationResult | null {
  if (LOCAL_SELF_HARM_PATTERNS.some((p) => p.test(fullText))) return blocked('self_harm');
  if (LOCAL_PII_PATTERNS.some((p) => p.test(fullText))) return blocked('pii_detected');
  if (LOCAL_ABUSE_PATTERNS.some((p) => p.test(fullText))) return blocked('abusive_language');
  if (LOCAL_THREAT_PATTERNS.some((p) => p.test(normalizeForThreatScreen(fullText))))
    return blocked('abusive_language');
  if (LOCAL_PROHIBITED_PATTERNS.some((p) => p.test(fullText))) return blocked('prohibited_content');
  return null;
}

export async function screenNoteContent(content: string, title: string = ''): Promise<ModerationResult> {
  const fullText = `${title} ${content}`.trim();

  const local = localScreen(fullText);
  if (local) return local;

  // Second opinion from the edge function (adds an AI pass when a key is set).
  // If it cannot be reached, the database trigger still screens every write.
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('screen-content', {
        body: { content, title },
      });
      if (!error && data && (data as ModerationResult).allowed === false) {
        return data as ModerationResult;
      }
    } catch (err) {
      console.warn('Edge function invoke failed; local screen and database screen still apply:', err);
    }
  }

  return {
    allowed: true,
    status: 'clean',
    categories: { self_harm: false, pii: false, abuse: false, prohibited: false },
  };
}
