export interface Word {
  pinyin: string;
  characters: string;
  meaning: string;
  notes?: string;
  components?: string[];
}

export interface VocabularyData {
  vocabulary: {
    [category: string]: Word[];
  };
}

export interface WordWithCategory extends Word {
  category: string;
}

// SRS Levels: each level has a different review interval
export type SRSLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const SRS_LEVELS = {
  0: { name: 'New', interval: 0, color: '#6b7280' },           // Gray - never seen
  1: { name: 'Learning', interval: 1, color: '#ef4444' },      // Red - review in 1 day
  2: { name: 'Familiar', interval: 3, color: '#f59e0b' },      // Orange - review in 3 days
  3: { name: 'Practiced', interval: 7, color: '#eab308' },     // Yellow - review in 1 week
  4: { name: 'Known', interval: 14, color: '#22c55e' },        // Green - review in 2 weeks
  5: { name: 'Mastered', interval: 30, color: '#6366f1' },     // Purple - review in 1 month
} as const;

export interface Progress {
  wordId: string;
  correctCount: number;
  incorrectCount: number;
  lastReviewed: string;
  nextReview: string;
  srsLevel: SRSLevel;
  streak: number; // consecutive correct answers
  history: ReviewRecord[]; // last 10 reviews
}

export interface ReviewRecord {
  date: string;
  correct: boolean;
  mode: QuizMode;
  responseTime?: number; // milliseconds
}

export type QuizMode = 'character-to-meaning' | 'meaning-to-character' | 'pinyin-to-character' | 'flashcard';

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface QuizSession {
  id: string;
  date: string;
  mode: QuizMode;
  difficulty: QuizDifficulty;
  category: string; // 'all' or specific category
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  firstAttemptCorrect: number; // got it right on first try
  secondAttemptCorrect: number; // needed second attempt
  duration: number; // seconds
  wordsReviewed: string[]; // pinyin list
}

export interface UserProgress {
  [wordId: string]: Progress;
}

export interface UserStats {
  quizHistory: QuizSession[];
  totalReviews: number;
  currentStreak: number; // days in a row studied
  longestStreak: number;
  lastStudyDate: string;
  studyDays: string[]; // dates studied (for streak calculation)
}
