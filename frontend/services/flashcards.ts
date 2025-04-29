// src/flashcards.ts

export interface Flashcard {
  front: string;
  back: string;
  hint?: string;
  tags?: string[];
}

const FLASHCARDS_KEY = "flashcards";

export function loadFlashcards(): Flashcard[] {
  const data = localStorage.getItem(FLASHCARDS_KEY);
  if (data) {
    try {
      return JSON.parse(data) as Flashcard[];
    } catch (e) {
      console.error("Failed to parse flashcards from localStorage", e);
      return [];
    }
  }
  return [];
}

export function saveFlashcards(flashcards: Flashcard[]): void {
  localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(flashcards));
}

export function addFlashcard(flashcard: Flashcard): void {
  const flashcards = loadFlashcards();
  flashcards.push(flashcard);
  saveFlashcards(flashcards);
}
