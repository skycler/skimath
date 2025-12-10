import { Difficulty } from '../types';
import { randomFloatInRange } from '../utils/MathUtils';
import {
  ICourseGenerator,
  CourseType,
  CourseConfig,
  GateConfig,
  CourseGeneratorOptions,
} from './ICourseGenerator';

/**
 * BaseCourseGenerator - Abstract base class for course generators
 */
export abstract class BaseCourseGenerator implements ICourseGenerator {
  protected options: CourseGeneratorOptions;
  
  abstract readonly courseType: CourseType;
  abstract readonly displayName: string;
  
  constructor(options: CourseGeneratorOptions = {}) {
    this.options = options;
  }
  
  abstract getConfig(difficulty: Difficulty): CourseConfig;
  
  generateGates(difficulty: Difficulty): GateConfig[] {
    const config = this.getConfig(difficulty);
    const gates: GateConfig[] = [];
    
    for (let i = 0; i < config.gateCount; i++) {
      const gate = this.generateGate(i, config);
      gates.push(gate);
    }
    
    return gates;
  }
  
  getFinishLineZ(difficulty: Difficulty): number {
    const config = this.getConfig(difficulty);
    return config.startZ - (config.gateCount * config.gateSpacing) - 50;
  }
  
  /**
   * Generate a single gate configuration
   */
  protected abstract generateGate(index: number, config: CourseConfig): GateConfig;
}

/**
 * SlalomCourseGenerator - Standard slalom course with alternating gates
 */
export class SlalomCourseGenerator extends BaseCourseGenerator {
  readonly courseType = CourseType.SLALOM;
  readonly displayName = 'Slalom';
  
  getConfig(difficulty: Difficulty): CourseConfig {
    const baseConfig = {
      gateWidth: this.options.gateWidth ?? 8,
      startZ: -30,
      description: 'Standard slalom with tight alternating gates',
    };
    
    switch (difficulty) {
      case Difficulty.EASY:
        return {
          ...baseConfig,
          gateCount: this.options.gateCount ?? 6,
          gateSpacing: this.options.gateSpacing ?? 50,
          maxLateralOffset: 6,
        };
      case Difficulty.MEDIUM:
        return {
          ...baseConfig,
          gateCount: this.options.gateCount ?? 10,
          gateSpacing: this.options.gateSpacing ?? 40,
          maxLateralOffset: 10,
        };
      case Difficulty.HARD:
        return {
          ...baseConfig,
          gateCount: this.options.gateCount ?? 12,
          gateSpacing: this.options.gateSpacing ?? 35,
          maxLateralOffset: 14,
        };
      case Difficulty.EXPERT:
        return {
          ...baseConfig,
          gateCount: this.options.gateCount ?? 15,
          gateSpacing: this.options.gateSpacing ?? 30,
          maxLateralOffset: 18,
        };
      default:
        return {
          ...baseConfig,
          gateCount: 10,
          gateSpacing: 40,
          maxLateralOffset: 10,
        };
    }
  }
  
  protected generateGate(index: number, config: CourseConfig): GateConfig {
    const z = config.startZ - index * config.gateSpacing;
    const side = index % 2 === 0 ? -1 : 1;
    const offset = randomFloatInRange(4, config.maxLateralOffset);
    
    return {
      x: side * offset,
      z,
      color: index % 2 === 0 ? 'red' : 'blue',
      width: config.gateWidth,
    };
  }
}

/**
 * GiantSlalomCourseGenerator - Wider gates with more spacing
 */
export class GiantSlalomCourseGenerator extends BaseCourseGenerator {
  readonly courseType = CourseType.GIANT_SLALOM;
  readonly displayName = 'Giant Slalom';
  
  getConfig(difficulty: Difficulty): CourseConfig {
    const baseConfig = {
      gateWidth: this.options.gateWidth ?? 12,
      startZ: -30,
      description: 'Giant slalom with wider gates and longer turns',
    };
    
    switch (difficulty) {
      case Difficulty.EASY:
        return {
          ...baseConfig,
          gateCount: this.options.gateCount ?? 5,
          gateSpacing: this.options.gateSpacing ?? 70,
          maxLateralOffset: 12,
        };
      case Difficulty.MEDIUM:
        return {
          ...baseConfig,
          gateCount: this.options.gateCount ?? 8,
          gateSpacing: this.options.gateSpacing ?? 60,
          maxLateralOffset: 16,
        };
      case Difficulty.HARD:
        return {
          ...baseConfig,
          gateCount: this.options.gateCount ?? 10,
          gateSpacing: this.options.gateSpacing ?? 55,
          maxLateralOffset: 20,
        };
      case Difficulty.EXPERT:
        return {
          ...baseConfig,
          gateCount: this.options.gateCount ?? 12,
          gateSpacing: this.options.gateSpacing ?? 50,
          maxLateralOffset: 22,
        };
      default:
        return {
          ...baseConfig,
          gateCount: 8,
          gateSpacing: 60,
          maxLateralOffset: 16,
        };
    }
  }
  
  protected generateGate(index: number, config: CourseConfig): GateConfig {
    const z = config.startZ - index * config.gateSpacing;
    const side = index % 2 === 0 ? -1 : 1;
    const offset = randomFloatInRange(8, config.maxLateralOffset);
    
    return {
      x: side * offset,
      z,
      color: index % 2 === 0 ? 'red' : 'blue',
      width: config.gateWidth,
    };
  }
}

/**
 * SuperGCourseGenerator - High speed course with wide gates
 */
export class SuperGCourseGenerator extends BaseCourseGenerator {
  readonly courseType = CourseType.SUPER_G;
  readonly displayName = 'Super-G';
  
  getConfig(difficulty: Difficulty): CourseConfig {
    const baseConfig = {
      gateWidth: this.options.gateWidth ?? 16,
      startZ: -30,
      description: 'High-speed Super-G with wide gates',
    };
    
    switch (difficulty) {
      case Difficulty.EASY:
        return {
          ...baseConfig,
          gateCount: this.options.gateCount ?? 4,
          gateSpacing: this.options.gateSpacing ?? 100,
          maxLateralOffset: 15,
        };
      case Difficulty.MEDIUM:
        return {
          ...baseConfig,
          gateCount: this.options.gateCount ?? 6,
          gateSpacing: this.options.gateSpacing ?? 90,
          maxLateralOffset: 18,
        };
      case Difficulty.HARD:
        return {
          ...baseConfig,
          gateCount: this.options.gateCount ?? 8,
          gateSpacing: this.options.gateSpacing ?? 80,
          maxLateralOffset: 20,
        };
      case Difficulty.EXPERT:
        return {
          ...baseConfig,
          gateCount: this.options.gateCount ?? 10,
          gateSpacing: this.options.gateSpacing ?? 70,
          maxLateralOffset: 22,
        };
      default:
        return {
          ...baseConfig,
          gateCount: 6,
          gateSpacing: 90,
          maxLateralOffset: 18,
        };
    }
  }
  
  protected generateGate(index: number, config: CourseConfig): GateConfig {
    const z = config.startZ - index * config.gateSpacing;
    // Super-G has more gradual transitions
    const side = index % 2 === 0 ? -1 : 1;
    const offset = randomFloatInRange(10, config.maxLateralOffset);
    
    return {
      x: side * offset,
      z,
      color: index % 2 === 0 ? 'red' : 'blue',
      width: config.gateWidth,
    };
  }
}

/**
 * PracticeCourseGenerator - Easy straight course for beginners
 */
export class PracticeCourseGenerator extends BaseCourseGenerator {
  readonly courseType = CourseType.PRACTICE;
  readonly displayName = 'Practice';
  
  getConfig(_difficulty: Difficulty): CourseConfig {
    return {
      gateCount: this.options.gateCount ?? 5,
      gateSpacing: this.options.gateSpacing ?? 60,
      gateWidth: this.options.gateWidth ?? 10,
      startZ: -30,
      maxLateralOffset: 3,
      description: 'Easy practice course with straight-line gates',
    };
  }
  
  protected generateGate(index: number, config: CourseConfig): GateConfig {
    const z = config.startZ - index * config.gateSpacing;
    // Practice course has gates near center
    const offset = randomFloatInRange(-config.maxLateralOffset, config.maxLateralOffset);
    
    return {
      x: offset,
      z,
      color: index % 2 === 0 ? 'red' : 'blue',
      width: config.gateWidth,
    };
  }
}

/**
 * Factory function to create a course generator by type
 */
export function createCourseGenerator(
  courseType: CourseType,
  options?: CourseGeneratorOptions
): ICourseGenerator {
  switch (courseType) {
    case CourseType.SLALOM:
      return new SlalomCourseGenerator(options);
    case CourseType.GIANT_SLALOM:
      return new GiantSlalomCourseGenerator(options);
    case CourseType.SUPER_G:
      return new SuperGCourseGenerator(options);
    case CourseType.PRACTICE:
      return new PracticeCourseGenerator(options);
    default:
      return new SlalomCourseGenerator(options);
  }
}

/**
 * Get all available course generators
 */
export function getAllCourseGenerators(): ICourseGenerator[] {
  return [
    new SlalomCourseGenerator(),
    new GiantSlalomCourseGenerator(),
    new SuperGCourseGenerator(),
    new PracticeCourseGenerator(),
  ];
}
