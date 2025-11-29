import { useState } from 'react';
import type { WordWithCategory } from '../types/vocabulary';
import './Flashcard.css';

interface FlashcardProps {
  word: WordWithCategory;
  onNext: () => void;
  onResult?: (correct: boolean) => void;
  showProgress?: { current: number; total: number };
}

export function Flashcard({ word, onNext, onResult, showProgress }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleFlip = () => {
    setFlipped(!flipped);
    setShowAnswer(true);
  };

  const handleResult = (correct: boolean) => {
    if (onResult) {
      onResult(correct);
    }
    setFlipped(false);
    setShowAnswer(false);
    onNext();
  };

  const handleSkip = () => {
    setFlipped(false);
    setShowAnswer(false);
    onNext();
  };

  return (
    <div className="flashcard-container">
      {showProgress && (
        <div className="progress-indicator">
          {showProgress.current} / {showProgress.total}
        </div>
      )}

      <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={handleFlip}>
        <div className="flashcard-front">
          <span className="character">{word.characters}</span>
          <span className="hint">Click to reveal</span>
        </div>
        <div className="flashcard-back">
          <span className="character">{word.characters}</span>
          <span className="pinyin">{word.pinyin}</span>
          <span className="meaning">{word.meaning}</span>
          <span className="category">{word.category}</span>
          {word.notes && <span className="notes">{word.notes}</span>}
        </div>
      </div>

      {showAnswer && (
        <div className="flashcard-actions">
          <button className="btn btn-incorrect" onClick={() => handleResult(false)}>
            ✗ Didn't Know
          </button>
          <button className="btn btn-skip" onClick={handleSkip}>
            Skip
          </button>
          <button className="btn btn-correct" onClick={() => handleResult(true)}>
            ✓ Got It
          </button>
        </div>
      )}

      {!showAnswer && (
        <div className="flashcard-actions">
          <button className="btn btn-skip" onClick={handleSkip}>
            Skip
          </button>
        </div>
      )}
    </div>
  );
}
