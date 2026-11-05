/** First-person lines for the Librarian, the library's resident presence. */

export const landingIntro =
  "I'm the Librarian. Every letter on these shelves was written by someone who couldn't say it out loud. I keep them safe, and I don't ask names.";

export const readingGreeting = (visits: number, hourLabel: string): string =>
  visits <= 1
    ? "First time in the Reading Room. I set out one letter each day - today's is on the lectern, still sealed."
    : `Visit number ${visits}. ${hourLabel} - and today's letter is still waiting for you.`;

export const studyGreeting = (
  daysWritten: number,
  thread: number,
): string => {
  if (daysWritten === 0)
    return "The desk is yours. The ink doesn't judge, and neither do I.";
  if (thread >= 2)
    return `You've written ${thread} days in a row. No streaks here - the ink is patient - but I noticed.`;
  return `You've written on ${daysWritten} ${daysWritten === 1 ? "day" : "days"} now. The shelf remembers every one.`;
};

export const unsealNotice = (count: number): string =>
  count === 1
    ? "A letter from your past self unsealed today. It's on the desk whenever you're ready."
    : `${count} letters from your past self unsealed. They're on the desk whenever you're ready.`;

export const completionLine =
  "This letter is a little less lonely now. Thank you for sitting with it.";

export const nextLetterLine =
  "Let me pull the next one off the shelf for you.";
