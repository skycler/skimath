import { Difficulty } from '../types';
import { randomInRange, shuffle } from '../utils/MathUtils';
import {
  IQuestionGenerator,
  Question,
  MathOperation,
  QuestionGeneratorConfig,
  DEFAULT_QUESTION_CONFIG,
} from './IQuestionGenerator';

/**
 * BaseQuestionGenerator - Abstract base class for question generators
 * Provides common functionality for all math operations
 */
export abstract class BaseQuestionGenerator implements IQuestionGenerator {
  protected difficulty: Difficulty = Difficulty.MEDIUM;
  protected config: QuestionGeneratorConfig;
  
  abstract readonly operation: MathOperation;
  abstract readonly displayName: string;
  abstract readonly symbol: string;
  
  constructor(config: Partial<QuestionGeneratorConfig> = {}) {
    this.config = { ...DEFAULT_QUESTION_CONFIG, ...config };
  }
  
  setDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty;
  }
  
  getDifficulty(): Difficulty {
    return this.difficulty;
  }
  
  getDifficultyRange(): { min: number; max: number } {
    return this.config.difficultyRanges[this.difficulty];
  }
  
  abstract generateQuestion(): Question;
  abstract generateWrongAnswers(correct: number, num1: number, num2: number): number[];
  
  checkAnswer(question: Question, selectedAnswer: number): boolean {
    return selectedAnswer === question.correctAnswer;
  }
  
  /**
   * Generate answer choices including the correct answer
   */
  protected generateAnswerChoices(correct: number, num1: number, num2: number): number[] {
    const answers = new Set<number>();
    answers.add(correct);
    
    const wrongAnswers = this.generateWrongAnswers(correct, num1, num2);
    shuffle(wrongAnswers);
    
    for (const wrong of wrongAnswers) {
      if (answers.size >= this.config.answerCount) break;
      if (wrong > 0 && wrong !== correct) {
        answers.add(wrong);
      }
    }
    
    // Fill remaining with random offsets
    while (answers.size < this.config.answerCount) {
      const offset = randomInRange(-20, 20);
      const randomAnswer = correct + offset;
      if (randomAnswer > 0 && randomAnswer !== correct) {
        answers.add(randomAnswer);
      }
    }
    
    return shuffle(Array.from(answers));
  }
}

/**
 * MultiplicationGenerator - Generates multiplication questions
 */
export class MultiplicationGenerator extends BaseQuestionGenerator {
  readonly operation = MathOperation.MULTIPLICATION;
  readonly displayName = 'Multiplication';
  readonly symbol = '×';
  
  generateQuestion(): Question {
    const { min, max } = this.getDifficultyRange();
    const num1 = randomInRange(min, max);
    const num2 = randomInRange(min, max);
    const correctAnswer = num1 * num2;
    
    return {
      text: `${num1} ${this.symbol} ${num2} = ?`,
      correctAnswer,
      answers: this.generateAnswerChoices(correctAnswer, num1, num2),
      num1,
      num2,
      operation: this.operation,
    };
  }
  
  generateWrongAnswers(correct: number, num1: number, num2: number): number[] {
    return [
      correct + num1,
      correct - num1,
      correct + num2,
      correct - num2,
      correct + 10,
      correct - 10,
      num1 + num2, // Addition instead
      correct + randomInRange(1, 5),
      correct - randomInRange(1, 5),
      correct + randomInRange(5, 15),
      correct - randomInRange(5, 15),
      (num1 + 1) * num2,
      num1 * (num2 + 1),
      (num1 - 1) * num2,
      num1 * (num2 - 1),
    ];
  }
}

/**
 * AdditionGenerator - Generates addition questions
 */
export class AdditionGenerator extends BaseQuestionGenerator {
  readonly operation = MathOperation.ADDITION;
  readonly displayName = 'Addition';
  readonly symbol = '+';
  
  constructor(config: Partial<QuestionGeneratorConfig> = {}) {
    super({
      ...config,
      difficultyRanges: {
        [Difficulty.EASY]: { min: 1, max: 10 },
        [Difficulty.MEDIUM]: { min: 1, max: 50 },
        [Difficulty.HARD]: { min: 10, max: 100 },
        [Difficulty.EXPERT]: { min: 50, max: 500 },
        ...config.difficultyRanges,
      },
    });
  }
  
  generateQuestion(): Question {
    const { min, max } = this.getDifficultyRange();
    const num1 = randomInRange(min, max);
    const num2 = randomInRange(min, max);
    const correctAnswer = num1 + num2;
    
    return {
      text: `${num1} ${this.symbol} ${num2} = ?`,
      correctAnswer,
      answers: this.generateAnswerChoices(correctAnswer, num1, num2),
      num1,
      num2,
      operation: this.operation,
    };
  }
  
  generateWrongAnswers(correct: number, num1: number, num2: number): number[] {
    return [
      correct + 1,
      correct - 1,
      correct + 10,
      correct - 10,
      num1 * num2, // Multiplication instead
      correct + randomInRange(1, 5),
      correct - randomInRange(1, 5),
      num1, // Forgot to add
      num2,
      correct + num1,
      correct - num2,
    ];
  }
}

/**
 * SubtractionGenerator - Generates subtraction questions
 */
export class SubtractionGenerator extends BaseQuestionGenerator {
  readonly operation = MathOperation.SUBTRACTION;
  readonly displayName = 'Subtraction';
  readonly symbol = '−';
  
  constructor(config: Partial<QuestionGeneratorConfig> = {}) {
    super({
      ...config,
      difficultyRanges: {
        [Difficulty.EASY]: { min: 1, max: 10 },
        [Difficulty.MEDIUM]: { min: 1, max: 50 },
        [Difficulty.HARD]: { min: 10, max: 100 },
        [Difficulty.EXPERT]: { min: 50, max: 500 },
        ...config.difficultyRanges,
      },
    });
  }
  
  generateQuestion(): Question {
    const { min, max } = this.getDifficultyRange();
    // Ensure num1 >= num2 for positive results
    let num1 = randomInRange(min, max);
    let num2 = randomInRange(min, max);
    if (num1 < num2) [num1, num2] = [num2, num1];
    
    const correctAnswer = num1 - num2;
    
    return {
      text: `${num1} ${this.symbol} ${num2} = ?`,
      correctAnswer,
      answers: this.generateAnswerChoices(correctAnswer, num1, num2),
      num1,
      num2,
      operation: this.operation,
    };
  }
  
  generateWrongAnswers(correct: number, num1: number, num2: number): number[] {
    return [
      correct + 1,
      correct - 1,
      correct + 10,
      correct - 10,
      num1 + num2, // Addition instead
      num2 - num1, // Wrong order (negative if displayed)
      Math.abs(num2 - num1),
      correct + randomInRange(1, 5),
      correct - randomInRange(1, 5),
      num1,
      num2,
    ];
  }
}

/**
 * DivisionGenerator - Generates division questions (always whole numbers)
 */
export class DivisionGenerator extends BaseQuestionGenerator {
  readonly operation = MathOperation.DIVISION;
  readonly displayName = 'Division';
  readonly symbol = '÷';
  
  constructor(config: Partial<QuestionGeneratorConfig> = {}) {
    super({
      ...config,
      difficultyRanges: {
        [Difficulty.EASY]: { min: 1, max: 5 },
        [Difficulty.MEDIUM]: { min: 1, max: 10 },
        [Difficulty.HARD]: { min: 1, max: 12 },
        [Difficulty.EXPERT]: { min: 5, max: 15 },
        ...config.difficultyRanges,
      },
    });
  }
  
  generateQuestion(): Question {
    const { min, max } = this.getDifficultyRange();
    // Generate divisor and quotient first to ensure whole number result
    const divisor = randomInRange(Math.max(1, min), max);
    const quotient = randomInRange(min, max);
    const dividend = divisor * quotient;
    
    return {
      text: `${dividend} ${this.symbol} ${divisor} = ?`,
      correctAnswer: quotient,
      answers: this.generateAnswerChoices(quotient, dividend, divisor),
      num1: dividend,
      num2: divisor,
      operation: this.operation,
    };
  }
  
  generateWrongAnswers(correct: number, num1: number, num2: number): number[] {
    return [
      correct + 1,
      correct - 1,
      correct + 2,
      correct - 2,
      num2, // The divisor
      num1 - num2, // Subtraction instead
      correct * 2,
      Math.floor(correct / 2),
      correct + randomInRange(1, 5),
      correct - randomInRange(1, 5),
    ];
  }
}

/**
 * MixedGenerator - Randomly selects from all operations
 */
export class MixedGenerator extends BaseQuestionGenerator {
  readonly operation = MathOperation.MIXED;
  readonly displayName = 'Mixed Operations';
  readonly symbol = '?';
  
  private generators: IQuestionGenerator[];
  
  constructor(config: Partial<QuestionGeneratorConfig> = {}) {
    super(config);
    this.generators = [
      new AdditionGenerator(config),
      new SubtractionGenerator(config),
      new MultiplicationGenerator(config),
      new DivisionGenerator(config),
    ];
  }
  
  setDifficulty(difficulty: Difficulty): void {
    super.setDifficulty(difficulty);
    this.generators.forEach(g => g.setDifficulty(difficulty));
  }
  
  generateQuestion(): Question {
    const generator = this.generators[randomInRange(0, this.generators.length - 1)];
    return generator.generateQuestion();
  }
  
  generateWrongAnswers(correct: number, _num1: number, _num2: number): number[] {
    // This is handled by the individual generators
    return [
      correct + 1,
      correct - 1,
      correct + randomInRange(1, 10),
      correct - randomInRange(1, 10),
    ];
  }
}

/**
 * Factory function to create a question generator by operation type
 */
export function createQuestionGenerator(
  operation: MathOperation,
  config?: Partial<QuestionGeneratorConfig>
): IQuestionGenerator {
  switch (operation) {
    case MathOperation.ADDITION:
      return new AdditionGenerator(config);
    case MathOperation.SUBTRACTION:
      return new SubtractionGenerator(config);
    case MathOperation.MULTIPLICATION:
      return new MultiplicationGenerator(config);
    case MathOperation.DIVISION:
      return new DivisionGenerator(config);
    case MathOperation.MIXED:
      return new MixedGenerator(config);
    default:
      return new MultiplicationGenerator(config);
  }
}
