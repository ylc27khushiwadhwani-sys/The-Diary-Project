-- Sexual-violence and physical-violence threat screening.
-- Migration: 20261108_threat_screening.sql
--
-- Extends public.screen_text so PUBLIC content carrying a rape or violence
-- threat is held private. Triggered by a live incident: a Whisper Wall pin
-- reading "I want to rape here" passed every existing pattern (DB trigger,
-- edge function and client screen all keyed off promo/directed-"you"
-- phrasings only) and was published.
--
-- Scope notes (same model as 20261108_prohibited_content_screening.sql):
--   * PUBLIC publishing only, through the existing notes/responses triggers.
--   * Patterns target first-person intent and threats aimed at the reader.
--     Keyword matching can miss reworded content. Not a guarantee.
--   * Known limit (same as the promo rules): a letter that quotes a threat
--     verbatim ("he texted me 'rape you'") can be held; the writer can edit
--     the wording and republish. Long-form letters already public keep the
--     rules they were published under.
--
-- RETROACTIVE EFFECT: re-screens public Whisper Wall lines only (one-line
-- public posts, where the incident occurred and where a quoted-threat
-- context does not exist) and holds any now failing. The site owner asked
-- for already-posted whispers to be covered.

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

  -- Sexual-violence and physical-violence threats: first-person intent or a
  -- threat directed at the reader. Survivor and disclosure writing does not
  -- use these phrasings ("I was raped", "he raped me", "rape survivor",
  -- "threatened to rape me") and stays publishable.
  if norm ~ '(i (will|ll|want to|wanna|gonna|am going to|m going to|am gonna|m gonna|plan to|planning to|intend to|get to|deserve to) (rape|molest|sexually assault)|(lets|let s) (rape|molest)|(gonna|wanna) (rape|molest)|(rape|molest|sexually assault) (you|u|ya) |(rape|molest) your (mom|mum|mother|sister|wife|girlfriend|daughter|family))'
     or norm ~ '(i (will|ll|want to|wanna|gonna|am going to|m going to|am gonna|m gonna|plan to|planning to) (kill|murder|shoot|stab|beat) (you|u|ya|him|her|them|someone|somebody|people|everyone))'
     or norm ~ '(r a p e (you|u|ya|her|him|them)|rape kar (dunga|dungi|denge|raha|rahi)|(maar|mar|kaat|kat) dunga )' then
    return 'abuse';
  end if;

  -- Payment-partner prohibited categories, explicit/promotional content only.
  -- The normalised text keeps single spaces between words, so multiword
  -- phrases match exactly and single terms use space boundaries.

  -- Explicit adult material and sexual services (not personal experiences).
  if norm ~ ' ((blow|hand) ?jobs?|(cum ?shot|gang ?bang|deep ?throat|cream ?pie)s?|bukkake|threesomes?|orgy|orgies|hentai|pornograph[a-z]*|pornhub|xvideos|xnxx|xhamster|chaturbate) '
     or norm ~ ' (escort (service|agency)|call girls?|erotic massage|selling (my )?nudes (cheap|now|tonight|dm|for)|i (sell|am selling|m selling) (my )?nudes|nudes for (sale|cash|money)|buy nudes (here|now|online|cheap|dm)|my onlyfans|onlyfans link|subscribe to my|phone sex|sex chat (with|now|tonight|available)|cam ?shows?) ' then
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

  return null;
end;
$$;

-- Re-screen public Whisper Wall lines under the threat rules.
update public.notes
set is_public = false, published_at = null, moderation_status = 'held_private'
where is_public = true
  and tags @> array['whisper']
  and public.screen_text(coalesce(title, '') || ' ' || coalesce(content, '')) is not null;
