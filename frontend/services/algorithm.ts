// src/algorithm.ts

import type { Flashcard } from "./flashcards";

export function selectNextFlashcard(flashcards: Flashcard[]): Flashcard | null {
  if (flashcards.length === 0) return null;

  const sortedFlashcards = [...flashcards].sort((a, b) => a.bucket - b.bucket);
  return sortedFlashcards[0];
}

export function moveFlashcardToNextBucket(card: Flashcard): void {
  const MAX_BUCKET = 5;
  card.bucket = Math.min(card.bucket + 1, MAX_BUCKET);
}

export function resetFlashcardBucket(card: Flashcard): void {
  card.bucket = 0;
}
