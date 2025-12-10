import { Difficulty } from '../types';

/**
 * CourseType - Different course layout types
 */
export enum CourseType {
  SLALOM = 'slalom',        // Standard alternating gates
  GIANT_SLALOM = 'giant',   // Wider spacing, longer turns
  SUPER_G = 'super-g',      // High speed, wide gates
  PRACTICE = 'practice',    // Easy straight course
  CUSTOM = 'custom',        // User-defined settings
}

/**
 * GateConfig - Configuration for a single gate
 */
export interface GateConfig {
  x: number;          // X position
  z: number;          // Z position
  color: 'red' | 'blue';
  width: number;      // Gate width
}

/**
 * CourseConfig - Full course configuration
 */
export interface CourseConfig {
  /** Total number of gates */
  gateCount: number;
  
  /** Distance between gates */
  gateSpacing: number;
  
  /** Gate width (distance between poles) */
  gateWidth: number;
  
  /** Starting Z position */
  startZ: number;
  
  /** Maximum lateral offset for gates */
  maxLateralOffset: number;
  
  /** Course description */
  description: string;
}

/**
 * ICourseGenerator - Interface for generating course layouts
 * Implement this interface to add new course types
 */
export interface ICourseGenerator {
  /**
   * The course type this generator handles
   */
  readonly courseType: CourseType;
  
  /**
   * Display name for the course
   */
  readonly displayName: string;
  
  /**
   * Get course configuration for a difficulty
   */
  getConfig(difficulty: Difficulty): CourseConfig;
  
  /**
   * Generate gate positions for the course
   */
  generateGates(difficulty: Difficulty): GateConfig[];
  
  /**
   * Get the finish line Z position
   */
  getFinishLineZ(difficulty: Difficulty): number;
}

/**
 * CourseGeneratorConfig - Base configuration options
 */
export interface CourseGeneratorOptions {
  /** Override default gate count */
  gateCount?: number;
  
  /** Override gate spacing */
  gateSpacing?: number;
  
  /** Override gate width */
  gateWidth?: number;
}
