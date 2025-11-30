import { useState } from 'react';
import { useVocabulary } from './hooks/useVocabulary';
import { Flashcard } from './components/Flashcard';
import { Quiz } from './components/Quiz';
import { WordList } from './components/WordList';
import { CharacterBreakdown } from './components/CharacterBreakdown';
import { IconHome, IconCards, IconQuiz, IconBook, IconBrain } from './components/Icons';
import type { WordWithCategory } from './types/vocabulary';
import './App.css';

type View = 'home' | 'flashcards' | 'quiz' | 'words' | 'struggle';

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
    setView('quiz');
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
    { id: 'flashcards', label: 'Flashcards', icon: IconCards },
    { id: 'quiz', label: 'Quiz', icon: IconQuiz },
    { id: 'words', label: 'Library', icon: IconBook },
    { id: 'struggle', label: 'Practice', icon: IconBrain, badge: struggleWords.length },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'flashcards') {
      setCurrentCardIndex(0);
      setView('flashcards');
    } else if (id === 'quiz') {
      startQuiz();
    } else {
      setView(id as View);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo" onClick={() => setView('home')}>
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

        {view === 'quiz' && (
          <Quiz
            words={displayWords}
            onResult={handleQuizResult}
            onExit={() => setView('home')}
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

        {view === 'struggle' && (
          <WordList
            words={struggleWords}
            title="Words That Need Practice"
            getProgress={getWordProgress}
            onWordClick={setSelectedWord}
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
