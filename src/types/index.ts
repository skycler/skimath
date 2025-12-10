export enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  QUESTION = 'question',
  PAUSED = 'paused',
  ENDED = 'ended'
}

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}

export interface Question {
  text: string;
  correctAnswer: number;
  answers: number[];
  num1: number;
  num2: number;
}

export interface PlayerStats {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  time: number;
  gatesPassed: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}
