import * as THREE from 'three';
import { modelLoader } from '../utils/ModelLoader';

/**
 * AnimatedSkier - Loads and animates a GLTF character model from Mixamo
 * 
 * Setup Instructions:
 * 1. Go to https://www.mixamo.com/ and sign in (free Adobe account)
 * 2. Choose a character (e.g., "Y Bot" or any humanoid)
 * 3. Download the character in T-Pose:
 *    - Format: FBX for Unity (.fbx) or GLTF if available
 *    - Click "Download" with default settings
 * 4. Get animations:
 *    - Search for "skiing" or "ski" 
 *    - Or use: "Standing Idle", "Running", "Falling"
 *    - Download each with "Without Skin" to save size
 * 5. Convert to GLB (if needed):
 *    - Use https://gltf.report/ or Blender to convert FBX to GLB
 *    - Combine character + animations into one file
 * 6. Place the .glb file in /public/models/skier.glb
 * 
 * Alternative: Use ready-made GLB from:
 * - https://quaternius.com (free CC0 characters)
 * - https://poly.pizza (search "skier" or "character")
 * Skier by apelab [CC-BY] (https://creativecommons.org/licenses/by/3.0/) via Poly Pizza (https://poly.pizza/m/6IOZN0Q6lHt)
 */
export class AnimatedSkier {
  private model: THREE.Group | null = null;
  private wrapper: THREE.Group; // Wrapper for rotation control
  private mixer: THREE.AnimationMixer | null = null;
  private animations: Map<string, THREE.AnimationAction> = new Map();
  private currentAction: THREE.AnimationAction | null = null;
  private clock: THREE.Clock = new THREE.Clock();
  
  private _isLoaded: boolean = false;
  
  // Fallback mesh while loading or if model fails
  private fallbackMesh: THREE.Group;
  
  constructor() {
    // Create wrapper group - this is what the controller will rotate
    this.wrapper = new THREE.Group();
    // Create a simple fallback mesh
    this.fallbackMesh = this.createFallbackMesh();
    this.wrapper.add(this.fallbackMesh);
  }
  
  /**
   * Get the wrapper group (this is what should be added to scene and rotated by controller)
   */
  getMesh(): THREE.Group {
    return this.wrapper;
  }
  
  /**
   * Check if the model is loaded
   */
  get isLoaded(): boolean {
    return this._isLoaded;
  }
  
  /**
   * Load the skier model from a GLB file
   */
  async load(url: string = '/models/skier.glb'): Promise<boolean> {
    try {
      const { model, animations, mixer } = await modelLoader.loadWithAnimations(url);
      
      this.model = model;
      this.mixer = mixer;
      
      // Calculate bounding box to determine appropriate scale
      const box = new THREE.Box3().setFromObject(this.model);
      const size = new THREE.Vector3();
      box.getSize(size);
      
      // Target height is ~3 units (visible at game camera distance)
      const targetHeight = 3.0;
      const currentHeight = size.y;
      const scale = currentHeight > 0 ? targetHeight / currentHeight : 1;
      
      console.log(`Model size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}, scaling by ${scale.toFixed(3)}`);
      
      // Scale the model
      this.model.scale.set(scale, scale, scale);
      
      // This Poly Pizza skier model needs rotation to stand upright and face downhill
      this.model.rotation.x = -Math.PI / 2 + 0.5;  // Stand up, slight forward lean for ski pose
      
      // Raise model so feet are at ground level (origin is at center, raise by half height)
      this.model.position.y = (targetHeight / 2) * 0.7; // Slightly lower for ski stance
      
      // Remove fallback and add the loaded model to wrapper
      this.wrapper.remove(this.fallbackMesh);
      this.wrapper.add(this.model);
      
      // Store animations by name
      animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        this.animations.set(clip.name.toLowerCase(), action);
      });
      
      // Start with idle/skiing animation if available
      this.playAnimation('idle') || 
      this.playAnimation('skiing') || 
      this.playAnimation('ski') ||
      this.playFirstAnimation();
      
      this._isLoaded = true;
      console.log(`[AnimatedSkier] ✓ Loaded with ${animations.length} animations:`, 
        animations.map(a => a.name));
      
      return true;
    } catch (error) {
      console.warn('[AnimatedSkier] ✗ Failed to load model:', error);
      return false;
    }
  }
  
  /**
   * Play an animation by name
   */
  playAnimation(name: string, crossFadeDuration: number = 0.3): boolean {
    const action = this.animations.get(name.toLowerCase());
    if (!action) return false;
    
    if (this.currentAction && this.currentAction !== action) {
      this.currentAction.fadeOut(crossFadeDuration);
    }
    
    action.reset().fadeIn(crossFadeDuration).play();
    this.currentAction = action;
    return true;
  }
  
  /**
   * Play the first available animation
   */
  private playFirstAnimation(): boolean {
    const firstAction = this.animations.values().next().value;
    if (firstAction) {
      firstAction.play();
      this.currentAction = firstAction;
      return true;
    }
    return false;
  }
  
  /**
   * Update animation mixer (call every frame)
   */
  update(): void {
    if (this.mixer) {
      const delta = this.clock.getDelta();
      this.mixer.update(delta);
    }
  }
  
  /**
   * Set the model's lean/tilt for turning (rotates the wrapper)
   */
  setLean(angle: number): void {
    // Rotate wrapper on Z for lean effect
    this.wrapper.rotation.z = angle;
  }
  
  /**
   * Set the model's Y rotation (facing direction - rotates the wrapper)
   */
  setRotation(angle: number): void {
    // Rotate wrapper on Y - model inside already faces correct direction
    this.wrapper.rotation.y = angle;
  }
  
  /**
   * Create a simple fallback mesh (used if GLTF fails to load)
   */
  private createFallbackMesh(): THREE.Group {
    const group = new THREE.Group();
    
    // Simple capsule body
    const bodyGeom = new THREE.CapsuleGeometry(0.25, 0.8, 8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 1;
    body.castShadow = true;
    group.add(body);
    
    // Head
    const headGeom = new THREE.SphereGeometry(0.2, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.7;
    head.castShadow = true;
    group.add(head);
    
    // Skis
    const skiGeom = new THREE.BoxGeometry(0.12, 0.03, 1.8);
    const skiMat = new THREE.MeshStandardMaterial({ color: 0x0984e3 });
    const leftSki = new THREE.Mesh(skiGeom, skiMat);
    leftSki.position.set(-0.15, 0.015, 0);
    leftSki.castShadow = true;
    group.add(leftSki);
    
    const rightSki = new THREE.Mesh(skiGeom, skiMat);
    rightSki.position.set(0.15, 0.015, 0);
    rightSki.castShadow = true;
    group.add(rightSki);
    
    return group;
  }
  
  /**
   * Get available animation names
   */
  getAnimationNames(): string[] {
    return Array.from(this.animations.keys());
  }
  
  /**
   * Dispose of resources
   */
  dispose(): void {
    this.animations.clear();
    this.mixer = null;
    this.model = null;
  }
}
