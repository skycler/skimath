import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

/**
 * ModelLoader - Utility for loading GLTF/GLB 3D models
 * 
 * Supports:
 * - GLTF and GLB files
 * - Draco compressed models (optional)
 * - Model caching for reuse
 * 
 * Usage:
 *   const loader = new ModelLoader();
 *   const skier = await loader.load('/models/skier.glb');
 *   scene.add(skier);
 * 
 * Free model sources:
 * - https://quaternius.com (CC0 low-poly characters, nature)
 * - https://kenney.nl/assets (CC0 game assets)
 * - https://poly.pizza (searchable free models)
 * - https://sketchfab.com (many free, check license)
 */
export class ModelLoader {
  private gltfLoader: GLTFLoader;
  private dracoLoader: DRACOLoader | null = null;
  private cache: Map<string, THREE.Group> = new Map();

  constructor(useDraco: boolean = false) {
    this.gltfLoader = new GLTFLoader();

    // Optional: Enable Draco compression for smaller file sizes
    if (useDraco) {
      this.dracoLoader = new DRACOLoader();
      // Use CDN for Draco decoder (or host locally in /public/draco/)
      this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      this.gltfLoader.setDRACOLoader(this.dracoLoader);
    }
  }

  /**
   * Load a GLTF/GLB model
   * @param url - Path to the model file (relative to public folder)
   * @param onProgress - Optional progress callback
   * @returns Promise resolving to the loaded model as THREE.Group
   */
  async load(
    url: string,
    onProgress?: (progress: number) => void
  ): Promise<THREE.Group> {
    // Return cached model if available (cloned for independent transforms)
    if (this.cache.has(url)) {
      return this.cache.get(url)!.clone();
    }

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf: GLTF) => {
          const model = gltf.scene;
          
          // Enable shadows on all meshes
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Cache the original for future cloning
          this.cache.set(url, model.clone());
          
          resolve(model);
        },
        (xhr) => {
          if (onProgress && xhr.total > 0) {
            onProgress(xhr.loaded / xhr.total);
          }
        },
        (error) => {
          console.error(`Failed to load model: ${url}`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Load a model and scale it uniformly
   */
  async loadScaled(url: string, scale: number): Promise<THREE.Group> {
    const model = await this.load(url);
    model.scale.setScalar(scale);
    return model;
  }

  /**
   * Load a model with custom material override
   */
  async loadWithMaterial(
    url: string,
    material: THREE.Material
  ): Promise<THREE.Group> {
    const model = await this.load(url);
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });
    return model;
  }

  /**
   * Preload multiple models for faster access later
   */
  async preload(urls: string[]): Promise<void> {
    await Promise.all(urls.map(url => this.load(url)));
  }

  /**
   * Get animations from a loaded GLTF
   * Useful for animated character models
   */
  async loadWithAnimations(url: string): Promise<{
    model: THREE.Group;
    animations: THREE.AnimationClip[];
    mixer: THREE.AnimationMixer;
  }> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf: GLTF) => {
          const model = gltf.scene;
          const animations = gltf.animations;
          const mixer = new THREE.AnimationMixer(model);

          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          resolve({ model, animations, mixer });
        },
        undefined,
        reject
      );
    });
  }

  /**
   * Clear the model cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Dispose of loader resources
   */
  dispose(): void {
    this.cache.clear();
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
    }
  }
}

// Singleton instance for convenience
export const modelLoader = new ModelLoader();
