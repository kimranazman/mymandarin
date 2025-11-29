import { useState, useEffect } from 'react';
import vocabularyData from '../data/vocabulary.json';
import type { VocabularyData, WordWithCategory, UserProgress, Progress } from '../types/vocabulary';

const PROGRESS_KEY = 'mandarin-progress';

export function useVocabulary() {
  const [progress, setProgress] = useState<UserProgress>({});

  // Load progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (saved) {
      setProgress(JSON.parse(saved));
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);

  const data = vocabularyData as VocabularyData;

  // Get all words with their categories
  const getAllWords = (): WordWithCategory[] => {
    const words: WordWithCategory[] = [];
    Object.entries(data.vocabulary).forEach(([category, categoryWords]) => {
      categoryWords.forEach(word => {
        words.push({ ...word, category });
      });
    });
    return words;
  };

  // Get words by category
  const getWordsByCategory = (category: string): WordWithCategory[] => {
    const categoryWords = data.vocabulary[category] || [];
    return categoryWords.map(word => ({ ...word, category }));
  };

  // Get all categories
  const getCategories = (): string[] => {
    return Object.keys(data.vocabulary);
  };

  // Get struggle words
  const getStruggleWords = (): WordWithCategory[] => {
    return getAllWords().filter(word => progress[word.pinyin]?.struggleWord);
  };

  // Update word progress
  const updateProgress = (pinyin: string, correct: boolean) => {
    setProgress(prev => {
      const existing = prev[pinyin] || {
        wordId: pinyin,
        correctCount: 0,
        incorrectCount: 0,
        lastReviewed: '',
        struggleWord: false,
      };

      const updated: Progress = {
        ...existing,
        correctCount: correct ? existing.correctCount + 1 : existing.correctCount,
        incorrectCount: correct ? existing.incorrectCount : existing.incorrectCount + 1,
        lastReviewed: new Date().toISOString(),
        struggleWord: !correct && existing.incorrectCount >= 2,
      };

      // Remove from struggle words if they get it right 3 times in a row
      if (correct && updated.correctCount >= 3 && updated.struggleWord) {
        updated.struggleWord = false;
        updated.incorrectCount = 0;
      }

      return { ...prev, [pinyin]: updated };
    });
  };

  // Get progress for a specific word
  const getWordProgress = (pinyin: string): Progress | null => {
    return progress[pinyin] || null;
  };

  // Reset all progress
  const resetProgress = () => {
    setProgress({});
    localStorage.removeItem(PROGRESS_KEY);
  };

  return {
    getAllWords,
    getWordsByCategory,
    getCategories,
    getStruggleWords,
    updateProgress,
    getWordProgress,
    resetProgress,
    progress,
  };
}
