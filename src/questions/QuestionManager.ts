import { Difficulty } from '../types';
import { 
  IQuestionGenerator, 
  Question, 
  MathOperation 
} from './IQuestionGenerator';
import { createQuestionGenerator } from './QuestionGenerators';

/**
 * QuestionManager - Manages question generation using composition
 * Uses IQuestionGenerator interface for different math operations
 */
export class QuestionManager {
  private generator: IQuestionGenerator;
  private difficulty: Difficulty = Difficulty.MEDIUM;
  
  constructor(operation: MathOperation = MathOperation.MULTIPLICATION) {
    this.generator = createQuestionGenerator(operation);
  }
  
  /**
   * Set the math operation type
   */
  setOperation(operation: MathOperation): void {
    this.generator = createQuestionGenerator(operation);
    this.generator.setDifficulty(this.difficulty);
  }
  
  /**
   * Set a custom question generator
   */
  setGenerator(generator: IQuestionGenerator): void {
    this.generator = generator;
    this.generator.setDifficulty(this.difficulty);
  }
  
  /**
   * Get the current operation type
   */
  getOperation(): MathOperation {
    return this.generator.operation;
  }
  
  setDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty;
    this.generator.setDifficulty(difficulty);
  }
  
  generateQuestion(): Question {
    return this.generator.generateQuestion();
  }
  
  checkAnswer(question: Question, selectedAnswer: number): boolean {
    return this.generator.checkAnswer(question, selectedAnswer);
  }
}
