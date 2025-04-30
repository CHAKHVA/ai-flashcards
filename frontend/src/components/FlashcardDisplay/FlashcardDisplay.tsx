import React, { useState, useEffect, useCallback } from 'react';
import './FlashcardDisplay.css';
import { flashcards } from '../../data/hardcodedCards';
import GestureDetector, { Gesture } from '../GestureDetector/GestureDetector';

interface Rating {
  cardId: number | string;
  rating: 'easy' | 'hard' | 'wrong';
  timestamp: number;
}

const Flashcard: React.FC = () => {
  const [day, setDay] = useState(0);
  const [step, setStep] = useState<'start' | 'question' | 'answer'>('start');
  const [cardIndex, setCardIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [lastRating, setLastRating] = useState<'easy' | 'hard' | 'wrong' | null>(null);
  const [debugMessage, setDebugMessage] = useState<string>('');

  // Reset isGestureActive when switching to a new card
  useEffect(() => {
    if (step === 'answer') {
      setIsGestureActive(true);
      setLastRating(null);
      console.log("Answer shown - activating gesture detection");
      setDebugMessage('Gesture detection active');
    } else {
      setIsGestureActive(false);
      setDebugMessage('');
    }
  }, [step, cardIndex]);

  const handleNextDay = () => {
    setDay(day + 1);
    setCardIndex(0);
    setStep('question');
    setShowHint(false);
    setLastRating(null);
  };

  const handleShowAnswer = () => {
    setStep('answer');
    setShowHint(false);
  };

  // FIX: Simplified moveToNextCard and made it more robust
  const moveToNextCard = useCallback(() => {
    setDebugMessage('Moving to next card...');
    console.log("Moving to next card from", cardIndex, "of", flashcards.length);

    setTimeout(() => {
      if (cardIndex < flashcards.length - 1) {
        setCardIndex(prev => prev + 1);
        setStep('question');
      } else {
        setStep('start');
      }
      setShowHint(false);
      setLastRating(null);
    }, 500); // Short delay to ensure state updates properly
  }, [cardIndex, flashcards.length]);

  // FIX: Completely rebuilt gesture handler to be more direct
  const handleGestureDetected = useCallback((gesture: Gesture) => {
    console.log('RECEIVED GESTURE EVENT (after 3s hold):', gesture);
    setDebugMessage(`Held gesture detected: ${gesture}`);

    // Only process if we're in answer mode
    if (step !== 'answer') {
      console.log('Ignoring gesture - not in answer mode', step);
      return;
    }

    // Rating is always 'hard' when triggered by the 3-second hold via GestureDetector
    const rating: 'hard' = 'hard'; // Directly assign 'hard'

    console.log(`Rating card as ${rating} due to 3-second hold`);
    setDebugMessage(`Rating: ${rating} (Hold)`);

    // Disable gesture detection
    setIsGestureActive(false);

    // Save the rating
    const newRating: Rating = {
      cardId: flashcards[cardIndex].id || cardIndex,
      rating: rating,
      timestamp: Date.now()
    };

    setRatings(prev => [...prev, newRating]);
    setLastRating(rating);

    // Move to the next card after a delay
    console.log("Will move to next card in 1.5 seconds");
    setTimeout(moveToNextCard, 1500);

  }, [step, cardIndex, moveToNextCard]);

  const handleShowHint = () => {
    setShowHint(true);
  };

  return (
    <div className="flashcard-container">
      <div className="flashcard">
        <h1 className="title">Flashcard Learner</h1>
        <button className="day-btn">Day {day}</button>

        {step === 'start' && (
          <>
            <p>No more cards to practice today!</p>
            <button className="next-day-btn" onClick={handleNextDay}>Go to Next Day</button>
          </>
        )}

        {(step === 'question' || step === 'answer') && (
          <>
            <p className="card-count">Card {cardIndex + 1} of {flashcards.length}</p>
            <div className={`card ${step === 'answer' ? 'answer' : ''}`}>
              {step === 'question'
                ? flashcards[cardIndex].back
                : flashcards[cardIndex].front}
            </div>

            {showHint && flashcards[cardIndex].hint && (
              <div className="hint-box">
                💡 {flashcards[cardIndex].hint}
              </div>
            )}

            {showHint && !flashcards[cardIndex].hint && (
              <div className="hint-box">
                💡 No Hint
              </div>
            )}

            {step === 'question' && (
              <div className="btn-group">
                <button className="hint-btn" onClick={handleShowHint}>Get Hint</button>
                <button className="answer-btn" onClick={handleShowAnswer}>Show Answer</button>
              </div>
            )}

            {step === 'answer' && (
              <div className="difficulty-section">
                <p>How difficult was this card?</p>
                <p className="gesture-help">
                  Use hand gestures to answer:<br />
                  👍 Thumbs up = Easy<br />
                  👎 Thumbs down = Wrong<br />
                  ✋ Flat hand = Hard
                </p>

                {lastRating && (
                  <div className="rating-feedback">
                    Card rated as: <strong>{lastRating.toUpperCase()}</strong>
                    <div>Moving to next card...</div>
                  </div>
                )}

                {!lastRating && (
                  <div className="gesture-status">
                    {isGestureActive ? 'Gesture detection active' : 'Waiting...'}
                  </div>
                )}

                {/* Debug message for easier troubleshooting */}
                {debugMessage && (
                  <div className="debug-message">{debugMessage}</div>
                )}

                <GestureDetector
                  onGestureDetected={handleGestureDetected}
                  isActive={isGestureActive}
                />

                {/* Manual button fallback */}
                {isGestureActive && (
                  <div className="manual-buttons">
                    <button onClick={() => handleGestureDetected('thumbsUp')}>👍</button>
                    <button onClick={() => handleGestureDetected('flatHand')}>✋</button>
                    <button onClick={() => handleGestureDetected('thumbsDown')}>👎</button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Flashcard;
