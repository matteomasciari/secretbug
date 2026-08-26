import type { PRCard } from "@/types/game";
import { DECK_CRITICO_COUNT, DECK_STABILE_COUNT } from "@/types/game";

export function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createDeck(): PRCard[] {
  const cards: PRCard[] = [
    ...Array(DECK_STABILE_COUNT).fill("STABILE"),
    ...Array(DECK_CRITICO_COUNT).fill("CRITICO"),
  ];
  return shuffle(cards);
}

/**
 * Draws `count` cards from the deck, reshuffling the discard pile back in
 * as a fresh deck if the draw pile runs short (mirrors Secret Hitler rules).
 */
export function drawCards(
  deck: PRCard[],
  discard: PRCard[],
  count: number
): { drawn: PRCard[]; deck: PRCard[]; discard: PRCard[] } {
  let workingDeck = [...deck];
  let workingDiscard = [...discard];

  if (workingDeck.length < count) {
    workingDeck = shuffle([...workingDeck, ...workingDiscard]);
    workingDiscard = [];
  }

  const drawn = workingDeck.slice(0, count);
  workingDeck = workingDeck.slice(count);

  return { drawn, deck: workingDeck, discard: workingDiscard };
}
