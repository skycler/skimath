/**
 * Centralized game configuration
 * All magic numbers and game settings in one place
 */

import { terrainGenerator } from '../utils/TerrainGenerator';

// =============================================================================
// PLAYER SETTINGS
// =============================================================================

export const PLAYER = {
  /** Base forward speed */
  BASE_SPEED: 0.05,
  /** Downhill gravity acceleration */
  GRAVITY: 0.005,
  /** Maximum downhill velocity */
  MAX_SPEED: 0.4,
  /** Collision radius for obstacles */
  COLLISION_RADIUS: 1,
  /** Starting position */
  START_POSITION: { x: 0, y: 1, z: 0 },
  
  // === ROTATION-BASED STEERING ===
  /** Maximum turn angle in radians (45 degrees for controlled carving) */
  MAX_TURN_ANGLE: Math.PI / 4,
  /** How fast the skier rotates when turning (radians per frame) */
  TURN_RATE: 0.003,
  /** How fast the skier returns to straight when not turning */
  RETURN_RATE: 0.06,
  /** Speed multiplier when riding straight (1.0 = normal) */
  STRAIGHT_SPEED_BONUS: 1.02,
  /** Minimum speed multiplier at max turn angle */
  MIN_TURN_SPEED_FACTOR: 0.4,
  /** Speed loss from sharp turning (higher = more loss from tight curves) */
  TURN_SHARPNESS_PENALTY: 0.008,
  /** Rate of angular velocity decay (friction on rotation) - lower = more responsive */
  ANGULAR_FRICTION: 0.85,
} as const;

// =============================================================================
// CRASH/TUMBLE SETTINGS
// =============================================================================

export const CRASH = {
  /** Frames to recover from full crash */
  CRASH_DURATION: 120,
  /** Frames to recover from tumble */
  TUMBLE_DURATION: 60,
  /** Z offset for recovery position after crash */
  RECOVERY_OFFSET_CRASH: 5,
  /** Z offset for recovery position after tumble */
  RECOVERY_OFFSET_TUMBLE: 3,
} as const;

// =============================================================================
// GATE SETTINGS
// =============================================================================

export const GATES = {
  /** Total number of gates in course */
  TOTAL_GATES: 10,
  /** Width between left and right poles */
  GATE_WIDTH: 8,
  /** Distance between consecutive gates */
  GATE_SPACING: 40,
  /** Z position of first gate */
  START_Z: -30,
  /** Spacing between flag poles in a single flag */
  POLE_SPACING: 0.5,
  /** Banner width */
  BANNER_WIDTH: 0.45,
  /** Banner height */
  BANNER_HEIGHT: 0.7,
} as const;

// =============================================================================
// COLLISION DISTANCES
// =============================================================================

export const COLLISION = {
  /** Player collision radius for flag checks */
  PLAYER_RADIUS: 0.4,
  /** Flag pole radius */
  POLE_RADIUS: 0.05,
  /** Distance for graze detection */
  GRAZE_DISTANCE: 0.25,
} as const;

// =============================================================================
// CAMERA SETTINGS
// =============================================================================

export const CAMERA = {
  /** Field of view in degrees */
  FOV: 65,
  /** Near clipping plane */
  NEAR: 0.1,
  /** Far clipping plane */
  FAR: 2000,
  /** Offset from player position - closer and lower for more immersive view */
  OFFSET: { x: 0, y: 2.5, z: 5 },
  /** Look-at offset from player */
  LOOK_OFFSET: { x: 0, y: 0.5, z: -12 },
} as const;

// =============================================================================
// SCORING
// =============================================================================

export const SCORING = {
  /** Base points for correct answer */
  BASE_POINTS: 100,
  /** Points lost for wrong answer */
  WRONG_ANSWER_PENALTY: 50,
  /** Points lost for crashing into flag */
  CRASH_PENALTY: 100,
  /** Points lost for tumbling through flag */
  TUMBLE_PENALTY: 25,
  /** Difficulty multipliers */
  DIFFICULTY_MULTIPLIERS: {
    easy: 1,
    medium: 1.5,
    hard: 2,
    expert: 3,
  },
} as const;

// =============================================================================
// TIME PENALTIES (in milliseconds)
// =============================================================================

export const TIME_PENALTIES = {
  /** Time added for wrong answer */
  WRONG_ANSWER: 3000,
  /** Time added for crash */
  CRASH: 5000,
  /** Time added for tumble */
  TUMBLE: 2000,
} as const;

// =============================================================================
// ACHIEVEMENTS
// =============================================================================

export const ACHIEVEMENTS = {
  /** Accuracy needed for Perfect Run */
  PERFECT_ACCURACY: 100,
  /** Accuracy needed for Math Master */
  MATH_MASTER_ACCURACY: 90,
  /** Time in ms for Speed Demon */
  SPEED_DEMON_TIME: 60000,
  /** Score needed for High Scorer */
  HIGH_SCORER_POINTS: 1000,
} as const;

// =============================================================================
// TERRAIN
// =============================================================================

export const TERRAIN = {
  /** Ski path bounds (player can move within ±this value) */
  SKI_PATH_WIDTH: 25,
  /** Fog density */
  FOG_DENSITY: 0.003,
} as const;

// =============================================================================
// UI TIMING
// =============================================================================

export const UI = {
  /** Delay before hiding question modal (ms) */
  QUESTION_FEEDBACK_DELAY: 1000,
  /** Countdown beep interval (ms) */
  COUNTDOWN_INTERVAL: 1000,
} as const;

// =============================================================================
// AUDIO
// =============================================================================

export const AUDIO = {
  /** Master volume (0-1) */
  MASTER_VOLUME: 0.5,
  /** Musical note frequencies */
  NOTES: {
    C5: 523.25,
    E5: 659.25,
    G5: 783.99,
    C6: 1046.50,
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate terrain height at a given world position
 * Uses the exact same calculation as the terrain geometry, including noise
 * @param z - World Z position
 * @param x - World X position (optional, defaults to 0 for center of slope)
 */
export function getTerrainHeight(z: number, x: number = 0): number {
  return terrainGenerator.getSurfaceHeight(x, z);
}
