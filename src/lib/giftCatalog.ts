/**
 * Everything that can be folded into a dedicated letter. Flowers carry
 * meanings on their sleeves; keepsakes are small objects that survive
 * the journey. ids map to GiftArt illustrations.
 */
export interface GiftItem {
  id: string;
  label: string;
  line: string;
}

export const GIFT_FLOWERS: GiftItem[] = [
  { id: "rose", label: "A rose", line: "for the one you never stopped choosing" },
  { id: "marigold", label: "Marigold", line: "festival-orange, stubborn with joy" },
  { id: "jasmine", label: "Jasmine", line: "small, white, and impossible to forget" },
  { id: "sunflower", label: "Sunflower", line: "for someone who always faced the light" },
  { id: "lotus", label: "Lotus", line: "grew in still water, like you did" },
  { id: "pressed-flower", label: "Pressed flower", line: "kept flat between pages for years" },
];

export const GIFT_KEEPSAKES: GiftItem[] = [
  { id: "candle", label: "A candle", line: "one that doesn't go out" },
  { id: "paper-star", label: "Paper star", line: "folded from the letter's own edge" },
  { id: "paper-boat", label: "Paper boat", line: "for whatever water you're both crossing" },
];

export const GIFT_BY_ID: Record<string, GiftItem> = Object.fromEntries(
  [...GIFT_FLOWERS, ...GIFT_KEEPSAKES].map((item) => [item.id, item]),
);

// Links minted by the first version used these ids.
export const LEGACY_GIFT_LABELS: Record<string, GiftItem> = {
  flower: GIFT_BY_ID["pressed-flower"],
  star: GIFT_BY_ID["paper-star"],
};

export const giftItemFor = (id: string): GiftItem | undefined =>
  GIFT_BY_ID[id] ?? LEGACY_GIFT_LABELS[id];
