// src/state.ts

import { Flashcard, loadFlashcards } from "./flashcards";
import { selectNextFlashcard } from "./algorithm";

export interface State {
  flashcards: Flashcard[];
  currentCard: Flashcard | null;
}

export function createInitialState(): State {
  const flashcards = loadFlashcards();
  const currentCard = selectNextFlashcard(flashcards);
  return { flashcards, currentCard };
}

export function refreshCurrentCard(state: State): void {
  state.currentCard = selectNextFlashcard(state.flashcards);
}
