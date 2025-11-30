import { useState } from 'react';
import storiesData from '../data/stories.json';
import './Readables.css';

interface Sentence {
  chinese: string;
  pinyin: string;
  english: string;
  words: string[];
}

interface Story {
  id: string;
  title: string;
  titleChinese: string;
  level: string;
  wordCount: number;
  sentences: Sentence[];
}

const stories: Story[] = storiesData.stories;

interface ReadablesProps {
  onWordClick?: (pinyin: string) => void;
}

export function Readables({ onWordClick }: ReadablesProps) {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showEnglish, setShowEnglish] = useState(false);
  const [currentSentence, setCurrentSentence] = useState(0);

  const handleStorySelect = (story: Story) => {
    setSelectedStory(story);
    setCurrentSentence(0);
  };

  const handleBack = () => {
    setSelectedStory(null);
    setCurrentSentence(0);
  };

  const handleNext = () => {
    if (selectedStory && currentSentence < selectedStory.sentences.length - 1) {
      setCurrentSentence((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSentence > 0) {
      setCurrentSentence((prev) => prev - 1);
    }
  };

  // Story list view
  if (!selectedStory) {
    return (
      <div className="readables-container">
        <h2 className="readables-title">Readables</h2>
        <p className="readables-subtitle">Short stories using words you know</p>

        <div className="story-list">
          {stories.map((story) => (
            <button
              key={story.id}
              className="story-card"
              onClick={() => handleStorySelect(story)}
            >
              <div className="story-header">
                <span className="story-title-chinese">{story.titleChinese}</span>
                <span className="story-level">{story.level}</span>
              </div>
              <span className="story-title-english">{story.title}</span>
              <div className="story-meta">
                <span>{story.sentences.length} sentences</span>
                <span className="story-words">{story.wordCount} words</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Reading view
  const sentence = selectedStory.sentences[currentSentence];
  const progress = ((currentSentence + 1) / selectedStory.sentences.length) * 100;

  return (
    <div className="readables-container">
      <div className="reader-header">
        <button className="back-btn" onClick={handleBack}>
          Back
        </button>
        <div className="reader-title">
          <span className="reader-title-chinese">{selectedStory.titleChinese}</span>
          <span className="reader-title-english">{selectedStory.title}</span>
        </div>
        <div className="reader-progress-text">
          {currentSentence + 1} / {selectedStory.sentences.length}
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="reader-controls">
        <button
          className={`toggle-btn ${showPinyin ? 'active' : ''}`}
          onClick={() => setShowPinyin(!showPinyin)}
        >
          Pinyin
        </button>
        <button
          className={`toggle-btn ${showEnglish ? 'active' : ''}`}
          onClick={() => setShowEnglish(!showEnglish)}
        >
          English
        </button>
      </div>

      <div className="sentence-card">
        <div className="sentence-chinese">{sentence.chinese}</div>

        {showPinyin && (
          <div className="sentence-pinyin">{sentence.pinyin}</div>
        )}

        {showEnglish && (
          <div className="sentence-english">{sentence.english}</div>
        )}

        <div className="sentence-words">
          {sentence.words.map((word, idx) => (
            <button
              key={idx}
              className="word-chip"
              onClick={() => onWordClick?.(word)}
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      <div className="navigation-buttons">
        <button
          className="nav-btn prev"
          onClick={handlePrevious}
          disabled={currentSentence === 0}
        >
          Previous
        </button>
        <button
          className="nav-btn next"
          onClick={handleNext}
          disabled={currentSentence === selectedStory.sentences.length - 1}
        >
          Next
        </button>
      </div>

      {/* Full story view */}
      <div className="full-story">
        <h3>Full Story</h3>
        <div className="story-sentences">
          {selectedStory.sentences.map((s, idx) => (
            <div
              key={idx}
              className={`story-sentence ${idx === currentSentence ? 'active' : ''}`}
              onClick={() => setCurrentSentence(idx)}
            >
              <span className="story-sentence-chinese">{s.chinese}</span>
              {showPinyin && (
                <span className="story-sentence-pinyin">{s.pinyin}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
