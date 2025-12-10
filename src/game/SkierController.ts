import * as THREE from 'three';
import { PLAYER, CRASH, TERRAIN, getTerrainHeight } from '../config/GameConfig';
import { randomFloatInRange } from '../utils/MathUtils';

/**
 * SkierController - Handles movement, input, and state for the skier
 * Separated from 3D model for better maintainability
 */
export class SkierController {
  private mesh: THREE.Group;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private _position: THREE.Vector3 = new THREE.Vector3(
    PLAYER.START_POSITION.x,
    getTerrainHeight(PLAYER.START_POSITION.z, PLAYER.START_POSITION.x),
    PLAYER.START_POSITION.z
  );
  
  // Movement settings from config
  private readonly baseSpeed: number = PLAYER.BASE_SPEED;
  private readonly gravity: number = PLAYER.GRAVITY;
  private readonly maxSpeed: number = PLAYER.MAX_SPEED;
  
  // Rotation-based steering
  private readonly maxTurnAngle: number = PLAYER.MAX_TURN_ANGLE;
  private readonly turnRate: number = PLAYER.TURN_RATE;
  private readonly straightSpeedBonus: number = PLAYER.STRAIGHT_SPEED_BONUS;
  private readonly minTurnSpeedFactor: number = PLAYER.MIN_TURN_SPEED_FACTOR;
  private readonly turnSharpnessPenalty: number = PLAYER.TURN_SHARPNESS_PENALTY;
  private readonly angularFriction: number = PLAYER.ANGULAR_FRICTION;
  
  // Current turn angle (0 = straight, positive = right, negative = left)
  private turnAngle: number = 0;
  // Angular velocity for smooth turning
  private angularVelocity: number = 0;
  
  // Input state
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveForward: boolean = false;
  private moveBackward: boolean = false;
  private hasStarted: boolean = false;
  
  // Crash/tumble state
  private _isCrashed: boolean = false;
  private _isTumbling: boolean = false;
  private crashTimer: number = 0;
  private tumbleTimer: number = 0;
  private crashRotation: THREE.Vector3 = new THREE.Vector3();
  private recoveryPosition: THREE.Vector3 | null = null;

  constructor(mesh: THREE.Group) {
    this.mesh = mesh;
  }

  /**
   * Reset the controller to initial state
   */
  reset(): void {
    this._position.set(
      PLAYER.START_POSITION.x,
      getTerrainHeight(PLAYER.START_POSITION.z, PLAYER.START_POSITION.x),
      PLAYER.START_POSITION.z
    );
    this.velocity.set(0, 0, 0);
    this.mesh.position.copy(this._position);
    this.mesh.rotation.set(0, 0, 0); // Wrapper starts at 0, model inside faces downhill
    this.moveLeft = false;
    this.moveRight = false;
    this.moveForward = false;
    this.moveBackward = false;
    this.hasStarted = false;
    this._isCrashed = false;
    this._isTumbling = false;
    // Reset rotation-based steering state
    this.turnAngle = 0;
    this.angularVelocity = 0;
  }

  /**
   * Handle key down events
   */
  handleKeyDown(code: string): void {
    // Any key press starts the race
    this.hasStarted = true;
    
    switch (code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = true;
        this.moveRight = false; // Cancel opposite direction
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = true;
        this.moveLeft = false; // Cancel opposite direction
        break;
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = true;
        this.moveBackward = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = true;
        this.moveForward = false;
        break;
    }
  }

  /**
   * Handle key up events
   */
  handleKeyUp(code: string): void {
    switch (code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = false;
        break;
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = false;
        break;
    }
  }

  /**
   * Clear all input state
   */
  clearInput(): void {
    this.moveLeft = false;
    this.moveRight = false;
    this.moveForward = false;
    this.moveBackward = false;
  }

  /**
   * Update the skier position and rotation
   */
  update(): void {
    // Don't move until player presses forward to start
    if (!this.hasStarted) {
      return;
    }
    
    // Handle crash/tumble animation
    if (this._isCrashed || this._isTumbling) {
      this.updateCrashState();
      return;
    }
    
    // === ROTATION-BASED STEERING ===
    // Calculate speed-dependent turn rate: slower speed = easier to turn
    const currentSpeed = Math.abs(this.velocity.z);
    const speedRatio = Math.min(1, currentSpeed / this.maxSpeed); // 0 to 1
    // At low speed: turnRate * 3, at max speed: turnRate * 1
    const effectiveTurnRate = this.turnRate * (3 - 2 * speedRatio);
    
    // Apply angular velocity based on input
    // Note: positive angle = left, negative angle = right (matches visual rotation)
    if (this.moveLeft) {
      this.angularVelocity += effectiveTurnRate;
    } else if (this.moveRight) {
      this.angularVelocity -= effectiveTurnRate;
    }
    // When no input, skier holds current rotation (no return to center)
    
    // Apply angular friction to smooth out the turning
    this.angularVelocity *= this.angularFriction;
    
    // Update turn angle with angular velocity
    this.turnAngle += this.angularVelocity;
    
    // Clamp turn angle to max (can't go fully sideways)
    this.turnAngle = THREE.MathUtils.clamp(this.turnAngle, -this.maxTurnAngle, this.maxTurnAngle);
    
    // === SPEED CALCULATION BASED ON ANGLE ===
    // Normalize angle to 0-1 range (0 = straight, 1 = max turn)
    const angleRatio = Math.abs(this.turnAngle) / this.maxTurnAngle;
    
    // Speed multiplier: higher when straight, lower when turning
    // Linear interpolation for more gradual speed changes
    const angleSpeedFactor = THREE.MathUtils.lerp(
      this.straightSpeedBonus,
      this.minTurnSpeedFactor,
      angleRatio // Linear for gradual speed change
    );
    
    // Calculate how sharply we're turning (rate of angle change)
    const turnSharpness = Math.abs(this.angularVelocity);
    
    // Apply extra speed penalty for sharp turns (tighter curves = more speed loss)
    const sharpnessPenalty = 1 - (turnSharpness * this.turnSharpnessPenalty * 5);
    
    // Combined speed factor
    const speedFactor = angleSpeedFactor * Math.max(0.7, sharpnessPenalty);
    
    // === APPLY GRAVITY AND MOVEMENT ===
    // Apply gravity with speed factor (gravity effect reduced when carving sideways)
    this.velocity.z -= this.gravity * speedFactor;
    
    // Forward boost when pressing forward
    if (this.moveForward) {
      this.velocity.z -= this.baseSpeed * 0.12 * speedFactor;
    }
    
    // Braking when pressing backward (snow plow style)
    if (this.moveBackward) {
      this.velocity.z *= 0.92;
    }
    
    // Clamp downhill velocity based on current speed factor
    const effectiveMaxSpeed = this.maxSpeed * speedFactor;
    this.velocity.z = THREE.MathUtils.clamp(this.velocity.z, -effectiveMaxSpeed, this.maxSpeed * 0.15);
    
    // === TRANSVERSAL MOVEMENT ===
    // Calculate lateral (X) velocity based on turn angle and current speed
    // When turned, momentum carries the skier sideways
    // Negative sign because positive turnAngle (left turn) should move left (negative X)
    const lateralComponent = -Math.sin(this.turnAngle) * Math.abs(this.velocity.z);
    this.velocity.x = lateralComponent;
    
    // Update position with velocity
    this._position.z += this.velocity.z;
    this._position.x += this.velocity.x;
    
    // Keep player within the ski path (avoid going into trees)
    this._position.x = THREE.MathUtils.clamp(
      this._position.x,
      -TERRAIN.SKI_PATH_WIDTH,
      TERRAIN.SKI_PATH_WIDTH
    );
    
    // Calculate terrain height using shared function
    this._position.y = getTerrainHeight(this._position.z, this._position.x);
    
    // Update mesh position
    this.mesh.position.copy(this._position);
    
    // === VISUAL ROTATION ===
    // Rotate skier model to face direction of travel
    // The model/wrapper already faces downhill, just add turn angle
    this.mesh.rotation.y = this.turnAngle;
    
    // Tilt skier into the turn (lean into carve) - positive for correct direction
    this.mesh.rotation.z = this.turnAngle * 0.8;
  }

  /**
   * Get current position (cloned to prevent external modification)
   * Use positionRef for read-only hot-path access to avoid allocations
   */
  get position(): THREE.Vector3 {
    return this._position.clone();
  }

  /**
   * Get direct reference to position for read-only hot-path access
   * WARNING: Do NOT modify this vector - it's the internal state!
   * This avoids allocations in the game loop for collision checks
   */
  get positionRef(): Readonly<THREE.Vector3> {
    return this._position;
  }

  /**
   * Get current speed (absolute Z velocity)
   */
  get speed(): number {
    return Math.abs(this.velocity.z);
  }

  /**
   * Check if currently turning left or right
   */
  get isTurning(): boolean {
    return Math.abs(this.turnAngle) > 0.1;
  }

  /**
   * Get current turn angle (for external use, e.g., UI)
   * 0 = straight, negative = left, positive = right
   */
  get currentTurnAngle(): number {
    return this.turnAngle;
  }

  /**
   * Apply collision pushback from obstacles
   */
  applyCollision(pushBack: THREE.Vector3): void {
    // Push player away from obstacle
    this._position.x += pushBack.x;
    this._position.z += pushBack.z;
    
    // Reduce velocity on collision
    this.velocity.x *= 0.3;
    this.velocity.z *= 0.5;
    
    // Update mesh position immediately
    this.mesh.position.copy(this._position);
  }

  /**
   * Trigger a tumble (partial fall, recoverable)
   */
  tumble(): void {
    if (this._isCrashed || this._isTumbling) return;
    
    this._isTumbling = true;
    this.tumbleTimer = CRASH.TUMBLE_DURATION;
    this.velocity.z *= 0.3;
    
    // Random tumble direction
    this.crashRotation.set(
      randomFloatInRange(-0.4, 0.4),
      0,
      randomFloatInRange(-0.6, 0.6)
    );
  }

  /**
   * Trigger a full crash (fall down)
   * @param gateZ - Z position of the gate to recover past
   */
  crash(gateZ?: number): void {
    if (this._isCrashed) return;
    
    this._isCrashed = true;
    this._isTumbling = false;
    this.crashTimer = CRASH.CRASH_DURATION;
    this.velocity.set(0, 0, 0);
    
    // Store recovery position past the gate
    if (gateZ !== undefined) {
      this.recoveryPosition = new THREE.Vector3(
        0,
        this._position.y,
        gateZ - CRASH.RECOVERY_OFFSET_CRASH
      );
    }
    
    // Dramatic fall rotation
    this.crashRotation.set(
      Math.PI / 2 + randomFloatInRange(-0.25, 0.25),
      randomFloatInRange(-0.25, 0.25),
      randomFloatInRange(-0.75, 0.75)
    );
  }

  /**
   * Update crash/tumble animation state
   */
  private updateCrashState(): void {
    if (this._isCrashed) {
      this.crashTimer--;
      
      // Animate falling
      this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, this.crashRotation.x, 0.15);
      this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, this.crashRotation.z, 0.15);
      this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, this._position.y - 0.5, 0.1);
      
      if (this.crashTimer <= 0) {
        this._isCrashed = false;
        this.recoverFromCrash();
      }
    } else if (this._isTumbling) {
      this.tumbleTimer--;
      
      // Wobble animation
      const wobble = Math.sin(this.tumbleTimer * 0.3) * (this.tumbleTimer / 60);
      this.mesh.rotation.x = this.crashRotation.x * wobble;
      this.mesh.rotation.z = this.crashRotation.z * wobble;
      
      // Still moving but slower
      this.velocity.z -= this.gravity * 0.3;
      this._position.z += this.velocity.z;
      this.mesh.position.copy(this._position);
      
      if (this.tumbleTimer <= 0) {
        this._isTumbling = false;
        this.mesh.rotation.x = 0;
        this.mesh.rotation.z = 0;
      }
    }
  }

  /**
   * Recover from a crash and reposition
   */
  private recoverFromCrash(): void {
    // Move past the gate if recovery position was set
    if (this.recoveryPosition) {
      this._position.x = 0; // Center of course
      this._position.z = this.recoveryPosition.z;
      this.recoveryPosition = null;
    }
    
    // Calculate terrain height at new position using shared function
    this._position.y = getTerrainHeight(this._position.z, this._position.x);
    
    // Reset rotation and turn angle
    this.mesh.rotation.set(0, Math.PI, 0);
    this.mesh.position.copy(this._position);
    this.velocity.set(0, 0, -0.1);
    this.turnAngle = 0;
    this.angularVelocity = 0;
    this.hasStarted = true;
  }

  /**
   * Check if currently crashed
   */
  get isCrashed(): boolean {
    return this._isCrashed;
  }

  /**
   * Check if currently tumbling
   */
  get isTumblingState(): boolean {
    return this._isTumbling;
  }
}
