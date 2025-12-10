/**
 * MathUtils - Shared utility functions for common calculations
 * Centralizes math operations used throughout the game
 */

/**
 * Generate a random integer in a range (inclusive)
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Random integer between min and max
 */
export function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float in a range
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random float between min and max
 */
export function randomFloatInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Shuffle an array in place using Fisher-Yates algorithm
 * @param array - Array to shuffle
 * @returns The shuffled array (same reference)
 */
export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Clamp a value between min and max
 * @param value - Value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 * @param start - Start value
 * @param end - End value
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated value
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Ensure a score never goes below zero
 * @param currentScore - Current score
 * @param penalty - Amount to subtract
 * @returns New score (minimum 0)
 */
export function applyScorePenalty(currentScore: number, penalty: number): number {
  return Math.max(0, currentScore - penalty);
}

/**
 * Calculate distance between two 2D points
 * @param x1 - First point X
 * @param z1 - First point Z
 * @param x2 - Second point X
 * @param z2 - Second point Z
 * @returns Distance between points
 */
export function distance2D(x1: number, z1: number, x2: number, z2: number): number {
  const dx = x2 - x1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Check if a point is within a circular radius
 * @param px - Point X
 * @param pz - Point Z
 * @param cx - Circle center X
 * @param cz - Circle center Z
 * @param radius - Circle radius
 * @returns True if point is within circle
 */
export function isWithinRadius(
  px: number, pz: number,
  cx: number, cz: number,
  radius: number
): boolean {
  return distance2D(px, pz, cx, cz) <= radius;
}

/**
 * Format milliseconds as MM:SS string
 * @param ms - Time in milliseconds
 * @returns Formatted time string
 */
export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate percentage
 * @param value - Current value
 * @param total - Total value
 * @returns Percentage (0-100), or 0 if total is 0
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Random boolean with optional probability
 * @param probability - Probability of true (0-1), defaults to 0.5
 * @returns Random boolean
 */
export function randomBool(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

/**
 * Pick a random element from an array
 * @param array - Array to pick from
 * @returns Random element, or undefined if array is empty
 */
export function randomElement<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Map a value from one range to another
 * @param value - Value to map
 * @param inMin - Input range minimum
 * @param inMax - Input range maximum
 * @param outMin - Output range minimum
 * @param outMax - Output range maximum
 * @returns Mapped value
 */
export function mapRange(
  value: number,
  inMin: number, inMax: number,
  outMin: number, outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Radians to degrees
 * @param radians - Angle in radians
 * @returns Angle in degrees
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}
