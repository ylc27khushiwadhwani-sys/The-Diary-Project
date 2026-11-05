/** The writer's chosen wax seal - their signature on everything they seal. */

export type SealColor = "crimson" | "gold" | "emerald" | "midnight";
export type SealIcon = "quill" | "lock" | "flame" | "crest";

export interface SealChoice {
  color: SealColor;
  icon: SealIcon;
}

const KEY = "paper-vault:seal";
const DEFAULT_SEAL: SealChoice = { color: "crimson", icon: "quill" };

export const getSealChoice = (): SealChoice => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SEAL;
    const parsed = JSON.parse(raw) as Partial<SealChoice>;
    return {
      color: (["crimson", "gold", "emerald", "midnight"] as const).includes(
        parsed.color as SealColor,
      )
        ? (parsed.color as SealColor)
        : DEFAULT_SEAL.color,
      icon: (["quill", "lock", "flame", "crest"] as const).includes(
        parsed.icon as SealIcon,
      )
        ? (parsed.icon as SealIcon)
        : DEFAULT_SEAL.icon,
    };
  } catch {
    return DEFAULT_SEAL;
  }
};

export const setSealChoice = (choice: SealChoice): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify(choice));
  } catch {
    /* ignore */
  }
};
