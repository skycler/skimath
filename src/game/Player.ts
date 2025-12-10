import * as THREE from 'three';
import { SkierModel } from './SkierModel';
import { SkierController } from './SkierController';
import { AnimatedSkier } from './AnimatedSkier';

/**
 * Player - Facade class that composes SkierModel and SkierController
 * Provides a unified interface for the game to interact with the player
 * 
 * Supports both:
 * - Procedural mesh (SkierModel) - always works, no external files needed
 * - Animated GLTF model (AnimatedSkier) - better visuals if model file exists
 */
export class Player {
  private scene: THREE.Scene;
  private model: SkierModel | null = null;
  private animatedSkier: AnimatedSkier | null = null;
  private controller!: SkierController;
  private mesh!: THREE.Group;
  private useAnimatedModel: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    // Don't create mesh in constructor - wait for init() to try GLTF first
  }

  /**
   * Initialize the player and add to scene
   * Attempts to load animated GLTF model, falls back to procedural mesh
   */
  async init(): Promise<void> {
    console.log('[Player] Starting init...');
    
    // Try to load animated model first
    this.animatedSkier = new AnimatedSkier();
    // Use Vite's base URL for correct path resolution
    const modelPath = `${import.meta.env.BASE_URL}models/skier.glb`;
    console.log('[Player] Attempting to load GLTF model from:', modelPath);
    const loaded = await this.animatedSkier.load(modelPath);
    
    if (loaded) {
      // Use the animated model
      this.mesh = this.animatedSkier.getMesh();
      this.useAnimatedModel = true;
      console.log('[Player] ✓ Using animated GLTF skier model');
      console.log('[Player] Mesh children count:', this.mesh.children.length);
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          console.log('[Player] - Mesh:', child.name || '(unnamed)', 'geometry:', child.geometry.type);
        }
      });
    } else {
      // Fall back to procedural mesh
      console.log('[Player] ✗ GLTF failed to load, creating procedural mesh');
      this.model = new SkierModel();
      this.mesh = this.model.create();
      this.useAnimatedModel = false;
      console.log('[Player] Using procedural skier model');
    }
    
    console.log('[Player] Adding mesh to scene. Scene children before:', this.scene.children.length);
    this.controller = new SkierController(this.mesh);
    this.scene.add(this.mesh);
    console.log('[Player] Scene children after:', this.scene.children.length);
    this.reset();
    console.log('[Player] Init complete');
  }

  /**
   * Reset player to starting position
   */
  reset(): void {
    this.controller.reset();
  }

  /**
   * Handle key down events
   */
  handleKeyDown(code: string): void {
    this.controller.handleKeyDown(code);
  }

  /**
   * Handle key up events
   */
  handleKeyUp(code: string): void {
    this.controller.handleKeyUp(code);
  }

  /**
   * Clear all input state
   */
  clearInput(): void {
    this.controller.clearInput();
  }

  /**
   * Update player movement and animation
   */
  update(): void {
    this.controller.update();
    
    // Update animation mixer if using animated model
    if (this.animatedSkier && this.useAnimatedModel) {
      this.animatedSkier.update();
    }
  }

  /**
   * Get current position
   */
  get position(): THREE.Vector3 {
    return this.controller.position;
  }

  /**
   * Get direct reference to position for read-only hot-path access
   * WARNING: Do NOT modify this vector - use for collision checks only!
   */
  get positionRef(): Readonly<THREE.Vector3> {
    return this.controller.positionRef;
  }

  /**
   * Get current speed
   */
  get speed(): number {
    return this.controller.speed;
  }

  /**
   * Check if currently turning
   */
  get isTurning(): boolean {
    return this.controller.isTurning;
  }

  /**
   * Get current turn angle (0 = straight, negative = left, positive = right)
   */
  get turnAngle(): number {
    return this.controller.currentTurnAngle;
  }

  /**
   * Apply collision pushback
   */
  applyCollision(pushBack: THREE.Vector3): void {
    this.controller.applyCollision(pushBack);
  }

  /**
   * Trigger a tumble
   */
  tumble(): void {
    this.controller.tumble();
  }

  /**
   * Trigger a crash
   */
  crash(gateZ?: number): void {
    this.controller.crash(gateZ);
  }

  /**
   * Check if currently crashed
   */
  get isCrashed(): boolean {
    return this.controller.isCrashed;
  }

  /**
   * Check if currently tumbling
   */
  get isTumblingState(): boolean {
    return this.controller.isTumblingState;
  }
}
