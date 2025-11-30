import { useState, useEffect, useCallback } from 'react';
import vocabularyData from '../data/vocabulary.json';
import type {
  VocabularyData,
  WordWithCategory,
  UserProgress,
  Progress,
  UserStats,
  QuizSession,
  QuizMode,
  SRSLevel,
  ReviewRecord
} from '../types/vocabulary';
import { SRS_LEVELS } from '../types/vocabulary';

const PROGRESS_KEY = 'mandarin-progress';
const STATS_KEY = 'mandarin-stats';

// Calculate next review date based on SRS level
function getNextReviewDate(srsLevel: SRSLevel): string {
  const now = new Date();
  const interval = SRS_LEVELS[srsLevel].interval;
  now.setDate(now.getDate() + interval);
  return now.toISOString();
}

// Check if a word is due for review
function isDueForReview(nextReview: string): boolean {
  if (!nextReview) return true;
  return new Date(nextReview) <= new Date();
}

// Get today's date as YYYY-MM-DD
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Default stats
const defaultStats: UserStats = {
  quizHistory: [],
  totalReviews: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: '',
  studyDays: [],
};

export function useVocabulary() {
  const [progress, setProgress] = useState<UserProgress>({});
  const [stats, setStats] = useState<UserStats>(defaultStats);

  // Load progress and stats from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(PROGRESS_KEY);
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }

    const savedStats = localStorage.getItem(STATS_KEY);
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(progress).length > 0) {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    }
  }, [progress]);

  // Save stats to localStorage whenever it changes
  useEffect(() => {
    if (stats.totalReviews > 0 || stats.quizHistory.length > 0) {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }
  }, [stats]);

  const data = vocabularyData as VocabularyData;

  // Get all words with their categories
  const getAllWords = useCallback((): WordWithCategory[] => {
    const words: WordWithCategory[] = [];
    Object.entries(data.vocabulary).forEach(([category, categoryWords]) => {
      categoryWords.forEach(word => {
        words.push({ ...word, category });
      });
    });
    return words;
  }, [data.vocabulary]);

  // Get words by category
  const getWordsByCategory = useCallback((category: string): WordWithCategory[] => {
    const categoryWords = data.vocabulary[category] || [];
    return categoryWords.map(word => ({ ...word, category }));
  }, [data.vocabulary]);

  // Get all categories
  const getCategories = useCallback((): string[] => {
    return Object.keys(data.vocabulary);
  }, [data.vocabulary]);

  // Get words due for review (SRS-based)
  const getWordsForReview = useCallback((): WordWithCategory[] => {
    const allWords = getAllWords();
    return allWords.filter(word => {
      const wordProgress = progress[word.pinyin];
      if (!wordProgress) return true; // New words are due
      return isDueForReview(wordProgress.nextReview);
    });
  }, [getAllWords, progress]);

  // Get struggle words (low SRS level with multiple incorrect)
  const getStruggleWords = useCallback((): WordWithCategory[] => {
    return getAllWords().filter(word => {
      const wordProgress = progress[word.pinyin];
      if (!wordProgress) return false;
      return wordProgress.srsLevel <= 1 && wordProgress.incorrectCount >= 2;
    });
  }, [getAllWords, progress]);

  // Get words by SRS level
  const getWordsBySRSLevel = useCallback((level: SRSLevel): WordWithCategory[] => {
    return getAllWords().filter(word => {
      const wordProgress = progress[word.pinyin];
      if (level === 0) return !wordProgress;
      return wordProgress?.srsLevel === level;
    });
  }, [getAllWords, progress]);

  // Update word progress with SRS logic
  const updateProgress = useCallback((pinyin: string, correct: boolean, mode: QuizMode = 'flashcard', responseTime?: number) => {
    setProgress(prev => {
      const existing = prev[pinyin];
      const now = new Date().toISOString();

      // Create new review record
      const reviewRecord: ReviewRecord = {
        date: now,
        correct,
        mode,
        responseTime,
      };

      if (!existing) {
        // First time seeing this word
        const newProgress: Progress = {
          wordId: pinyin,
          correctCount: correct ? 1 : 0,
          incorrectCount: correct ? 0 : 1,
          lastReviewed: now,
          nextReview: getNextReviewDate(correct ? 1 : 0),
          srsLevel: correct ? 1 : 0,
          streak: correct ? 1 : 0,
          history: [reviewRecord],
        };
        return { ...prev, [pinyin]: newProgress };
      }

      // Calculate new SRS level
      let newLevel: SRSLevel = existing.srsLevel;
      let newStreak = existing.streak;

      if (correct) {
        // Move up one level (max 5)
        newLevel = Math.min(5, existing.srsLevel + 1) as SRSLevel;
        newStreak = existing.streak + 1;
      } else {
        // Drop down (but not below 1 if they've seen it)
        newLevel = Math.max(1, existing.srsLevel - 2) as SRSLevel;
        newStreak = 0;
      }

      const updated: Progress = {
        ...existing,
        correctCount: correct ? existing.correctCount + 1 : existing.correctCount,
        incorrectCount: correct ? existing.incorrectCount : existing.incorrectCount + 1,
        lastReviewed: now,
        nextReview: getNextReviewDate(newLevel),
        srsLevel: newLevel,
        streak: newStreak,
        history: [reviewRecord, ...existing.history].slice(0, 10), // Keep last 10
      };

      return { ...prev, [pinyin]: updated };
    });

    // Update daily stats
    updateDailyStats();
  }, []);

  // Update daily study stats
  const updateDailyStats = useCallback(() => {
    const today = getTodayDate();

    setStats(prev => {
      const studyDays = prev.studyDays.includes(today)
        ? prev.studyDays
        : [...prev.studyDays, today].slice(-365); // Keep last year

      // Calculate streak
      let currentStreak = 1;
      const sortedDays = [...studyDays].sort().reverse();

      for (let i = 1; i < sortedDays.length; i++) {
        const prevDay = new Date(sortedDays[i - 1]);
        const currDay = new Date(sortedDays[i]);
        const diffDays = Math.floor((prevDay.getTime() - currDay.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }

      return {
        ...prev,
        totalReviews: prev.totalReviews + 1,
        currentStreak,
        longestStreak: Math.max(prev.longestStreak, currentStreak),
        lastStudyDate: today,
        studyDays,
      };
    });
  }, []);

  // Record a quiz session
  const recordQuizSession = useCallback((session: Omit<QuizSession, 'id' | 'date'>) => {
    const newSession: QuizSession = {
      ...session,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };

    setStats(prev => ({
      ...prev,
      quizHistory: [newSession, ...prev.quizHistory].slice(0, 100), // Keep last 100 sessions
    }));
  }, []);

  // Get progress for a specific word
  const getWordProgress = useCallback((pinyin: string): Progress | null => {
    return progress[pinyin] || null;
  }, [progress]);

  // Get overall statistics
  const getStatistics = useCallback(() => {
    const allWords = getAllWords();
    const totalWords = allWords.length;

    const levelCounts = {
      0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };

    allWords.forEach(word => {
      const wordProgress = progress[word.pinyin];
      const level = wordProgress?.srsLevel ?? 0;
      levelCounts[level]++;
    });

    const masteredCount = levelCounts[4] + levelCounts[5];
    const learningCount = levelCounts[1] + levelCounts[2];
    const newCount = levelCounts[0];

    // Calculate accuracy from recent reviews
    let recentCorrect = 0;
    let recentTotal = 0;
    Object.values(progress).forEach(p => {
      p.history.forEach(h => {
        recentTotal++;
        if (h.correct) recentCorrect++;
      });
    });

    const accuracy = recentTotal > 0 ? Math.round((recentCorrect / recentTotal) * 100) : 0;

    // Words due today
    const dueToday = getWordsForReview().length;

    return {
      totalWords,
      levelCounts,
      masteredCount,
      learningCount,
      newCount,
      accuracy,
      dueToday,
      ...stats,
    };
  }, [getAllWords, progress, stats, getWordsForReview]);

  // Reset all progress
  const resetProgress = useCallback(() => {
    setProgress({});
    setStats(defaultStats);
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(STATS_KEY);
  }, []);

  return {
    getAllWords,
    getWordsByCategory,
    getCategories,
    getWordsForReview,
    getStruggleWords,
    getWordsBySRSLevel,
    updateProgress,
    recordQuizSession,
    getWordProgress,
    getStatistics,
    resetProgress,
    progress,
    stats,
  };
}
