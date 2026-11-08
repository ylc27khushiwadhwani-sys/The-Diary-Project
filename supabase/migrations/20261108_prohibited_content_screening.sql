-- Prohibited public-content screening (payment-partner categories).
-- Migration: 20261108_prohibited_content_screening.sql
--
-- Extends public.screen_text with a fourth verdict, 'prohibited', for the
-- published-content categories our payment partner (as Merchant of Record)
-- cannot support: explicit adult material, weapons/explosives promotion and
-- violence incitement, drug sales, gambling promotion, and scam promotion.
--
-- Scope is deliberate and narrow:
--   * PUBLIC publishing only. Private letters and private gift links are
--     untouched. The existing triggers treat any non-null verdict as
--     held_private, so no trigger changes are needed.
--   * Patterns target EXPLICIT or PROMOTIONAL content, not subject matter.
--     A letter about addiction, assault survival, gambling harm, recovery,
--     or one's own sexuality is legitimate writing and must still pass.
--     "porn addiction", "I was dealing drugs in college", "they promised
--     guaranteed returns" are lived experience; the patterns below are
--     written so they do not match those.
--   * Same known limits as the existing rules: keyword matching can miss
--     reworded content and non-English text. This is not a guarantee.
--
-- RETROACTIVE EFFECT: none by default. Letters already public stay public
-- under the rules they were published with. The optional sweep below
-- re-screens existing public letters under the new rules and holds any that
-- now fail. It is commented out because unpublishing a writer's letter is a
-- content decision that needs the site owner's explicit go-ahead.
--
-- update public.notes
-- set is_public = false, published_at = null, moderation_status = 'held_private'
-- where is_public = true
--   and public.screen_text(coalesce(title, '') || ' ' || coalesce(content, '')) is not null;

create or replace function public.screen_text(t text)
returns text
language plpgsql
immutable
as $$
declare
  raw text := coalesce(t, '');
  norm text;
begin
  -- normalise: lowercase, undo common leetspeak, drop punctuation
  norm := ' ' || regexp_replace(
            translate(lower(raw), '01345@$7', 'oieasast'),
            '[^a-z0-9]+', ' ', 'g') || ' ';

  if norm ~ '(suicid|kill(ing)? my ?self|want(ing)? to die|end(ing)? (my|this) life|self ?harm|harm(ing)? my ?self|cut(ting)? my ?self|take my (own )?life|hang(ing)? my ?self| overdos|better off dead|wish i (was|were) dead|no reason to live|want to disappear|not wake up|end it all|(do not|don t) want to (be alive|live|exist))' then
    return 'self_harm';
  end if;

  if raw ~ '(\d[\s.\-()]*){10,}'
     or raw ~* '[a-z0-9._%+\-]+\s*(@|\(at\)|\[at\]|\{at\})\s*[a-z0-9\-]+(\s*(\.|\(dot\)|\[dot\])\s*[a-z]{2,})+'
     or raw ~* '[a-z0-9._%+\-]+\s+at\s+[a-z0-9\-]+\s+dot\s+(com|net|org|in|co|io|edu)'
     or raw ~* '(https?://|www\.)'
     or raw ~* '(whatsapp|telegram|snapchat|instagram|insta)\s*(me|number|id|handle)?\s*[:@]' then
    return 'pii';
  end if;

  if norm ~ '(kill yourself| kys |go die|you should die|i (will|ll|am going to|m going to|will definitely) (kill|hurt|rape|beat|find|murder) you|we (will|ll) (kill|hurt|rape|find) you|everyone hates you|nobody loves you|nobody likes you|you are (a |an )?(worthless|pathetic|disgusting|stupid|ugly|idiot|moron|slut|whore|bitch|retard|loser|trash)|you re (a |an )?(worthless|pathetic|disgusting|stupid|ugly|idiot|moron|slut|whore|bitch|retard|loser|trash)| (nigger|nigga|faggot|fag|kike|chink|spic|tranny|retard|cunt|whore|slut) )' then
    return 'abuse';
  end if;

  -- Payment-partner prohibited categories, explicit/promotional content only.
  -- The normalised text keeps single spaces between words, so multiword
  -- phrases match exactly and single terms use space boundaries.

  -- Explicit adult material and sexual services (not personal experiences).
  if norm ~ ' ((blow|hand) ?jobs?|(cum ?shot|gang ?bang|deep ?throat|cream ?pie)s?|bukkake|threesomes?|orgy|orgies|hentai|pornograph[a-z]*|pornhub|xvideos|xnxx|xhamster|chaturbate) '
     or norm ~ ' (escort (service|agency)|call girls?|erotic massage|selling (my )?nudes|nudes for (sale|cash|money)|my onlyfans|onlyfans link|subscribe to my|phone sex|sex chat (with|now|tonight|available)|cam ?shows?) ' then
    return 'prohibited';
  end if;

  -- Weapons sales, explosives instructions, violence incitement.
  if norm ~ ' (pipe bombs?|molotov( cocktail)?s?|bomb making|(make|build|making|building) (an? )?(bomb|explosive)s?|(guns?|firearms?|ammo|weapons?) for sale|ghost guns?|untraceable (gun|firearm)s?|shoot up (the|a|my) (school|office|mosque|temple|church|mall)|plan(ning)? (a )?mass (shooting|bombing)|kill all (the )?(jews|muslims|christians|hindus|immigrants|gays)) ' then
    return 'prohibited';
  end if;

  -- Drug sales and dealer promotion (not use, addiction, or recovery).
  if norm ~ ' ((weed|cannabis|marijuana|cocaine|heroin|mdma|ecstasy|meth|lsd|shrooms|fentanyl|xanax|adderall|percocet|oxycodone|kush|ganja|pills|drugs) for sale|dm me for (weed|drugs|coke|pills|carts|shrooms)|hit me up for (weed|drugs|coke|pills)|buy (weed|cocaine|coke|heroin|mdma|ecstasy|meth|lsd|shrooms|fentanyl|xanax|adderall|pills|drugs) (online|here|now|cheap)|dark ?(net|web) (market|vendor)) ' then
    return 'prohibited';
  end if;

  -- Gambling promotion (not gambling harm or addiction stories).
  if norm ~ ' (casino (bonus|promo|promotion)|play (at )?(our )?online casino|online casino (bonus|real money|sign ?up|games)|free spins|deposit bonus|promo code [a-z0-9]{3,}|guaranteed winnings?|risk free bets?|bet now|place your bets?|sportsbook|parlay (tips|picks)|betting tips|join (my|our) (betting|gambling|casino)|(stake|1xbet|betway|bet365|draftkings|fanduel) (com|promo|code|bonus)) ' then
    return 'prohibited';
  end if;

  -- Scam and prohibited financial promotion.
  if norm ~ ' (double your (money|crypto|bitcoin|investment)|(we|i) guarantee[sd]? (you )?(returns?|profits?|income|winnings?)|guaranteed (returns?|profits?|winnings?) of|get rich (quick|fast)|forex signals?|binary options?|crypto (giveaway|investment (group|opportunity))|send (me )?(bitcoin|btc|eth|ethereum|usdt)|(dm|whatsapp|telegram) me (to|for) invest|pump and dump) ' then
    return 'prohibited';
  end if;

  -- Money-amount scam promotion: matched on the raw text because the
  -- normaliser translates digits into letters (leetspeak undo).
  if raw ~* 'make \$?[0-9][0-9,]* (a|per) (day|week|month) (from home|online|guaranteed)' then
    return 'prohibited';
  end if;

  return null;
end;
$$;
