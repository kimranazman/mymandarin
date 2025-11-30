import { useState, useEffect } from 'react';
import type { WordWithCategory, QuizDifficulty } from '../types/vocabulary';
import { useFlashlight } from '../hooks/useFlashlight';
import { IconBook, IconBrain, IconCards } from './Icons';
import './Quiz.css';

interface QuizOptionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

function QuizOption({ className, children, ...props }: QuizOptionProps) {
  const flashlight = useFlashlight();
  return (
    <button
      className={`${className || ''} ${flashlight.className}`}
      onMouseMove={flashlight.onMouseMove}
      {...props}
    >
      {children}
    </button>
  );
}

interface QuizProps {
  words: WordWithCategory[];
  categories: string[];
  onResult: (pinyin: string, correct: boolean, mode: QuizMode) => void;
  onComplete: (session: {
    mode: QuizMode;
    difficulty: QuizDifficulty;
    category: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    firstAttemptCorrect: number;
    secondAttemptCorrect: number;
    duration: number;
    wordsReviewed: string[];
  }) => void;
  onExit: () => void;
}

type QuizMode = 'character-to-meaning' | 'meaning-to-character' | 'pinyin-to-character';
type QuizPhase = 'settings' | 'playing' | 'results';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function Quiz({ words, categories, onResult, onComplete, onExit }: QuizProps) {
  // Settings state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<QuizMode>('character-to-meaning');
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuizDifficulty>('easy');
  const [questionCount, setQuestionCount] = useState<number>(10);

  // Quiz state
  const [phase, setPhase] = useState<QuizPhase>('settings');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, incorrect: 0, firstAttempt: 0, secondAttempt: 0 });
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [options, setOptions] = useState<WordWithCategory[]>([]);
  const [quizWords, setQuizWords] = useState<WordWithCategory[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [reviewedWords, setReviewedWords] = useState<string[]>([]);

  // Attempt tracking
  const [attemptCount, setAttemptCount] = useState(0);
  const [wrongFirstAttempt, setWrongFirstAttempt] = useState<string | null>(null);
  const [questionResolved, setQuestionResolved] = useState(false);

  const maxAttempts = selectedDifficulty === 'hard' ? 1 : 2;

  // Get filtered words based on category
  const getFilteredWords = () => {
    if (selectedCategory === 'all') return words;
    return words.filter(w => w.category === selectedCategory);
  };

  // Set up options for current question
  useEffect(() => {
    if (quizWords.length === 0 || phase !== 'playing') return;

    const currentWord = quizWords[currentIndex];
    const filteredWords = getFilteredWords();

    // Get wrong options based on difficulty
    let wrongPool: WordWithCategory[];
    if (selectedDifficulty === 'medium') {
      // Medium: same category only
      wrongPool = filteredWords.filter(w => w.pinyin !== currentWord.pinyin);
    } else {
      // Easy & Hard: any category (Hard will use similarTo in future)
      wrongPool = words.filter(w => w.pinyin !== currentWord.pinyin);
    }

    const wrongOptions = shuffleArray(wrongPool).slice(0, 3);
    setOptions(shuffleArray([currentWord, ...wrongOptions]));
    setSelectedAnswer(null);
    setAttemptCount(0);
    setWrongFirstAttempt(null);
    setQuestionResolved(false);
  }, [currentIndex, quizWords, phase]);

  const startQuiz = () => {
    const filteredWords = getFilteredWords();
    if (filteredWords.length < 4) return;

    // Limit to selected question count
    const shuffled = shuffleArray(filteredWords);
    const limited = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    setScore({ correct: 0, incorrect: 0, firstAttempt: 0, secondAttempt: 0 });
    setCurrentIndex(0);
    setQuizWords(limited);
    setStartTime(Date.now());
    setReviewedWords([]);
    setPhase('playing');
  };

  const handleAnswer = (answer: WordWithCategory) => {
    if (questionResolved) return;

    const currentWord = quizWords[currentIndex];
    const isCorrect = answer.pinyin === currentWord.pinyin;
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    if (isCorrect) {
      // Correct answer
      setSelectedAnswer(answer.pinyin);
      setQuestionResolved(true);
      onResult(currentWord.pinyin, true, selectedMode);
      setReviewedWords(prev => [...prev, currentWord.pinyin]);

      if (newAttemptCount === 1) {
        setScore(prev => ({ ...prev, correct: prev.correct + 1, firstAttempt: prev.firstAttempt + 1 }));
      } else {
        setScore(prev => ({ ...prev, correct: prev.correct + 1, secondAttempt: prev.secondAttempt + 1 }));
      }
    } else {
      // Wrong answer
      if (newAttemptCount === 1 && maxAttempts > 1) {
        // First wrong attempt, allow retry
        setWrongFirstAttempt(answer.pinyin);
        setSelectedAnswer(null);
      } else {
        // Final wrong attempt
        setSelectedAnswer(answer.pinyin);
        setQuestionResolved(true);
        onResult(currentWord.pinyin, false, selectedMode);
        setReviewedWords(prev => [...prev, currentWord.pinyin]);
        setScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
      }
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= quizWords.length) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      onComplete({
        mode: selectedMode,
        difficulty: selectedDifficulty,
        category: selectedCategory,
        totalQuestions: quizWords.length,
        correctAnswers: score.correct,
        incorrectAnswers: score.incorrect,
        firstAttemptCorrect: score.firstAttempt,
        secondAttemptCorrect: score.secondAttempt,
        duration,
        wordsReviewed: reviewedWords,
      });
      setPhase('results');
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const currentWord = quizWords[currentIndex];

  const getQuestion = () => {
    if (!currentWord) return '';
    switch (selectedMode) {
      case 'character-to-meaning':
        return currentWord.characters;
      case 'meaning-to-character':
        return currentWord.meaning;
      case 'pinyin-to-character':
        return currentWord.pinyin;
    }
  };

  const getAnswerDisplay = (word: WordWithCategory) => {
    switch (selectedMode) {
      case 'character-to-meaning':
        return word.meaning;
      case 'meaning-to-character':
        return word.characters;
      case 'pinyin-to-character':
        return word.characters;
    }
  };

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ');
  };

  const filteredWords = getFilteredWords();

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

  // Settings Phase
  if (phase === 'settings') {
    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <h2>Quiz Settings</h2>
          <button className="quiz-exit-btn" onClick={onExit}>Exit</button>
        </div>

        {/* Category Selection */}
        <div className="settings-section">
          <h3>Category</h3>
          <div className="category-chips">
            <button
              className={`category-chip ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All ({words.length})
            </button>
            {categories.map(cat => {
              const count = words.filter(w => w.category === cat).length;
              return (
                <button
                  key={cat}
                  className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {formatCategory(cat)} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode Selection */}
        <div className="settings-section">
          <h3>Quiz Mode</h3>
          <div className="mode-selector">
            <button
              className={`mode-card ${selectedMode === 'character-to-meaning' ? 'active' : ''}`}
              onClick={() => setSelectedMode('character-to-meaning')}
            >
              <IconBook className="mode-icon" />
              <span className="mode-label">Read (字 → Meaning)</span>
            </button>
            <button
              className={`mode-card ${selectedMode === 'meaning-to-character' ? 'active' : ''}`}
              onClick={() => setSelectedMode('meaning-to-character')}
            >
              <IconBrain className="mode-icon" />
              <span className="mode-label">Recall (Meaning → 字)</span>
            </button>
            <button
              className={`mode-card ${selectedMode === 'pinyin-to-character' ? 'active' : ''}`}
              onClick={() => setSelectedMode('pinyin-to-character')}
            >
              <IconCards className="mode-icon" />
              <span className="mode-label">Match (Pinyin → 字)</span>
            </button>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="settings-section">
          <h3>Difficulty</h3>
          <div className="difficulty-selector">
            <button
              className={`difficulty-btn easy ${selectedDifficulty === 'easy' ? 'active' : ''}`}
              onClick={() => setSelectedDifficulty('easy')}
            >
              <span className="difficulty-name">Easy</span>
              <span className="difficulty-desc">2 attempts, random options</span>
            </button>
            <button
              className={`difficulty-btn medium ${selectedDifficulty === 'medium' ? 'active' : ''}`}
              onClick={() => setSelectedDifficulty('medium')}
            >
              <span className="difficulty-name">Medium</span>
              <span className="difficulty-desc">2 attempts, same category</span>
            </button>
            <button
              className={`difficulty-btn hard ${selectedDifficulty === 'hard' ? 'active' : ''}`}
              onClick={() => setSelectedDifficulty('hard')}
            >
              <span className="difficulty-name">Hard</span>
              <span className="difficulty-desc">1 attempt only</span>
            </button>
          </div>
        </div>

        {/* Question Count */}
        <div className="settings-section">
          <h3>Questions: {Math.min(questionCount, filteredWords.length)}</h3>
          <div className="question-slider-container">
            <input
              type="range"
              min="5"
              max={Math.max(filteredWords.length, 5)}
              value={Math.min(questionCount, filteredWords.length)}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="question-slider"
            />
            <div className="slider-labels">
              <span>5</span>
              <span>{filteredWords.length >= 10 ? '10' : ''}</span>
              <span>{filteredWords.length}</span>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="settings-actions">
          {filteredWords.length >= 4 ? (
            <button className="btn-start-quiz" onClick={startQuiz}>
              Start Quiz ({Math.min(questionCount, filteredWords.length)} questions)
            </button>
          ) : (
            <p className="settings-warning">
              Need at least 4 words. Selected category has only {filteredWords.length}.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Results Phase
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

          {score.secondAttempt > 0 && (
            <div className="attempt-breakdown">
              <span>First try: {score.firstAttempt}</span>
              <span>Second try: {score.secondAttempt}</span>
            </div>
          )}

          <div className="completion-actions">
            <button className="btn-play-again" onClick={() => setPhase('settings')}>
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

  // Playing Phase
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

      {/* Attempt indicator for non-hard mode */}
      {maxAttempts > 1 && (
        <div className="attempt-indicator">
          <span className={`attempt-dot ${attemptCount >= 1 ? (wrongFirstAttempt ? 'used wrong' : 'used correct') : ''}`} />
          <span className={`attempt-dot ${attemptCount >= 2 ? 'used' : ''}`} />
        </div>
      )}

      <div className="quiz-question">
        <span className={`question-text ${selectedMode !== 'meaning-to-character' ? 'chinese' : ''}`}>
          {getQuestion()}
        </span>
      </div>

      <div className="quiz-options">
        {options.map((option) => {
          let className = 'quiz-option';
          if (selectedMode !== 'character-to-meaning') {
            className += ' chinese';
          }

          // Show states
          if (questionResolved) {
            if (option.pinyin === currentWord.pinyin) {
              className += ' correct';
            } else if (option.pinyin === selectedAnswer) {
              className += ' incorrect';
            }
          } else if (option.pinyin === wrongFirstAttempt) {
            className += ' wrong-attempt';
          }

          return (
            <QuizOption
              key={option.pinyin}
              className={className}
              onClick={() => handleAnswer(option)}
              disabled={questionResolved || option.pinyin === wrongFirstAttempt}
            >
              {getAnswerDisplay(option)}
            </QuizOption>
          );
        })}
      </div>

      {wrongFirstAttempt && !questionResolved && (
        <div className="quiz-feedback">
          <span className="feedback-try-again">Try again! One more chance.</span>
        </div>
      )}

      {questionResolved && (
        <div className="quiz-feedback">
          {selectedAnswer === currentWord.pinyin ? (
            <span className="feedback-correct">
              {attemptCount === 1 ? 'Correct!' : 'Correct on second try!'}
            </span>
          ) : (
            <span className="feedback-incorrect">
              The answer was: {currentWord.characters} ({currentWord.pinyin}) - {currentWord.meaning}
            </span>
          )}
          <button className="btn-next beam-border" onClick={handleNext}>
            {currentIndex + 1 >= quizWords.length ? 'See Results' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  );
}
