
export interface GeneratedPost {
  id?: string;
  post: string;
  intent: string;
}

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type ImageTone = 'line-art' | 'watercolor' | 'creative';

export interface GeneratePostsParams {
  topic: string;
  direction?: string;
  minLength: number;
  maxLength: number;
  difficulty: Difficulty;
  isThinkingMode: boolean;
}

export interface AdjustmentParams {
  length?: 'shorter' | 'longer';
  difficulty?: 'simpler' | 'more_expert';
  instruction?: string;
}
