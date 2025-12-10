import { Difficulty } from '../types';

/**
 * MathOperation - Supported math operations for questions
 */
export enum MathOperation {
  ADDITION = 'addition',
  SUBTRACTION = 'subtraction',
  MULTIPLICATION = 'multiplication',
  DIVISION = 'division',
  MIXED = 'mixed',
}

/**
 * Question - Extended interface for math questions
 */
export interface Question {
  text: string;
  correctAnswer: number;
  answers: number[];
  num1: number;
  num2: number;
  operation: MathOperation;
}

/**
 * IQuestionGenerator - Interface for generating math questions
 * Implement this interface to add new math operations
 */
export interface IQuestionGenerator {
  /**
   * The operation type this generator handles
   */
  readonly operation: MathOperation;
  
  /**
   * Display name for the operation
   */
  readonly displayName: string;
  
  /**
   * Symbol used in question text (e.g., '+', '−', '×', '÷')
   */
  readonly symbol: string;
  
  /**
   * Set the difficulty level
   */
  setDifficulty(difficulty: Difficulty): void;
  
  /**
   * Get the current difficulty
   */
  getDifficulty(): Difficulty;
  
  /**
   * Generate a new question
   */
  generateQuestion(): Question;
  
  /**
   * Get the number range for current difficulty
   */
  getDifficultyRange(): { min: number; max: number };
  
  /**
   * Generate plausible wrong answers for a given correct answer
   */
  generateWrongAnswers(correct: number, num1: number, num2: number): number[];
  
  /**
   * Check if an answer is correct
   */
  checkAnswer(question: Question, selectedAnswer: number): boolean;
}

/**
 * QuestionGeneratorConfig - Configuration for question generators
 */
export interface QuestionGeneratorConfig {
  /**
   * Difficulty ranges for each level
   */
  difficultyRanges: {
    [Difficulty.EASY]: { min: number; max: number };
    [Difficulty.MEDIUM]: { min: number; max: number };
    [Difficulty.HARD]: { min: number; max: number };
    [Difficulty.EXPERT]: { min: number; max: number };
  };
  
  /**
   * Number of answer choices to generate
   */
  answerCount: number;
}

/**
 * Default configuration for question generators
 */
export const DEFAULT_QUESTION_CONFIG: QuestionGeneratorConfig = {
  difficultyRanges: {
    [Difficulty.EASY]: { min: 1, max: 5 },
    [Difficulty.MEDIUM]: { min: 1, max: 10 },
    [Difficulty.HARD]: { min: 1, max: 12 },
    [Difficulty.EXPERT]: { min: 10, max: 20 },
  },
  answerCount: 4,
};
