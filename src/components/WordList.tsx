import type { WordWithCategory, Progress } from '../types/vocabulary';
import './WordList.css';

interface WordListProps {
  words: WordWithCategory[];
  title: string;
  getProgress?: (pinyin: string) => Progress | null;
  onWordClick?: (word: WordWithCategory) => void;
}

export function WordList({ words, title, getProgress, onWordClick }: WordListProps) {
  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ');
  };

  return (
    <div className="word-list-container">
      <h2 className="word-list-title">{title}</h2>

      {words.length === 0 ? (
        <p className="no-words">No words to display.</p>
      ) : (
        <div className="word-list">
          {words.map((word) => {
            const progress = getProgress?.(word.pinyin);

            return (
              <div
                key={word.pinyin}
                className={`word-card ${onWordClick ? 'clickable' : ''}`}
                onClick={() => onWordClick?.(word)}
              >
                <div className="word-main">
                  <span className="word-character">{word.characters}</span>
                  <span className="word-pinyin">{word.pinyin}</span>
                </div>
                <div className="word-details">
                  <span className="word-meaning">{word.meaning}</span>
                  <span className="word-category">{formatCategory(word.category)}</span>
                </div>
                {progress && (
                  <div className="word-progress">
                    <span className="progress-correct">✓ {progress.correctCount}</span>
                    <span className="progress-incorrect">✗ {progress.incorrectCount}</span>
                    {progress.struggleWord && <span className="struggle-badge">Needs Practice</span>}
                  </div>
                )}
                {word.notes && (
                  <div className="word-notes">
                    <span className="notes-label">Notes:</span> {word.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
