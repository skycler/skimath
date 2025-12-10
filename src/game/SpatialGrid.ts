import * as THREE from 'three';

/**
 * Interface for objects that can be stored in the spatial grid
 */
export interface SpatialObject {
  position: THREE.Vector3;
  radius: number;
}

/**
 * SpatialGrid - A simple spatial partitioning system for efficient collision detection
 * 
 * Divides the world into cells along the Z axis (primary direction of movement)
 * and optionally along the X axis for wider areas.
 * 
 * This reduces collision checks from O(n) to O(k) where k is the number of
 * objects in nearby cells, typically 1-5 instead of 100+.
 */
export class SpatialGrid<T extends SpatialObject> {
  private cells: Map<string, T[]> = new Map();
  private cellSizeZ: number;
  private cellSizeX: number;
  
  /**
   * Create a new spatial grid
   * @param cellSizeZ - Size of each cell along the Z axis (default: 50 units)
   * @param cellSizeX - Size of each cell along the X axis (default: 100 units, coarser since player moves mostly in Z)
   */
  constructor(cellSizeZ: number = 50, cellSizeX: number = 100) {
    this.cellSizeZ = cellSizeZ;
    this.cellSizeX = cellSizeX;
  }
  
  /**
   * Insert an object into the grid
   * Objects may be inserted into multiple cells if they span cell boundaries
   */
  insert(object: T): void {
    const { x, z } = object.position;
    const radius = object.radius;
    
    // Calculate all cells this object might overlap with
    const minCellX = Math.floor((x - radius) / this.cellSizeX);
    const maxCellX = Math.floor((x + radius) / this.cellSizeX);
    const minCellZ = Math.floor((z - radius) / this.cellSizeZ);
    const maxCellZ = Math.floor((z + radius) / this.cellSizeZ);
    
    // Insert into all overlapping cells
    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ++) {
        const key = `${cellX},${cellZ}`;
        if (!this.cells.has(key)) {
          this.cells.set(key, []);
        }
        this.cells.get(key)!.push(object);
      }
    }
  }
  
  /**
   * Query objects that might collide with a position
   * Returns objects from the cell containing the position and adjacent cells
   * @param x - X coordinate
   * @param z - Z coordinate
   * @param queryRadius - Radius to check (includes adjacent cells if needed)
   */
  query(x: number, z: number, queryRadius: number = 0): T[] {
    const results: T[] = [];
    const seen = new Set<T>();
    
    // Calculate cells to check based on query radius
    const minCellX = Math.floor((x - queryRadius) / this.cellSizeX);
    const maxCellX = Math.floor((x + queryRadius) / this.cellSizeX);
    const minCellZ = Math.floor((z - queryRadius) / this.cellSizeZ);
    const maxCellZ = Math.floor((z + queryRadius) / this.cellSizeZ);
    
    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ++) {
        const key = `${cellX},${cellZ}`;
        const cell = this.cells.get(key);
        if (cell) {
          for (const obj of cell) {
            // Avoid duplicates (objects in multiple cells)
            if (!seen.has(obj)) {
              seen.add(obj);
              results.push(obj);
            }
          }
        }
      }
    }
    
    return results;
  }
  
  /**
   * Clear all objects from the grid
   */
  clear(): void {
    this.cells.clear();
  }
  
  /**
   * Get statistics about the grid
   */
  getStats(): { cellCount: number; objectCount: number; avgObjectsPerCell: number } {
    let objectCount = 0;
    let totalObjects = 0;
    const counted = new Set<T>();
    
    for (const cell of this.cells.values()) {
      totalObjects += cell.length;
      for (const obj of cell) {
        if (!counted.has(obj)) {
          counted.add(obj);
          objectCount++;
        }
      }
    }
    
    return {
      cellCount: this.cells.size,
      objectCount,
      avgObjectsPerCell: this.cells.size > 0 ? totalObjects / this.cells.size : 0
    };
  }
}
