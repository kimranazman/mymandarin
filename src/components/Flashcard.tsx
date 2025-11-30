import { useState, useEffect, useCallback } from 'react';
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

  const handleFlip = useCallback(() => {
    if (!flipped) {
      setFlipped(true);
      setShowAnswer(true);
    } else {
      setFlipped(false);
      setShowAnswer(false);
    }
  }, [flipped]);

  const handleResult = useCallback((correct: boolean) => {
    if (onResult) {
      onResult(correct);
    }
    setFlipped(false);
    setShowAnswer(false);
    onNext();
  }, [onResult, onNext]);

  const handleSkip = useCallback(() => {
    setFlipped(false);
    setShowAnswer(false);
    onNext();
  }, [onNext]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      }

      if (showAnswer) {
        if (e.key === '1') handleResult(false); // Hard
        if (e.key === '2') handleResult(true);  // Medium
        if (e.key === '3') handleResult(true);  // Easy
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, showAnswer, handleResult]);

  return (
    <div className="flashcard-container">
      {showProgress && (
        <div className="progress-container">
          <div className="progress-text">
            Card {showProgress.current} / {showProgress.total}
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${(showProgress.current / showProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={handleFlip}>
        <div className="flashcard-inner">
          <div className="flashcard-front">
            <span className="character">{word.characters}</span>
            <span className="hint">Click or Press Space to reveal</span>
          </div>
          <div className="flashcard-back">
            <span className="character-small">{word.characters}</span>
            <span className="pinyin">{word.pinyin}</span>
            <span className="meaning">{word.meaning}</span>
            <span className="category-badge">{word.category.replace(/_/g, ' ')}</span>
            {word.notes && <span className="notes">{word.notes}</span>}
          </div>
        </div>
      </div>

      <div className="flashcard-controls">
        {showAnswer ? (
          <div className="difficulty-actions">
            <button className="btn btn-hard" onClick={() => handleResult(false)}>
              <span className="key-hint">1</span>
              Hard
            </button>
            <button className="btn btn-medium" onClick={() => handleResult(true)}>
              <span className="key-hint">2</span>
              Medium
            </button>
            <button className="btn btn-easy" onClick={() => handleResult(true)}>
              <span className="key-hint">3</span>
              Easy
            </button>
          </div>
        ) : (
          <div className="initial-actions">
             <button className="btn btn-flip" onClick={handleFlip}>
              Reveal Answer <span className="key-hint-inline">Space</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
