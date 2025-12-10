/**
 * Questions module - Exports for question generation
 */

export {
  MathOperation,
  type IQuestionGenerator,
  type Question,
  type QuestionGeneratorConfig,
  DEFAULT_QUESTION_CONFIG,
} from './IQuestionGenerator';

export {
  BaseQuestionGenerator,
  MultiplicationGenerator,
  AdditionGenerator,
  SubtractionGenerator,
  DivisionGenerator,
  MixedGenerator,
  createQuestionGenerator,
} from './QuestionGenerators';

// Keep backward compatibility with existing QuestionManager
export { QuestionManager } from './QuestionManager';
