// src/flashcards.ts

export interface Flashcard {
  front: string;
  back: string;
  hint?: string;
  tags?: string[];
  bucket: number; 
}

const FLASHCARDS_KEY = "flashcards";

export function loadFlashcards(): Flashcard[] {
  const data = localStorage.getItem(FLASHCARDS_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data) as Flashcard[];

      return parsed.map(card => ({
        ...card,
        bucket: card.bucket ?? 0,
      }));
    } catch (e) {
      console.error("Error parsing flashcards from localStorage:", e);
      return [];
    }
  }
  return [];
}

export function saveFlashcards(flashcards: Flashcard[]): void {
  localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(flashcards));
}
