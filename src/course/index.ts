/**
 * Course module - Exports for course generation
 */

export {
  CourseType,
  type ICourseGenerator,
  type CourseConfig,
  type GateConfig,
  type CourseGeneratorOptions,
} from './ICourseGenerator';

export {
  BaseCourseGenerator,
  SlalomCourseGenerator,
  GiantSlalomCourseGenerator,
  SuperGCourseGenerator,
  PracticeCourseGenerator,
  createCourseGenerator,
  getAllCourseGenerators,
} from './CourseGenerators';
