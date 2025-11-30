import { useState, useEffect } from 'react';
import type { WordWithCategory } from '../types/vocabulary';
import { IconBook, IconBrain, IconCards } from './Icons';
import './Quiz.css';

interface QuizProps {
  words: WordWithCategory[];
  onResult: (pinyin: string, correct: boolean) => void;
  onExit: () => void;
}

type QuizMode = 'character-to-meaning' | 'meaning-to-character' | 'pinyin-to-character';
type QuizPhase = 'selection' | 'playing' | 'results';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function Quiz({ words, onResult, onExit }: QuizProps) {
  const [phase, setPhase] = useState<QuizPhase>('selection');
  const [quizMode, setQuizMode] = useState<QuizMode>('character-to-meaning');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [options, setOptions] = useState<WordWithCategory[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [quizWords, setQuizWords] = useState<WordWithCategory[]>([]);

  // Initialize quiz with shuffled words
  useEffect(() => {
    setQuizWords(shuffleArray(words));
  }, [words]);

  // Set up options for current question
  useEffect(() => {
    if (quizWords.length === 0 || phase !== 'playing') return;

    const currentWord = quizWords[currentIndex];
    const otherWords = quizWords.filter((_, i) => i !== currentIndex);
    const wrongOptions = shuffleArray(otherWords).slice(0, 3);
    setOptions(shuffleArray([currentWord, ...wrongOptions]));
    setSelectedAnswer(null);
    setShowResult(false);
  }, [currentIndex, quizWords, phase]);

  const startQuiz = (mode: QuizMode) => {
    setQuizMode(mode);
    setScore({ correct: 0, incorrect: 0 });
    setCurrentIndex(0);
    setQuizWords(shuffleArray(words));
    setPhase('playing');
  };

  const handleAnswer = (answer: WordWithCategory) => {
    if (showResult) return;

    const currentWord = quizWords[currentIndex];
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
      setPhase('results');
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const currentWord = quizWords[currentIndex];

  const getQuestion = () => {
    if (!currentWord) return '';
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

  if (words.length < 4) {
    return (
      <div className="quiz-container">
        <div className="quiz-error">
          <h3>Not Enough Words</h3>
          <p>You need at least 4 words to start a quiz.</p>
          <button className="btn-next" onClick={onExit}>Go Back</button>
        </div>
      </div>
    );
  }

  // Phase 1: Mode Selection
  if (phase === 'selection') {
    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <h2>Select Quiz Mode</h2>
          <button className="quiz-exit-btn" onClick={onExit}>Exit</button>
        </div>
        
        <div className="quiz-mode-selector">
          <button 
            className="mode-card"
            onClick={() => startQuiz('character-to-meaning')}
          >
            <IconBook className="mode-icon" />
            <span className="mode-label">Read (字 → Meaning)</span>
          </button>
          
          <button 
            className="mode-card"
            onClick={() => startQuiz('meaning-to-character')}
          >
            <IconBrain className="mode-icon" />
            <span className="mode-label">Recall (Meaning → 字)</span>
          </button>
          
          <button 
            className="mode-card"
            onClick={() => startQuiz('pinyin-to-character')}
          >
            <IconCards className="mode-icon" />
            <span className="mode-label">Match (Pinyin → 字)</span>
          </button>
        </div>
      </div>
    );
  }

  // Phase 3: Results
  if (phase === 'results') {
    const percentage = Math.round((score.correct / quizWords.length) * 100);
    
    return (
      <div className="quiz-container">
        <div className="quiz-completion">
          <h2 className="completion-title">Quiz Complete!</h2>
          
          <div className="completion-stats">
            <div className="stat-item">
              <span className="stat-value score">{percentage}%</span>
              <span className="stat-label">Score</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{score.correct}</span>
              <span className="stat-label">Correct</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{score.incorrect}</span>
              <span className="stat-label">Incorrect</span>
            </div>
          </div>

          <div className="completion-actions">
            <button className="btn-play-again" onClick={() => setPhase('selection')}>
              Play Again
            </button>
            <button className="btn-home" onClick={onExit}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Phase 2: Playing
  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="quiz-progress">
          Question {currentIndex + 1} of {quizWords.length}
        </div>
        <button className="quiz-exit-btn" onClick={onExit}>
          Exit
        </button>
        <div className="quiz-score">
          <span className="score-correct">✓ {score.correct}</span>
          <span className="score-incorrect">✗ {score.incorrect}</span>
        </div>
      </div>

      <div className="quiz-question">
        <span className={`question-text ${quizMode !== 'meaning-to-character' ? 'chinese' : ''}`}>
          {getQuestion()}
        </span>
      </div>

      <div className="quiz-options">
        {options.map((option) => {
          let className = 'quiz-option';
          if (quizMode !== 'character-to-meaning') {
            className += ' chinese';
          }
          
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
              {getAnswerDisplay(option)}
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
          <button className="btn-next" onClick={handleNext}>
            {currentIndex + 1 >= quizWords.length ? 'See Results' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  );
}
