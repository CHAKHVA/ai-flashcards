import React, { useState } from 'react';
import './FlashcardDisplay.css';

type FlashcardData = {
  question: string;
  answer: string;
  hint: string;
};

const flashcards: FlashcardData[] = [
  {
    question: 'Extreme ironing',
    answer:
      'Extreme Ironing (also called EI) is an extreme sport in which people take ironing boards to remote locations and iron items of clothing.',
    hint: 'It’s a sport that combines chores and adventure.',
  },
  {
    question: 'What is the capital of France?',
    answer: 'The capital of France is Paris.',
    hint: 'It’s known as the City of Light.',
  },
];

const Flashcard: React.FC = () => {
  const [day, setDay] = useState(0);
  const [step, setStep] = useState<'start' | 'question' | 'answer'>('start');
  const [cardIndex, setCardIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const handleNextDay = () => {
    setDay(day + 1);
    setCardIndex(0);
    setStep('question');
    setShowHint(false);
  };

  const handleShowAnswer = () => {
    setStep('answer');
    setShowHint(false);
  };

  const handleDifficulty = () => {
    if (cardIndex < flashcards.length - 1) {
      setCardIndex(cardIndex + 1);
      setStep('question');
      setShowHint(false);
    } else {
      setStep('start');
    }
  };

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
                ? flashcards[cardIndex].question
                : flashcards[cardIndex].answer}
            </div>

            {showHint && (
              <div className="hint-box">
                💡 {flashcards[cardIndex].hint}
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
                <div className="difficulty-buttons">
                  <button className="wrong" onClick={handleDifficulty}>Wrong</button>
                  <button className="hard" onClick={handleDifficulty}>Hard</button>
                  <button className="easy" onClick={handleDifficulty}>Easy</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Flashcard;
