// src/index.ts

import { Flashcard, loadFlashcards, saveFlashcards } from "./flashcards";
import {
  moveFlashcardToNextBucket,
  resetFlashcardBucket,
  selectNextFlashcard
} from "./algorithm";

let flashcards: Flashcard[] = loadFlashcards();
let currentCard: Flashcard | null = selectNextFlashcard(flashcards);

function displayCurrentCard(): void {
  if (!currentCard) {
    console.log("📭 No flashcards available.");
    return;
  }

  console.log("📌 Front:", currentCard.front);
  console.log("💡 Hint:", currentCard.hint ?? "(No hint)");
}

function submitAnswer(userAnswer: string): void {
  if (!currentCard) return;

  const isCorrect = userAnswer.trim().toLowerCase() === currentCard.back.trim().toLowerCase();

  if (isCorrect) {
    console.log("✅ Correct!");
    moveFlashcardToNextBucket(currentCard);
  } else {
    console.log(`❌ Wrong! Correct answer was: ${currentCard.back}`);
    resetFlashcardBucket(currentCard);
  }

  // Update card in flashcards array
  flashcards = flashcards.map(card =>
    card.front === currentCard?.front && card.back === currentCard?.back ? currentCard : card
  );

  // Save updated list
  saveFlashcards(flashcards);

  // Select next card
  currentCard = selectNextFlashcard(flashcards);
  displayCurrentCard();
}

function addFlashcard(
  front: string,
  back: string,
  hint?: string,
  tags?: string[]
): void {
  const newCard: Flashcard = {
    front,
    back,
    hint,
    tags,
    bucket: 0
  };

  flashcards.push(newCard);
  saveFlashcards(flashcards);

  if (!currentCard) {
    currentCard = selectNextFlashcard(flashcards);
  }
}

addFlashcard("Capital of France?", "Paris", "Eiffel Tower", ["geography"]);
addFlashcard("5 + 7?", "12", "Basic math", ["math"]);

displayCurrentCard();

// Simulate user input
submitAnswer("paris"); 
submitAnswer("15");   
