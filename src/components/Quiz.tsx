import { useState, useEffect } from 'react';
import type { WordWithCategory } from '../types/vocabulary';
import './Quiz.css';

interface QuizProps {
  words: WordWithCategory[];
  onComplete: (results: { correct: number; incorrect: number }) => void;
  onResult: (pinyin: string, correct: boolean) => void;
}

type QuizMode = 'character-to-meaning' | 'meaning-to-character' | 'pinyin-to-character';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function Quiz({ words, onComplete, onResult }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [options, setOptions] = useState<WordWithCategory[]>([]);
  const [quizMode, setQuizMode] = useState<QuizMode>('character-to-meaning');
  const [showResult, setShowResult] = useState(false);
  const [quizWords, setQuizWords] = useState<WordWithCategory[]>([]);

  useEffect(() => {
    setQuizWords(shuffleArray(words));
  }, [words]);

  useEffect(() => {
    if (quizWords.length === 0) return;

    const currentWord = quizWords[currentIndex];
    const otherWords = quizWords.filter((_, i) => i !== currentIndex);
    const wrongOptions = shuffleArray(otherWords).slice(0, 3);
    setOptions(shuffleArray([currentWord, ...wrongOptions]));
    setSelectedAnswer(null);
    setShowResult(false);
  }, [currentIndex, quizWords]);

  if (quizWords.length === 0) {
    return <div className="quiz-container">No words available for quiz.</div>;
  }

  const currentWord = quizWords[currentIndex];

  const handleAnswer = (answer: WordWithCategory) => {
    if (showResult) return;

    setSelectedAnswer(answer.pinyin);
    setShowResult(true);

    const isCorrect = answer.pinyin === currentWord.pinyin;
    onResult(currentWord.pinyin, isCorrect);

    setScore(prev => ({
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      incorrect: isCorrect ? prev.incorrect : prev.incorrect + 1,
    }));
  };

  const handleNext = () => {
    if (currentIndex + 1 >= quizWords.length) {
      onComplete(score);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const getQuestion = () => {
    switch (quizMode) {
      case 'character-to-meaning':
        return currentWord.characters;
      case 'meaning-to-character':
        return currentWord.meaning;
      case 'pinyin-to-character':
        return currentWord.pinyin;
    }
  };

  const getAnswerDisplay = (word: WordWithCategory) => {
    switch (quizMode) {
      case 'character-to-meaning':
        return word.meaning;
      case 'meaning-to-character':
        return word.characters;
      case 'pinyin-to-character':
        return word.characters;
    }
  };

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="quiz-progress">
          Question {currentIndex + 1} of {quizWords.length}
        </div>
        <div className="quiz-score">
          <span className="score-correct">✓ {score.correct}</span>
          <span className="score-incorrect">✗ {score.incorrect}</span>
        </div>
      </div>

      <div className="quiz-mode-selector">
        <button
          className={`mode-btn ${quizMode === 'character-to-meaning' ? 'active' : ''}`}
          onClick={() => setQuizMode('character-to-meaning')}
        >
          字 → Meaning
        </button>
        <button
          className={`mode-btn ${quizMode === 'meaning-to-character' ? 'active' : ''}`}
          onClick={() => setQuizMode('meaning-to-character')}
        >
          Meaning → 字
        </button>
        <button
          className={`mode-btn ${quizMode === 'pinyin-to-character' ? 'active' : ''}`}
          onClick={() => setQuizMode('pinyin-to-character')}
        >
          Pinyin → 字
        </button>
      </div>

      <div className="quiz-question">
        <span className={quizMode === 'character-to-meaning' || quizMode === 'pinyin-to-character' ? 'chinese-text' : ''}>
          {getQuestion()}
        </span>
      </div>

      <div className="quiz-options">
        {options.map((option) => {
          let className = 'quiz-option';
          if (showResult) {
            if (option.pinyin === currentWord.pinyin) {
              className += ' correct';
            } else if (option.pinyin === selectedAnswer) {
              className += ' incorrect';
            }
          }

          return (
            <button
              key={option.pinyin}
              className={className}
              onClick={() => handleAnswer(option)}
              disabled={showResult}
            >
              <span className={quizMode === 'character-to-meaning' ? '' : 'chinese-text'}>
                {getAnswerDisplay(option)}
              </span>
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="quiz-feedback">
          {selectedAnswer === currentWord.pinyin ? (
            <span className="feedback-correct">Correct!</span>
          ) : (
            <span className="feedback-incorrect">
              Incorrect. The answer was: {currentWord.characters} ({currentWord.pinyin}) - {currentWord.meaning}
            </span>
          )}
          <button className="btn btn-next" onClick={handleNext}>
            {currentIndex + 1 >= quizWords.length ? 'See Results' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}
