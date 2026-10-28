export type HallHour = 'dawn' | 'day' | 'dusk' | 'night' | 'deep';

export const HALL_LABELS: Record<HallHour, string> = {
  dawn: 'Dawn light through the tall windows',
  day: 'Clear daylight in the hall',
  dusk: 'Dusk gathering at the glass',
  night: 'Moonlight and candles',
  deep: 'Deep night: the candles burn brightest',
};

export const hallHourFor = (hour: number): HallHour => {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  if (hour >= 20) return 'night';
  return 'deep'; // 0:00 - 4:59
};

/** ?tod=dawn|day|dusk|night|deep previews a lighting without waiting for the hour. */
export const currentHallHour = (now: Date = new Date()): HallHour => {
  try {
    const forced = new URLSearchParams(window.location.search).get('tod');
    if (forced && forced in HALL_LABELS) return forced as HallHour;
  } catch {
    /* ignore */
  }
  return hallHourFor(now.getHours());
};
