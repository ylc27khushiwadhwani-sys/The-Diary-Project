const ADJECTIVES = [
  'Wandering', 'Silent', 'Midnight', 'Gentle', 'Quiet', 'Patient',
  'Distant', 'Amber', 'Hollow', 'Golden', 'Fading', 'Velvet',
  'Drifting', 'Solitary', 'Autumnal', 'Somber', 'Luminous', 'Wistful'
];

const NOUNS = [
  'Quill', 'Lantern', 'Echo', 'Sparrow', 'River', 'Shadow',
  'Whisper', 'Compass', 'Archive', 'Keeper', 'Poet', 'Haven',
  'Voyager', 'Letter', 'Hourglass', 'Memory', 'Sleeper', 'Cartographer'
];

const AVATAR_COLORS = [
  '#52796F', // Sage
  '#354F52', // Deep Forest
  '#2F3E46', // Slate
  '#6C5B7B', // Muted Purple
  '#C06C84', // Rosewood
  '#3D372E', // Warm Sepia
  '#4A5568', // Slate Grey
];

export function generatePseudonym(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${adj} ${noun} #${num}`;
}

export function getRandomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}
