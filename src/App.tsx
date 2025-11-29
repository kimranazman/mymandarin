import { useState } from 'react';
import { useVocabulary } from './hooks/useVocabulary';
import { Flashcard } from './components/Flashcard';
import { Quiz } from './components/Quiz';
import { WordList } from './components/WordList';
import { CharacterBreakdown } from './components/CharacterBreakdown';
import type { WordWithCategory } from './types/vocabulary';
import './App.css';

type View = 'home' | 'flashcards' | 'quiz' | 'words' | 'struggle';

function App() {
  const [view, setView] = useState<View>('home');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState<WordWithCategory | null>(null);
  const [quizComplete, setQuizComplete] = useState<{ correct: number; incorrect: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    getAllWords,
    getWordsByCategory,
    getCategories,
    getStruggleWords,
    updateProgress,
    getWordProgress,
    resetProgress,
  } = useVocabulary();

  const allWords = getAllWords();
  const categories = getCategories();
  const struggleWords = getStruggleWords();

  const getDisplayWords = () => {
    if (selectedCategory) {
      return getWordsByCategory(selectedCategory);
    }
    return allWords;
  };

  const displayWords = getDisplayWords();

  const handleNextCard = () => {
    setCurrentCardIndex((prev) => (prev + 1) % displayWords.length);
  };

  const handleFlashcardResult = (correct: boolean) => {
    const word = displayWords[currentCardIndex];
    updateProgress(word.pinyin, correct);
  };

  const handleQuizResult = (pinyin: string, correct: boolean) => {
    updateProgress(pinyin, correct);
  };

  const handleQuizComplete = (results: { correct: number; incorrect: number }) => {
    setQuizComplete(results);
  };

  const findRelatedWords = (word: WordWithCategory): WordWithCategory[] => {
    return allWords.filter((w) => {
      if (w.pinyin === word.pinyin) return false;
      // Check if they share any characters
      const chars1 = word.characters.split('');
      const chars2 = w.characters.split('');
      return chars1.some((c) => chars2.includes(c));
    });
  };

  const startQuiz = () => {
    setQuizComplete(null);
    setView('quiz');
  };

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 onClick={() => setView('home')}>My Mandarin</h1>
        <nav className="nav">
          <button
            className={view === 'flashcards' ? 'active' : ''}
            onClick={() => {
              setCurrentCardIndex(0);
              setView('flashcards');
            }}
          >
            Flashcards
          </button>
          <button
            className={view === 'quiz' ? 'active' : ''}
            onClick={startQuiz}
          >
            Quiz
          </button>
          <button
            className={view === 'words' ? 'active' : ''}
            onClick={() => setView('words')}
          >
            All Words
          </button>
          <button
            className={view === 'struggle' ? 'active' : ''}
            onClick={() => setView('struggle')}
          >
            Struggle ({struggleWords.length})
          </button>
        </nav>
      </header>

      <main className="app-main">
        {view === 'home' && (
          <div className="home">
            <div className="home-hero">
              <h2>Welcome to My Mandarin</h2>
              <p>Track your Mandarin vocabulary learning journey</p>
            </div>

            <div className="stats">
              <div className="stat-card">
                <span className="stat-number">{allWords.length}</span>
                <span className="stat-label">Words</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{categories.length}</span>
                <span className="stat-label">Categories</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{struggleWords.length}</span>
                <span className="stat-label">Need Practice</span>
              </div>
            </div>

            <div className="home-actions">
              <button className="btn-primary" onClick={() => setView('flashcards')}>
                Start Flashcards
              </button>
              <button className="btn-secondary" onClick={startQuiz}>
                Take a Quiz
              </button>
            </div>

            <div className="categories-section">
              <h3>Categories</h3>
              <div className="category-chips">
                {categories.map((category) => (
                  <button
                    key={category}
                    className="category-chip"
                    onClick={() => {
                      setSelectedCategory(category);
                      setCurrentCardIndex(0);
                      setView('flashcards');
                    }}
                  >
                    {formatCategory(category)} ({getWordsByCategory(category).length})
                  </button>
                ))}
              </div>
            </div>

            <div className="reset-section">
              <button className="btn-danger" onClick={resetProgress}>
                Reset Progress
              </button>
            </div>
          </div>
        )}

        {view === 'flashcards' && displayWords.length > 0 && (
          <div className="flashcards-view">
            {selectedCategory && (
              <div className="category-filter">
                <span>Filtering: {formatCategory(selectedCategory)}</span>
                <button onClick={() => setSelectedCategory(null)}>Clear</button>
              </div>
            )}
            <Flashcard
              word={displayWords[currentCardIndex]}
              onNext={handleNextCard}
              onResult={handleFlashcardResult}
              showProgress={{
                current: currentCardIndex + 1,
                total: displayWords.length,
              }}
            />
            <button
              className="btn-breakdown"
              onClick={() => setSelectedWord(displayWords[currentCardIndex])}
            >
              View Breakdown
            </button>
          </div>
        )}

        {view === 'quiz' && !quizComplete && displayWords.length >= 4 && (
          <Quiz
            words={displayWords}
            onComplete={handleQuizComplete}
            onResult={handleQuizResult}
          />
        )}

        {view === 'quiz' && !quizComplete && displayWords.length < 4 && (
          <div className="quiz-error">
            <p>Need at least 4 words for quiz mode.</p>
            <button onClick={() => setView('home')}>Go Home</button>
          </div>
        )}

        {view === 'quiz' && quizComplete && (
          <div className="quiz-results">
            <h2>Quiz Complete!</h2>
            <div className="results-stats">
              <div className="result-stat correct">
                <span className="result-number">{quizComplete.correct}</span>
                <span className="result-label">Correct</span>
              </div>
              <div className="result-stat incorrect">
                <span className="result-number">{quizComplete.incorrect}</span>
                <span className="result-label">Incorrect</span>
              </div>
              <div className="result-stat percentage">
                <span className="result-number">
                  {Math.round(
                    (quizComplete.correct / (quizComplete.correct + quizComplete.incorrect)) * 100
                  )}%
                </span>
                <span className="result-label">Score</span>
              </div>
            </div>
            <div className="results-actions">
              <button className="btn-primary" onClick={startQuiz}>
                Try Again
              </button>
              <button className="btn-secondary" onClick={() => setView('home')}>
                Go Home
              </button>
            </div>
          </div>
        )}

        {view === 'words' && (
          <WordList
            words={allWords}
            title="All Words"
            getProgress={getWordProgress}
            onWordClick={setSelectedWord}
          />
        )}

        {view === 'struggle' && (
          <WordList
            words={struggleWords}
            title="Words That Need Practice"
            getProgress={getWordProgress}
            onWordClick={setSelectedWord}
          />
        )}
      </main>

      {selectedWord && (
        <CharacterBreakdown
          word={selectedWord}
          relatedWords={findRelatedWords(selectedWord)}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
}

export default App;
