import * as THREE from 'three';
import { getTerrainHeight, PLAYER } from '../config/GameConfig';
import { SpatialGrid } from './SpatialGrid';
import { distance2D } from '../utils/MathUtils';

interface Obstacle {
  position: THREE.Vector3;
  radius: number;
  type: 'tree' | 'rock';
}

/**
 * Reusable result object to avoid allocations in game loop
 */
const COLLISION_RESULT = new THREE.Vector3();

/**
 * Grid cell sizes optimized for the ski course layout:
 * - Z cells: 50 units (course is ~450 units long, gives ~9 cells)
 * - X cells: 50 units (obstacles at x: ±38 to ±95, gives 3-4 cells per side)
 */
const GRID_CELL_SIZE_Z = 50;
const GRID_CELL_SIZE_X = 50;

export class ObstacleManager {
  private obstacles: Obstacle[] = [];
  private spatialGrid: SpatialGrid<Obstacle>;
  
  constructor() {
    this.spatialGrid = new SpatialGrid<Obstacle>(GRID_CELL_SIZE_Z, GRID_CELL_SIZE_X);
  }
  
  addObstacle(x: number, z: number, radius: number, type: 'tree' | 'rock'): void {
    const terrainY = getTerrainHeight(z);
    const obstacle: Obstacle = {
      position: new THREE.Vector3(x, terrainY, z),
      radius,
      type
    };
    this.obstacles.push(obstacle);
    this.spatialGrid.insert(obstacle);
  }
  
  /**
   * Check collision with obstacles using spatial partitioning
   * @returns Reusable Vector3 with pushback direction, or null if no collision
   * WARNING: The returned vector is reused - copy it if you need to store it!
   */
  checkCollision(playerPosition: THREE.Vector3, playerRadius: number = PLAYER.COLLISION_RADIUS): THREE.Vector3 | null {
    // Query only nearby obstacles using spatial grid
    // Use player radius + max obstacle radius as query range
    const queryRadius = playerRadius + 3; // 3 = approximate max tree radius
    const nearbyObstacles = this.spatialGrid.query(
      playerPosition.x,
      playerPosition.z,
      queryRadius
    );
    
    for (const obstacle of nearbyObstacles) {
      const dx = playerPosition.x - obstacle.position.x;
      const dz = playerPosition.z - obstacle.position.z;
      const dist = distance2D(playerPosition.x, playerPosition.z, obstacle.position.x, obstacle.position.z);
      const minDistance = playerRadius + obstacle.radius;
      
      if (dist < minDistance) {
        // Calculate push-back direction
        const overlap = minDistance - dist;
        const pushX = (dx / dist) * overlap;
        const pushZ = (dz / dist) * overlap;
        
        // Reuse result object to avoid allocations in game loop
        COLLISION_RESULT.set(pushX, 0, pushZ);
        return COLLISION_RESULT;
      }
    }
    return null;
  }
  
  getObstacles(): Obstacle[] {
    return this.obstacles;
  }
  
  /**
   * Get spatial grid statistics for debugging
   */
  getGridStats(): { cellCount: number; objectCount: number; avgObjectsPerCell: number } {
    return this.spatialGrid.getStats();
  }
  
  clear(): void {
    this.obstacles = [];
    this.spatialGrid.clear();
  }
}
