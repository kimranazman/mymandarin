import { useState } from 'react';
import type { WordWithCategory, Progress } from '../types/vocabulary';
import { IconSearch } from './Icons';
import './WordList.css';

interface WordListProps {
  words: WordWithCategory[];
  title: string;
  getProgress?: (pinyin: string) => Progress | null;
  onWordClick?: (word: WordWithCategory) => void;
}

export function WordList({ words, title, getProgress, onWordClick }: WordListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ');
  };

  const filteredWords = words.filter((word) => {
    const term = searchTerm.toLowerCase();
    return (
      word.characters.toLowerCase().includes(term) ||
      word.pinyin.toLowerCase().includes(term) ||
      word.meaning.toLowerCase().includes(term)
    );
  });

  return (
    <div className="word-list-container">
      <div className="word-list-header">
        <h2 className="word-list-title">{title}</h2>
        <div className="search-box">
          <IconSearch className="search-icon" width={20} height={20} />
          <input
            type="text"
            placeholder="Search characters, pinyin, or meaning..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {filteredWords.length === 0 ? (
        <div className="no-words">
          {words.length === 0 ? (
            <p>No words to display.</p>
          ) : (
            <p>No matches found for "{searchTerm}"</p>
          )}
        </div>
      ) : (
        <div className="word-list">
          {filteredWords.map((word) => {
            const progress = getProgress?.(word.pinyin);
            const isStruggle = progress && progress.srsLevel <= 1 && progress.incorrectCount >= 2;

            return (
              <div
                key={word.pinyin}
                className={`word-card ${onWordClick ? 'clickable' : ''} ${isStruggle ? 'struggle' : ''}`}
                onClick={() => onWordClick?.(word)}
              >
                <div className="word-left">
                  <span className="word-character">{word.characters}</span>
                  <div className="word-info">
                    <span className="word-pinyin">{word.pinyin}</span>
                    <span className="word-meaning">{word.meaning}</span>
                  </div>
                </div>
                
                <div className="word-right">
                  <span className="word-category">{formatCategory(word.category)}</span>
                  {progress && (
                    <div className="word-stats">
                      {isStruggle && (
                        <span className="badge-struggle" title="Needs Practice">
                          Needs Practice
                        </span>
                      )}
                      <div className="stats-counts">
                        <span className="stat-correct" title="Correct">
                          {progress.correctCount}
                        </span>
                        <span className="stat-divider">/</span>
                        <span className="stat-incorrect" title="Incorrect">
                          {progress.incorrectCount}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
