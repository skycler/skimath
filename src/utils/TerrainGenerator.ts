import { createNoise2D, NoiseFunction2D } from 'simplex-noise';

/**
 * TerrainGenerator - Procedural terrain generation using simplex noise
 * 
 * Creates natural-looking height variations for mountains, hills, and terrain.
 * Uses multiple octaves of noise layered together for realistic results.
 */
export class TerrainGenerator {
  private noise2D: NoiseFunction2D;
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Math.random() * 10000;
    // Create seeded random function for reproducible terrain
    const seededRandom = this.createSeededRandom(this.seed);
    this.noise2D = createNoise2D(seededRandom);
  }

  /**
   * Create a seeded random function for reproducible noise
   */
  private createSeededRandom(seed: number): () => number {
    return () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
  }

  /**
   * Get terrain height at a specific point
   * Combines the base slope with noise-based variations
   * 
   * @param x - X coordinate
   * @param z - Z coordinate (negative = downhill)
   * @param baseSlope - Base slope factor (default matches GameConfig)
   */
  getHeight(x: number, z: number, baseSlope: number = 0.075): number {
    // Base height from slope (original behavior)
    const slopeHeight = Math.max(0, z * -baseSlope);
    
    // Add subtle rolling hills using multiple noise octaves
    const noiseHeight = this.fbm(x * 0.01, z * 0.01, 3, 0.5, 2.0) * 2;
    
    // Combine slope with noise
    return slopeHeight + noiseHeight;
  }

  /**
   * Get height variation for mountain peaks
   * Uses higher frequency noise for rocky appearance
   */
  getMountainHeight(x: number, z: number, baseHeight: number): number {
    const roughness = this.fbm(x * 0.05, z * 0.05, 4, 0.6, 2.0);
    const detail = this.fbm(x * 0.2, z * 0.2, 2, 0.3, 2.0) * 0.3;
    return baseHeight + (roughness + detail) * baseHeight * 0.3;
  }

  /**
   * Fractional Brownian Motion (fBm)
   * Layers multiple octaves of noise for natural-looking terrain
   * 
   * @param x - X coordinate
   * @param z - Z coordinate  
   * @param octaves - Number of noise layers (more = more detail)
   * @param persistence - How much each octave contributes (0.5 typical)
   * @param lacunarity - Frequency multiplier between octaves (2.0 typical)
   */
  fbm(
    x: number,
    z: number,
    octaves: number = 4,
    persistence: number = 0.5,
    lacunarity: number = 2.0
  ): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue; // Normalize to -1 to 1
  }

  /**
   * Get a value suitable for tree density
   * Returns 0-1 where higher values = more likely to place tree
   */
  getTreeDensity(x: number, z: number): number {
    const noise = this.fbm(x * 0.02, z * 0.02, 2, 0.5, 2.0);
    return (noise + 1) / 2; // Convert -1..1 to 0..1
  }

  /**
   * Get tree scale variation based on position
   */
  getTreeScale(x: number, z: number, baseScale: number = 1): number {
    const variation = this.noise2D(x * 0.1, z * 0.1);
    return baseScale * (0.7 + variation * 0.3); // 0.7 to 1.3 scale
  }

  /**
   * Check if terrain is suitable for tree placement
   * Avoids steep slopes and the ski path
   */
  canPlaceTree(x: number, z: number, skiPathWidth: number = 40): boolean {
    // Don't place trees on ski path
    if (Math.abs(x) < skiPathWidth) return false;
    
    // Use noise to create natural clustering
    const density = this.getTreeDensity(x, z);
    return density > 0.3; // 70% chance in forested areas
  }

  /**
   * Generate terrain vertices for a displacement map
   * Useful for creating detailed terrain geometry
   */
  generateHeightmap(
    width: number,
    depth: number,
    resolution: number
  ): Float32Array {
    const data = new Float32Array(resolution * resolution);
    const halfWidth = width / 2;
    const halfDepth = depth / 2;

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const x = (i / resolution) * width - halfWidth;
        const z = (j / resolution) * depth - halfDepth;
        data[i * resolution + j] = this.getHeight(x, z);
      }
    }

    return data;
  }

  /**
   * Get current seed for reproducibility
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * Calculate terrain height from local plane coordinates
   * This is the core terrain height calculation used by both the geometry and getSurfaceHeight
   * 
   * @param localX - Local X coordinate on the terrain plane
   * @param localY - Local Y coordinate on the terrain plane (maps to world Z after rotation)
   */
  getHeightFromLocal(localX: number, localY: number): number {
    // Main slope - steep drop like a pro ski race course
    const slope = -localY * 0.25;
    
    // Noise layers for natural terrain variation
    const largeNoise = this.fbm(localX * 0.008, localY * 0.008, 3, 0.5, 2.0) * 4;
    const mediumNoise = this.fbm(localX * 0.02, localY * 0.02, 2, 0.4, 2.0) * 1.5;
    const fineNoise = this.fbm(localX * 0.1, localY * 0.1, 2, 0.3, 2.0) * 0.3;
    
    // Edge hills - higher terrain on sides
    const edgeFactor = Math.pow(Math.abs(localX) / 150, 2) * 5;
    
    return slope + largeNoise + mediumNoise + fineNoise + edgeFactor;
  }

  /**
   * Get the exact terrain surface height at a world position
   * This matches the terrain geometry calculation exactly, including noise
   * 
   * @param worldX - World X coordinate
   * @param worldZ - World Z coordinate
   */
  getSurfaceHeight(worldX: number, worldZ: number): number {
    // Convert world coordinates to local plane coordinates
    // Plane is centered at z=-250, so localY = -(worldZ + 250)
    const localX = worldX;
    const localY = -(worldZ + 250);
    
    return this.getHeightFromLocal(localX, localY);
  }
}

// Singleton for consistent terrain across the game
export const terrainGenerator = new TerrainGenerator();
