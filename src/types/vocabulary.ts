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

export interface Progress {
  wordId: string; // pinyin as unique ID
  correctCount: number;
  incorrectCount: number;
  lastReviewed: string;
  struggleWord: boolean;
}

export interface UserProgress {
  [wordId: string]: Progress;
}
