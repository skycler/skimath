import * as THREE from 'three';
import { SkierModel } from './SkierModel';
import { SkierController } from './SkierController';

/**
 * Player - Facade class that composes SkierModel and SkierController
 * Provides a unified interface for the game to interact with the player
 */
export class Player {
  private scene: THREE.Scene;
  private model: SkierModel;
  private controller: SkierController;
  private mesh: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.model = new SkierModel();
    this.mesh = this.model.create();
    this.controller = new SkierController(this.mesh);
  }

  /**
   * Initialize the player and add to scene
   */
  init(): void {
    this.scene.add(this.mesh);
    this.reset();
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
