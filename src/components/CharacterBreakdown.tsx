import type { WordWithCategory } from '../types/vocabulary';
import './CharacterBreakdown.css';

interface CharacterBreakdownProps {
  word: WordWithCategory;
  relatedWords?: WordWithCategory[];
  onClose: () => void;
}

export function CharacterBreakdown({ word, relatedWords, onClose }: CharacterBreakdownProps) {
  return (
    <div className="breakdown-overlay" onClick={onClose}>
      <div className="breakdown-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>

        <div className="breakdown-header">
          <span className="breakdown-character">{word.characters}</span>
          <span className="breakdown-pinyin">{word.pinyin}</span>
          <span className="breakdown-meaning">{word.meaning}</span>
        </div>

        <div className="breakdown-section">
          <h3>Character Analysis</h3>
          <div className="character-grid">
            {word.characters.split('').map((char, index) => (
              <div key={index} className="single-character">
                <span className="char-display">{char}</span>
                <span className="char-index">Character {index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {word.components && word.components.length > 0 && (
          <div className="breakdown-section">
            <h3>Components</h3>
            <div className="components-list">
              {word.components.map((component, index) => (
                <span key={index} className="component">{component}</span>
              ))}
            </div>
          </div>
        )}

        {word.notes && (
          <div className="breakdown-section">
            <h3>Notes & Etymology</h3>
            <p className="breakdown-notes">{word.notes}</p>
          </div>
        )}

        <div className="breakdown-section">
          <h3>Category</h3>
          <span className="breakdown-category">{word.category.replace(/_/g, ' ')}</span>
        </div>

        {relatedWords && relatedWords.length > 0 && (
          <div className="breakdown-section">
            <h3>Related Words</h3>
            <div className="related-words">
              {relatedWords.map((related) => (
                <div key={related.pinyin} className="related-word">
                  <span className="related-char">{related.characters}</span>
                  <span className="related-pinyin">{related.pinyin}</span>
                  <span className="related-meaning">{related.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
