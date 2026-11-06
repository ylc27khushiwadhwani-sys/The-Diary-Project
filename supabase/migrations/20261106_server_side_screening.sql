-- Server-side content screening. Runs inside the database, so it applies to
-- every write path (editor, whisper wall, replies, or a hand-made API call).
-- Rule-based only: it catches obvious crisis language, contact details and
-- abusive phrases. It is not a substitute for a trained classifier.

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

  return null;
end;
$$;

-- Notes: a note can only be public if it passes; clients cannot un-hide.
create or replace function public.notes_enforce_screening()
returns trigger
language plpgsql
as $$
declare
  verdict text;
begin
  if tg_op = 'UPDATE'
     and old.moderation_status = 'flagged_hidden'
     and coalesce(auth.role(), '') <> 'service_role' then
    new.moderation_status := 'flagged_hidden';
  end if;

  if new.is_public then
    verdict := public.screen_text(coalesce(new.title, '') || ' ' || coalesce(new.content, ''));
    if verdict is not null then
      new.is_public := false;
      new.published_at := null;
      new.moderation_status := 'held_private';
    elsif new.moderation_status = 'held_private' then
      new.moderation_status := 'clean';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists notes_screening on public.notes;
create trigger notes_screening
  before insert or update on public.notes
  for each row execute function public.notes_enforce_screening();

-- Reader replies: failing text is held private and never shown.
create or replace function public.responses_enforce_screening()
returns trigger
language plpgsql
as $$
begin
  if public.screen_text(new.content) is not null then
    new.moderation_status := 'held_private';
    new.is_approved_by_note_owner := false;
  end if;
  return new;
end;
$$;

drop trigger if exists responses_screening on public.response_letters;
create trigger responses_screening
  before insert or update on public.response_letters
  for each row execute function public.responses_enforce_screening();

-- Sweep: anything already public that fails today is pulled back.
update public.notes
set is_public = false, published_at = null, moderation_status = 'held_private'
where is_public = true
  and public.screen_text(coalesce(title, '') || ' ' || coalesce(content, '')) is not null;
