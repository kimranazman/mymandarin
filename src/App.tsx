import { useState } from 'react';
import { useVocabulary } from './hooks/useVocabulary';
import { Flashcard } from './components/Flashcard';
import { Quiz } from './components/Quiz';
import { WordList } from './components/WordList';
import { CharacterBreakdown } from './components/CharacterBreakdown';
import { Statistics } from './components/Statistics';
import { Readables } from './components/Readables';
import { IconHome, IconCards, IconQuiz, IconBook, IconStats, IconRead } from './components/Icons';
import type { WordWithCategory, QuizMode } from './types/vocabulary';
import './App.css';

type View = 'home' | 'flashcards' | 'quiz' | 'words' | 'read' | 'stats';

function App() {
  const [view, setView] = useState<View>('home');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState<WordWithCategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    getAllWords,
    getWordsByCategory,
    getCategories,
    getStruggleWords,
    getWordsForReview,
    updateProgress,
    getWordProgress,
    getStatistics,
    recordQuizSession,
    resetProgress,
  } = useVocabulary();

  const allWords = getAllWords();
  const categories = getCategories();
  const struggleWords = getStruggleWords();
  const wordsForReview = getWordsForReview();
  const statistics = getStatistics();

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
    updateProgress(word.pinyin, correct, 'flashcard');
  };

  const handleQuizResult = (pinyin: string, correct: boolean, mode: QuizMode) => {
    updateProgress(pinyin, correct, mode);
  };

  const handleQuizComplete = (session: {
    mode: QuizMode;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    duration: number;
    wordsReviewed: string[];
  }) => {
    recordQuizSession(session);
  };

  const findRelatedWords = (word: WordWithCategory): WordWithCategory[] => {
    return allWords.filter((w) => {
      if (w.pinyin === word.pinyin) return false;
      const chars1 = word.characters.split('');
      const chars2 = w.characters.split('');
      return chars1.some((c) => chars2.includes(c));
    });
  };

  const startQuiz = () => {
    handleViewChange('quiz');
  };

  const startReviewSession = () => {
    // Start quiz with words that are due for review
    handleViewChange('quiz');
  };

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ');
  };

  interface NavItem {
    id: string;
    label: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    badge?: number;
  }

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: IconHome },
    { id: 'flashcards', label: 'Cards', icon: IconCards },
    { id: 'quiz', label: 'Quiz', icon: IconQuiz },
    { id: 'read', label: 'Read', icon: IconRead },
    { id: 'words', label: 'Library', icon: IconBook },
    { id: 'stats', label: 'Stats', icon: IconStats, badge: wordsForReview.length > 0 ? wordsForReview.length : undefined },
  ];

  const handleViewChange = (newView: View, callback?: () => void) => {
    if (newView === view) return;
    setView(newView);
    if (callback) callback();
  };

  const handleNavClick = (id: string) => {
    if (id === 'flashcards') {
      handleViewChange('flashcards', () => setCurrentCardIndex(0));
    } else if (id === 'quiz') {
      startQuiz();
    } else {
      handleViewChange(id as View);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo" onClick={() => handleViewChange('home')}>
            <h1>My Mandarin</h1>
          </div>

          <nav className="desktop-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${view === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <item.icon className="nav-icon" width={18} height={18} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="badge">{item.badge}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
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
                <span className="stat-number">{statistics.masteredCount}</span>
                <span className="stat-label">Mastered</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{wordsForReview.length}</span>
                <span className="stat-label">Due Today</span>
              </div>
            </div>

            <div className="home-actions">
              <button className="btn-primary beam-border" onClick={() => handleViewChange('flashcards')}>
                Start Flashcards
              </button>
              <button className="btn-secondary" onClick={startQuiz}>
                Take a Quiz
              </button>
            </div>

            {struggleWords.length > 0 && (
              <div className="struggle-alert">
                <p>
                  You have <strong>{struggleWords.length} words</strong> that need extra practice!
                </p>
                <button onClick={() => {
                  setSelectedCategory(null);
                  handleViewChange('flashcards');
                }}>
                  Practice Now
                </button>
              </div>
            )}

            <div className="categories-section">
              <h3>Categories</h3>
              <div className="category-chips">
                {categories.map((category) => (
                  <button
                    key={category}
                    className="category-chip"
                    onClick={() => {
                      handleViewChange('flashcards', () => {
                        setSelectedCategory(category);
                        setCurrentCardIndex(0);
                      });
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

        {view === 'quiz' && (
          <Quiz
            words={displayWords}
            onResult={handleQuizResult}
            onComplete={handleQuizComplete}
            onExit={() => handleViewChange('home')}
          />
        )}

        {view === 'words' && (
          <WordList
            words={allWords}
            title="All Words"
            getProgress={getWordProgress}
            onWordClick={setSelectedWord}
          />
        )}

        {view === 'read' && (
          <Readables
            onWordClick={(pinyin) => {
              const word = allWords.find((w) => w.pinyin.toLowerCase() === pinyin.toLowerCase());
              if (word) setSelectedWord(word);
            }}
          />
        )}

        {view === 'stats' && (
          <Statistics
            stats={statistics}
            onStartReview={startReviewSession}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`mobile-nav-item ${view === item.id ? 'active' : ''}`}
            onClick={() => handleNavClick(item.id)}
          >
            <div className="icon-wrapper">
              <item.icon width={24} height={24} />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="badge-dot" />
              )}
            </div>
            <span className="label">{item.label}</span>
          </button>
        ))}
      </nav>

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
