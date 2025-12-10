import * as THREE from 'three';
import { ObstacleManager } from './ObstacleManager';
import { GATES, COLLISION, getTerrainHeight } from '../config/GameConfig';
import { randomFloatInRange } from '../utils/MathUtils';

interface Gate {
  leftPole: THREE.Group;
  rightPole: THREE.Group;
  leftFlag: THREE.Mesh;
  rightFlag: THREE.Mesh;
  position: THREE.Vector3;
  passed: boolean;
  triggered: boolean;
  index: number;
  color: 'red' | 'blue';
}

/**
 * Flag collision result type
 */
export type FlagCollisionType = 'none' | 'graze' | 'tumble' | 'crash';

export interface FlagCollisionResult {
  type: FlagCollisionType;
  gate: Gate | null;
}

/**
 * Reusable result object to avoid allocations in game loop
 * WARNING: This object is reused every call - copy values if you need to store them!
 */
const FLAG_COLLISION_RESULT: FlagCollisionResult = { type: 'none', gate: null };

export class GateManager {
  private scene: THREE.Scene;
  private obstacleManager: ObstacleManager | null = null;
  private gates: Gate[] = [];
  private _gatesPassed: number = 0;
  private _totalGates: number = GATES.TOTAL_GATES;
  private _finishLineZ: number = 0;
  
  // Gate settings from config
  private readonly gateWidth: number = GATES.GATE_WIDTH;
  private readonly gateSpacing: number = GATES.GATE_SPACING;
  private readonly startZ: number = GATES.START_Z;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  setObstacleManager(obstacleManager: ObstacleManager): void {
    this.obstacleManager = obstacleManager;
  }
  
  init(): void {
    this.createStartingGate();
    this.createGates();
    this.createFinishArea();
  }
  
  reset(): void {
    this._gatesPassed = 0;
    this.gates.forEach(gate => {
      gate.passed = false;
      gate.triggered = false;
      // Reset gate panel colors to original
      const panelColor = gate.color === 'red' ? 0xff6b6b : 0x74b9ff;
      if (gate.leftFlag && gate.leftFlag.material) {
        (gate.leftFlag.material as THREE.MeshStandardMaterial).color.setHex(panelColor);
      }
      if (gate.rightFlag && gate.rightFlag.material) {
        (gate.rightFlag.material as THREE.MeshStandardMaterial).color.setHex(panelColor);
      }
    });
  }
  
  private createGates(): void {
    let currentZ = this.startZ;
    
    for (let i = 0; i < this._totalGates; i++) {
      // Vary gate spacing for more natural feel (30-50 units instead of fixed 40)
      const spacingVariation = randomFloatInRange(0.75, 1.25);
      currentZ -= this.gateSpacing * spacingVariation;
      
      const baseX = (i % 2 === 0 ? -1 : 1) * randomFloatInRange(4, 12); // Alternate sides with randomness
      const color = i % 2 === 0 ? 'red' : 'blue'; // Alternating red and blue gates
      
      // Find a clear position for the gate
      const clearX = this.findClearPosition(baseX, currentZ);
      
      const gate = this.createGate(clearX, currentZ, i, color);
      this.gates.push(gate);
    }
  }
  
  private findClearPosition(preferredX: number, z: number): number {
    if (!this.obstacleManager) {
      return preferredX;
    }
    
    const obstacles = this.obstacleManager.getObstacles();
    const gateHalfWidth = this.gateWidth / 2 + 2; // Extra buffer for gate poles
    
    // Check if preferred position is clear
    if (this.isPositionClear(preferredX, z, gateHalfWidth, obstacles)) {
      return preferredX;
    }
    
    // Try alternative positions, moving toward center
    const direction = preferredX > 0 ? -1 : 1;
    for (let offset = 2; offset <= 20; offset += 2) {
      const testX = preferredX + direction * offset;
      
      // Keep within playable bounds (-25 to 25)
      if (Math.abs(testX) > 25) continue;
      
      if (this.isPositionClear(testX, z, gateHalfWidth, obstacles)) {
        return testX;
      }
    }
    
    // If no clear position found, use center (0) as fallback
    return 0;
  }
  
  private isPositionClear(x: number, z: number, halfWidth: number, obstacles: Array<{position: THREE.Vector3, radius: number}>): boolean {
    const leftPoleX = x - halfWidth;
    const rightPoleX = x + halfWidth;
    
    for (const obstacle of obstacles) {
      const obsX = obstacle.position.x;
      const obsZ = obstacle.position.z;
      const obsRadius = obstacle.radius + 1.5; // Extra buffer
      
      // Check if obstacle is near this Z position
      if (Math.abs(obsZ - z) > 10) continue;
      
      // Check if obstacle overlaps with gate area
      if (obsX + obsRadius > leftPoleX && obsX - obsRadius < rightPoleX) {
        return false;
      }
    }
    
    return true;
  }
  
  private createStartingGate(): void {
    const startZ = 5;
    const terrainHeight = 0;
    
    // Starting house/hut
    const houseGroup = new THREE.Group();
    
    // House base
    const baseGeometry = new THREE.BoxGeometry(6, 3, 4);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown wood
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 1.5;
    base.castShadow = true;
    houseGroup.add(base);
    
    // Roof
    const roofGeometry = new THREE.ConeGeometry(4.5, 2, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xc0392b }); // Red roof
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 4;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    houseGroup.add(roof);
    
    // Snow on roof
    const snowRoofGeometry = new THREE.ConeGeometry(4.2, 0.5, 4);
    const snowMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const snowRoof = new THREE.Mesh(snowRoofGeometry, snowMaterial);
    snowRoof.position.y = 4.8;
    snowRoof.rotation.y = Math.PI / 4;
    houseGroup.add(snowRoof);
    
    // Starting gate bar
    const gateBarGeometry = new THREE.BoxGeometry(8, 0.3, 0.3);
    const gateBarMaterial = new THREE.MeshStandardMaterial({ color: 0xf1c40f }); // Yellow
    const gateBar = new THREE.Mesh(gateBarGeometry, gateBarMaterial);
    gateBar.position.set(0, 2.5, -2.5);
    houseGroup.add(gateBar);
    
    // Gate posts
    const postGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0xf1c40f });
    
    const leftPost = new THREE.Mesh(postGeometry, postMaterial);
    leftPost.position.set(-4, 1.5, -2.5);
    leftPost.castShadow = true;
    houseGroup.add(leftPost);
    
    const rightPost = new THREE.Mesh(postGeometry, postMaterial);
    rightPost.position.set(4, 1.5, -2.5);
    rightPost.castShadow = true;
    houseGroup.add(rightPost);
    
    // "START" sign
    const signGeometry = new THREE.BoxGeometry(3, 0.8, 0.1);
    const signMaterial = new THREE.MeshStandardMaterial({ color: 0x2ecc71 }); // Green
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(0, 4.5, -2);
    houseGroup.add(sign);
    
    houseGroup.position.set(0, terrainHeight, startZ);
    this.scene.add(houseGroup);
    
    // Timer display poles
    const timerPoleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
    const timerPoleMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3436 });
    
    const leftTimerPole = new THREE.Mesh(timerPoleGeometry, timerPoleMaterial);
    leftTimerPole.position.set(-5, 2, startZ - 5);
    this.scene.add(leftTimerPole);
    
    const rightTimerPole = new THREE.Mesh(timerPoleGeometry, timerPoleMaterial);
    rightTimerPole.position.set(5, 2, startZ - 5);
    this.scene.add(rightTimerPole);
  }
  
  private createGate(x: number, z: number, index: number, color: 'red' | 'blue'): Gate {
    // Calculate terrain height using shared function
    const terrainHeight = getTerrainHeight(z, x);
    
    // Gate colors - professional slalom style
    const primaryColor = color === 'red' ? 0xe74c3c : 0x3498db;
    const secondaryColor = color === 'red' ? 0xc0392b : 0x2980b9;
    const panelColor = color === 'red' ? 0xff6b6b : 0x74b9ff;
    
    // Create left gate assembly
    const leftGateGroup = this.createGatePole(primaryColor, secondaryColor, panelColor, true);
    leftGateGroup.position.set(x - this.gateWidth / 2, terrainHeight, z);
    this.scene.add(leftGateGroup);
    
    // Create right gate assembly  
    const rightGateGroup = this.createGatePole(primaryColor, secondaryColor, panelColor, false);
    rightGateGroup.position.set(x + this.gateWidth / 2, terrainHeight, z);
    this.scene.add(rightGateGroup);
    
    // Get the panel meshes for color updates
    const leftPanel = leftGateGroup.children.find(c => c.name === 'panel') as THREE.Mesh;
    const rightPanel = rightGateGroup.children.find(c => c.name === 'panel') as THREE.Mesh;
    
    return {
      leftPole: leftGateGroup,
      rightPole: rightGateGroup,
      leftFlag: leftPanel,
      rightFlag: rightPanel,
      position: new THREE.Vector3(x, terrainHeight, z),
      passed: false,
      triggered: false,
      index,
      color
    };
  }
  
  private createGatePole(primaryColor: number, secondaryColor: number, panelColor: number, isLeft: boolean): THREE.Group {
    const group = new THREE.Group();
    
    const poleHeight = 2.0;
    const poleSpacing = 0.5; // Distance between the two poles of a flag
    
    // Materials
    const poleMaterial = new THREE.MeshStandardMaterial({ 
      color: primaryColor,
      roughness: 0.3
    });
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2d3436,
      metalness: 0.5
    });
    const capMaterial = new THREE.MeshStandardMaterial({ color: primaryColor });
    
    // Create TWO poles for this flag
    const poleGeometry = new THREE.CylinderGeometry(0.02, 0.035, poleHeight, 8);
    const baseGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.12, 12);
    const capGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    
    // Inner pole (closer to course center)
    const innerPole = new THREE.Mesh(poleGeometry, poleMaterial.clone());
    innerPole.position.set(0, poleHeight / 2, 0);
    innerPole.castShadow = true;
    innerPole.name = 'innerPole';
    group.add(innerPole);
    
    const innerBase = new THREE.Mesh(baseGeometry, baseMaterial.clone());
    innerBase.position.set(0, 0.06, 0);
    group.add(innerBase);
    
    const innerCap = new THREE.Mesh(capGeometry, capMaterial.clone());
    innerCap.position.set(0, poleHeight, 0);
    group.add(innerCap);
    
    // Outer pole (further from course center)
    const outerOffset = isLeft ? -poleSpacing : poleSpacing;
    
    const outerPole = new THREE.Mesh(poleGeometry, poleMaterial.clone());
    outerPole.position.set(outerOffset, poleHeight / 2, 0);
    outerPole.castShadow = true;
    outerPole.name = 'outerPole';
    group.add(outerPole);
    
    const outerBase = new THREE.Mesh(baseGeometry, baseMaterial.clone());
    outerBase.position.set(outerOffset, 0.06, 0);
    group.add(outerBase);
    
    const outerCap = new THREE.Mesh(capGeometry, capMaterial.clone());
    outerCap.position.set(outerOffset, poleHeight, 0);
    group.add(outerCap);
    
    // Smaller banner stretched between the two poles
    const bannerWidth = poleSpacing - 0.04;
    const bannerHeight = 0.8;
    const bannerGeometry = new THREE.PlaneGeometry(bannerWidth, bannerHeight);
    const bannerMaterial = new THREE.MeshStandardMaterial({ 
      color: panelColor,
      roughness: 0.4,
      side: THREE.DoubleSide
    });
    const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
    banner.position.set(outerOffset / 2, poleHeight - bannerHeight / 2 - 0.1, 0.02);
    banner.castShadow = true;
    banner.name = 'panel';
    group.add(banner);
    
    // Banner border/frame
    const borderGeometry = new THREE.PlaneGeometry(bannerWidth + 0.04, bannerHeight + 0.04);
    const borderMaterial = new THREE.MeshStandardMaterial({ 
      color: secondaryColor,
      roughness: 0.3,
      side: THREE.DoubleSide
    });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.position.set(outerOffset / 2, poleHeight - bannerHeight / 2 - 0.1, 0.01);
    group.add(border);
    
    // Single white stripe on banner (sponsor branding area)
    const stripeWidth = bannerWidth - 0.06;
    const stripeGeometry = new THREE.PlaneGeometry(stripeWidth, 0.15);
    const stripeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.5,
      side: THREE.DoubleSide
    });
    
    // Center stripe
    const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe.position.set(outerOffset / 2, poleHeight - bannerHeight / 2 - 0.1, 0.03);
    group.add(stripe);
    
    // Horizontal support bar at top connecting the two poles
    const supportGeometry = new THREE.CylinderGeometry(0.012, 0.012, poleSpacing, 6);
    const supportMaterial = new THREE.MeshStandardMaterial({ color: primaryColor });
    const topSupport = new THREE.Mesh(supportGeometry, supportMaterial);
    topSupport.position.set(outerOffset / 2, poleHeight - 0.03, 0);
    topSupport.rotation.z = Math.PI / 2;
    group.add(topSupport);
    
    // Store pole spacing info for collision detection
    group.userData.poleSpacing = poleSpacing;
    group.userData.isLeft = isLeft;
    
    return group;
  }
  
  // Gate numbers are now integrated into the panel design visually
  
  private createFinishArea(): void {
    const finishZ = this.startZ - this._totalGates * this.gateSpacing - 20;
    this._finishLineZ = finishZ;
    const terrainHeight = getTerrainHeight(finishZ, 0);
    
    // Finish arch structure
    const archGroup = new THREE.Group();
    
    // Main arch poles
    const poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 8, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3436 });
    
    const leftPole = new THREE.Mesh(poleGeometry, poleMaterial);
    leftPole.position.set(-12, 4, 0);
    leftPole.castShadow = true;
    archGroup.add(leftPole);
    
    const rightPole = new THREE.Mesh(poleGeometry, poleMaterial);
    rightPole.position.set(12, 4, 0);
    rightPole.castShadow = true;
    archGroup.add(rightPole);
    
    // Top arch beam
    const beamGeometry = new THREE.BoxGeometry(26, 1.5, 1);
    const beamMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3436 });
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(0, 8.5, 0);
    beam.castShadow = true;
    archGroup.add(beam);
    
    // "FINISH" banner
    const bannerGeometry = new THREE.PlaneGeometry(20, 3);
    const bannerMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1c40f,
      side: THREE.DoubleSide
    });
    const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
    banner.position.set(0, 6, 0.1);
    archGroup.add(banner);
    
    // Checkered pattern on banner
    const checkerSize = 1;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 20; col++) {
        const checkerGeometry = new THREE.PlaneGeometry(checkerSize, checkerSize);
        const isBlack = (row + col) % 2 === 0;
        const checkerMaterial = new THREE.MeshStandardMaterial({
          color: isBlack ? 0x000000 : 0xffffff,
          side: THREE.DoubleSide
        });
        const checker = new THREE.Mesh(checkerGeometry, checkerMaterial);
        checker.position.set(-9.5 + col * checkerSize, 4.5 + row * checkerSize, 0.2);
        archGroup.add(checker);
      }
    }
    
    archGroup.position.set(0, terrainHeight, finishZ);
    this.scene.add(archGroup);
    
    // Finish area ground marking
    const finishLineGeometry = new THREE.PlaneGeometry(30, 5);
    const finishLineMaterial = new THREE.MeshStandardMaterial({
      color: 0xe74c3c,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    const finishLine = new THREE.Mesh(finishLineGeometry, finishLineMaterial);
    finishLine.rotation.x = -Math.PI / 2;
    finishLine.position.set(0, terrainHeight + 0.05, finishZ + 2);
    this.scene.add(finishLine);
    
    // Spectator fencing on sides
    this.createFencing(-15, terrainHeight, finishZ, 20);
    this.createFencing(15, terrainHeight, finishZ, 20);
    
    // Sponsor banners/flags
    this.createSponsorBanners(terrainHeight, finishZ);
  }
  
  private createFencing(x: number, y: number, z: number, length: number): void {
    const fenceGroup = new THREE.Group();
    
    // Fence posts
    const postGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 6);
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    
    for (let i = 0; i < length / 2; i++) {
      const post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(0, 0.75, -i * 2);
      post.castShadow = true;
      fenceGroup.add(post);
    }
    
    // Fence rails
    const railGeometry = new THREE.BoxGeometry(0.1, 0.1, length);
    const railMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    
    const topRail = new THREE.Mesh(railGeometry, railMaterial);
    topRail.position.set(0, 1.3, -length / 2 + 1);
    fenceGroup.add(topRail);
    
    const bottomRail = new THREE.Mesh(railGeometry, railMaterial);
    bottomRail.position.set(0, 0.5, -length / 2 + 1);
    fenceGroup.add(bottomRail);
    
    fenceGroup.position.set(x, y, z + 10);
    this.scene.add(fenceGroup);
  }
  
  private createSponsorBanners(y: number, z: number): void {
    // Place banners outside the ski path (ski path is x: -25 to +25)
    const bannerPositions = [-30, -27, 27, 30]; // All outside ski path
    const bannerColors = [0x3498db, 0xe74c3c, 0x2ecc71, 0x9b59b6];
    
    bannerPositions.forEach((xPos, i) => {
      const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 6);
      const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3436 });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      
      const bannerGeometry = new THREE.PlaneGeometry(0.8, 1.5);
      const bannerMaterial = new THREE.MeshStandardMaterial({
        color: bannerColors[i],
        side: THREE.DoubleSide
      });
      const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
      banner.position.y = 0.5;
      
      const flagGroup = new THREE.Group();
      flagGroup.add(pole);
      flagGroup.add(banner);
      
      flagGroup.position.set(xPos, y + 1.5, z + 5);
      this.scene.add(flagGroup);
    });
  }
  
  checkCollision(playerPosition: THREE.Vector3): number {
    for (const gate of this.gates) {
      if (gate.passed || gate.triggered) continue;
      
      // Check if player has reached or passed the gate Z position (player moves in -Z direction)
      // Trigger only when player is at or past the gate, not before
      const hasReachedGate = playerPosition.z <= gate.position.z;
      const justPassed = playerPosition.z >= gate.position.z - 3; // Within 3 units after passing
      const distanceX = Math.abs(playerPosition.x - gate.position.x);
      
      if (hasReachedGate && justPassed && distanceX < this.gateWidth / 2 + 1) {
        gate.triggered = true; // Mark as triggered so we only ask once
        return gate.index;
      }
    }
    return -1;
  }
  
  /**
   * Check for flag pole collisions
   * @returns Reusable result object with collision type and gate
   * WARNING: The returned object is reused - copy values if you need to store them!
   */
  checkFlagCollision(playerPosition: THREE.Vector3): FlagCollisionResult {
    const playerRadius = COLLISION.PLAYER_RADIUS;
    const poleRadius = COLLISION.POLE_RADIUS;
    const poleSpacing = GATES.POLE_SPACING;
    
    for (const gate of this.gates) {
      const distanceZ = Math.abs(playerPosition.z - gate.position.z);
      
      // Only check gates we're passing through
      if (distanceZ > 1.5) continue;
      
      // Check both left and right flag poles
      const flags = [
        { group: gate.leftPole, baseX: gate.position.x - this.gateWidth / 2, isLeft: true },
        { group: gate.rightPole, baseX: gate.position.x + this.gateWidth / 2, isLeft: false }
      ];
      
      for (const flag of flags) {
        // Inner pole position (closer to center)
        const innerPoleX = flag.baseX;
        // Outer pole position
        const outerPoleX = flag.isLeft ? innerPoleX - poleSpacing : innerPoleX + poleSpacing;
        
        // Check distance to inner pole
        const distToInner = Math.abs(playerPosition.x - innerPoleX);
        // Check distance to outer pole
        const distToOuter = Math.abs(playerPosition.x - outerPoleX);
        
        // Direct hit on pole = crash
        if (distToInner < playerRadius + poleRadius || distToOuter < playerRadius + poleRadius) {
          FLAG_COLLISION_RESULT.type = 'crash';
          FLAG_COLLISION_RESULT.gate = gate;
          return FLAG_COLLISION_RESULT;
        }
        
        // Check if player went through the banner area (between poles)
        const minPoleX = Math.min(innerPoleX, outerPoleX);
        const maxPoleX = Math.max(innerPoleX, outerPoleX);
        
        if (playerPosition.x > minPoleX && playerPosition.x < maxPoleX) {
          // Player went through the banner - tumble
          FLAG_COLLISION_RESULT.type = 'tumble';
          FLAG_COLLISION_RESULT.gate = gate;
          return FLAG_COLLISION_RESULT;
        }
        
        // Close graze
        if (distToInner < playerRadius + poleRadius + COLLISION.GRAZE_DISTANCE || 
            distToOuter < playerRadius + poleRadius + COLLISION.GRAZE_DISTANCE) {
          FLAG_COLLISION_RESULT.type = 'graze';
          FLAG_COLLISION_RESULT.gate = gate;
          return FLAG_COLLISION_RESULT;
        }
      }
    }
    
    FLAG_COLLISION_RESULT.type = 'none';
    FLAG_COLLISION_RESULT.gate = null;
    return FLAG_COLLISION_RESULT;
  }
  
  passGate(): void {
    const nextGate = this.gates.find(g => g.triggered && !g.passed);
    if (nextGate) {
      nextGate.passed = true;
      this._gatesPassed++;
      
      // Visual feedback - change gate panels to green
      const greenColor = 0x00b894;
      if (nextGate.leftFlag && nextGate.leftFlag.material) {
        (nextGate.leftFlag.material as THREE.MeshStandardMaterial).color.setHex(greenColor);
      }
      if (nextGate.rightFlag && nextGate.rightFlag.material) {
        (nextGate.rightFlag.material as THREE.MeshStandardMaterial).color.setHex(greenColor);
      }
    }
  }
  
  checkFinishLine(playerPosition: THREE.Vector3): boolean {
    // Wide finish line detection - player just needs to cross the Z position
    return playerPosition.z <= this._finishLineZ + 5;
  }
  
  get finishLineZ(): number {
    return this._finishLineZ;
  }
  
  get gatesPassed(): number {
    return this._gatesPassed;
  }
  
  get totalGates(): number {
    return this._totalGates;
  }
}
