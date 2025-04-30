import { Flashcard } from "../types/flashcard";
import { PracticeHistory } from "../types/practice-history";

const FLASHCARDS_KEY = 'flashcards';
const HISTORY_KEY = 'practiceHistory';

// Generic storage functions
const getData = <T>(key: string, defaultValue: T): Promise<T> => {
  return new Promise((resolve) => {
    if (typeof localStorage !== 'undefined') {
      try {
        const data = localStorage.getItem(key);
        resolve(data ? JSON.parse(data) : defaultValue);
      } catch (error) {
        console.error(`Error getting ${key} from localStorage:`, error);
        resolve(defaultValue);
      }
    } else {
      console.warn("localStorage not available");
      resolve(defaultValue);
    }
  });
};

const setData = <T>(key: string, value: T): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        resolve(true);
      } catch (error) {
        console.error(`Error setting ${key} in localStorage:`, error);
        reject(error);
      }
    } else {
      console.warn("localStorage not available");
      reject(new Error("localStorage not available"));
    }
  });
};

// Flashcard-specific functions
export const getFlashcards = async (): Promise<Flashcard[]> => {
  return await getData<Flashcard[]>(FLASHCARDS_KEY, []);
};

export const saveFlashcards = async (flashcards: Flashcard[]): Promise<void> => {
  await setData(FLASHCARDS_KEY, flashcards);
};

// Practice history functions
export const getPracticeHistory = async (): Promise<PracticeHistory[]> => {
  return await getData<PracticeHistory[]>(HISTORY_KEY, []);
};

export const addPracticeHistoryEvent = async (event: PracticeHistory): Promise<void> => {
  try {
    const history = await getPracticeHistory();
    history.push(event);
    await setData(HISTORY_KEY, history);
    console.log("Practice history event added:", event);
  } catch (error) {
    console.error("Failed to add practice history event:", error);
  }
};

export const updateFlashcard = async (updatedCard: Flashcard): Promise<void> => {
  try {
    const allCards = await getFlashcards();
    const cardIndex = allCards.findIndex(card => card.id === updatedCard.id);
    if (cardIndex !== -1) {
      const originalTimestamp = allCards[cardIndex].timestamp;
      allCards[cardIndex] = {
        ...updatedCard,
        timestamp: updatedCard.timestamp || originalTimestamp
      };
      await saveFlashcards(allCards);
      console.log("Flashcard updated:", updatedCard);
    } else {
      console.warn("Could not find card to update with ID:", updatedCard.id);
    }
  } catch (error) {
    console.error("Failed to update flashcard:", error);
  }
};