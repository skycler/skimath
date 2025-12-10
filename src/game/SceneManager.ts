import * as THREE from 'three';
import { ObstacleManager } from './ObstacleManager';
import { CAMERA, TERRAIN, getTerrainHeight } from '../config/GameConfig';
import { randomFloatInRange, randomBool } from '../utils/MathUtils';
import { terrainGenerator } from '../utils/TerrainGenerator';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public obstacleManager: ObstacleManager;
  private renderer: THREE.WebGLRenderer;
  
  // Camera follow settings from config
  private cameraOffset = new THREE.Vector3(
    CAMERA.OFFSET.x,
    CAMERA.OFFSET.y,
    CAMERA.OFFSET.z
  );
  private cameraLookOffset = new THREE.Vector3(
    CAMERA.LOOK_OFFSET.x,
    CAMERA.LOOK_OFFSET.y,
    CAMERA.LOOK_OFFSET.z
  );
  
  // For animated elements
  private clouds: THREE.Group[] = [];
  private snowParticles: THREE.Points | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.obstacleManager = new ObstacleManager();
    this.camera = new THREE.PerspectiveCamera(
      CAMERA.FOV,
      window.innerWidth / window.innerHeight,
      CAMERA.NEAR,
      CAMERA.FAR
    );
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  }
  
  init(): void {
    // Renderer setup
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    
    // Create gradient sky
    this.createSky();
    
    // Atmospheric fog - denser for realism
    this.scene.fog = new THREE.FogExp2(0xc8d6e5, TERRAIN.FOG_DENSITY);
    
    // Initial camera position
    this.camera.position.set(0, 4, 8);
    this.camera.lookAt(0, 1, -15);
    
    this.setupLighting();
    this.createTerrain();
    this.createEnvironment();
    this.createAtmosphericEffects();
  }
  
  private createSky(): void {
    // Create a large sky dome with gradient
    const skyGeometry = new THREE.SphereGeometry(800, 32, 32);
    
    // Custom shader for sky gradient
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0077be) },    // Deep blue at top
        horizonColor: { value: new THREE.Color(0x87ceeb) }, // Light blue at horizon
        bottomColor: { value: new THREE.Color(0xffffff) },  // White/misty at bottom
        offset: { value: 20 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          float t = max(pow(max(h, 0.0), exponent), 0.0);
          vec3 color = mix(horizonColor, topColor, t);
          if (h < 0.0) {
            color = mix(horizonColor, bottomColor, min(-h * 2.0, 1.0));
          }
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide
    });
    
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(sky);
  }
  
  private setupLighting(): void {
    // Soft ambient light - winter atmosphere
    const ambientLight = new THREE.AmbientLight(0xcce0ff, 0.5);
    this.scene.add(ambientLight);
    
    // Main sun light - warm winter sun, low angle
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
    sunLight.position.set(100, 60, -50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 800;
    sunLight.shadow.camera.left = -150;
    sunLight.shadow.camera.right = 150;
    sunLight.shadow.camera.top = 150;
    sunLight.shadow.camera.bottom = -150;
    sunLight.shadow.bias = -0.0001;
    this.scene.add(sunLight);
    
    // Hemisphere light - blue sky, white snow reflection
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0xf0f0f0, 0.6);
    this.scene.add(hemiLight);
    
    // Subtle fill light from the opposite side
    const fillLight = new THREE.DirectionalLight(0xadd8e6, 0.3);
    fillLight.position.set(-50, 30, 50);
    this.scene.add(fillLight);
  }
  
  private createTerrain(): void {
    // Create a much wider terrain to cover mountain sides
    const terrainGeometry = new THREE.PlaneGeometry(500, 600, 200, 360);
    
    // Modify vertices using the shared terrain height calculation
    const positions = terrainGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      
      // Use the shared terrain height calculation from TerrainGenerator
      positions.setZ(i, terrainGenerator.getHeightFromLocal(x, y));
    }
    
    terrainGeometry.computeVertexNormals();
    
    // Realistic snow material with subtle blue tint in shadows
    const snowMaterial = new THREE.MeshStandardMaterial({
      color: 0xfafafa,
      roughness: 0.9,
      metalness: 0.0,
    });
    
    const terrain = new THREE.Mesh(terrainGeometry, snowMaterial);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    terrain.position.y = 0;
    terrain.position.z = -250;
    
    this.scene.add(terrain);
    
    // Add ski trail markings
    this.createSkiTrails();
  }
  
  private createSkiTrails(): void {
    // Subtle ski trail texture on the slope
    const trailGeometry = new THREE.PlaneGeometry(15, 500, 1, 1);
    const trailMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f0f5,
      roughness: 0.7,
      metalness: 0.0,
      transparent: true,
      opacity: 0.3
    });
    
    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.rotation.x = -Math.PI / 2;
    trail.position.set(0, 0.05, -200);
    this.scene.add(trail);
  }
  
  private createEnvironment(): void {
    this.createForest();
    this.createMountainRange();
    this.createClouds();
    this.createRocks();
  }
  
  private createForest(): void {
    // Dense forest on both sides - stay within visible terrain
    const treeCount = 60;
    
    for (let i = 0; i < treeCount; i++) {
      // Left forest - not too far out where terrain rises steeply
      const leftX = randomFloatInRange(-80, -45);
      const leftZ = randomFloatInRange(-350, -20);
      this.createPineTree(leftX, leftZ, randomFloatInRange(0.7, 1.1));
      
      // Right forest
      const rightX = randomFloatInRange(45, 80);
      const rightZ = randomFloatInRange(-350, -20);
      this.createPineTree(rightX, rightZ, randomFloatInRange(0.7, 1.1));
    }
    
    // Trees closer to the slope
    for (let i = 0; i < 20; i++) {
      const side = randomBool() ? 1 : -1;
      const x = side * randomFloatInRange(35, 50);
      const z = randomFloatInRange(-350, -30);
      this.createPineTree(x, z, randomFloatInRange(0.5, 0.8));
    }
  }
  
  /**
   * Create a detailed stylized pine tree with natural branch structure
   * Uses multiple tiers of branches with snow coverage
   */
  private createPineTree(x: number, z: number, scale: number): void {
    const treeGroup = new THREE.Group();
    // Use shared function to get terrain height at this position
    const terrainY = getTerrainHeight(z, x);
    
    // Register tree as obstacle (trunk radius)
    this.obstacleManager.addObstacle(x, z, 1.5 * scale, 'tree');
    
    // Shared materials for performance
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3d2314,
      roughness: 0.95,
      flatShading: true
    });
    
    // Vary foliage color slightly per tree for natural look
    const colorVariation = terrainGenerator.fbm(x * 0.5, z * 0.5, 1, 0.5, 2.0);
    const baseGreen = 0x1a4d1a;
    const greenVariation = Math.floor((colorVariation + 1) * 0x080808);
    const foliageMaterial = new THREE.MeshStandardMaterial({ 
      color: baseGreen + greenVariation,
      roughness: 0.85,
      flatShading: true // Stylized low-poly look
    });
    
    const snowMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xfafafa,
      roughness: 0.9,
      flatShading: true
    });
    
    // Trunk - tapered cylinder with slight curve
    const trunkHeight = 4 * scale;
    const trunkGeometry = new THREE.CylinderGeometry(
      0.2 * scale, // top radius
      0.45 * scale, // bottom radius
      trunkHeight,
      6
    );
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    treeGroup.add(trunk);
    
    // Create multiple tiers of branches
    const tiers = 5 + Math.floor(terrainGenerator.fbm(x, z, 1, 0.5, 2.0) * 2); // 5-7 tiers
    const baseHeight = 2.5 * scale;
    const tierSpacing = 1.6 * scale;
    
    for (let tier = 0; tier < tiers; tier++) {
      const tierProgress = tier / tiers;
      const tierY = baseHeight + tier * tierSpacing;
      
      // Each tier gets smaller as we go up
      const tierScale = 1 - tierProgress * 0.7;
      const branchRadius = 2.8 * scale * tierScale;
      const branchHeight = 2.2 * scale * tierScale;
      
      // Main foliage cone for this tier
      const foliageGeometry = new THREE.ConeGeometry(
        branchRadius,
        branchHeight,
        7 + Math.floor(Math.random() * 2) // 7-8 segments for variation
      );
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.y = tierY + branchHeight / 2;
      // Slight random rotation per tier for organic look
      foliage.rotation.y = tier * 0.4 + Math.random() * 0.3;
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      treeGroup.add(foliage);
      
      // Very thin snow dusting on top of each tier
      const snowRadius = branchRadius * 0.65;
      const snowHeight = 0.08 * scale * tierScale;  // Paper thin
      const snowGeometry = new THREE.ConeGeometry(snowRadius, snowHeight, 7);
      const snow = new THREE.Mesh(snowGeometry, snowMaterial);
      snow.position.y = tierY + branchHeight * 0.9;  // Just on top edge
      snow.rotation.y = foliage.rotation.y;
      treeGroup.add(snow);
    }
    
    // Tree top point
    const topY = baseHeight + tiers * tierSpacing;
    const topGeometry = new THREE.ConeGeometry(0.4 * scale, 1.2 * scale, 5);
    const top = new THREE.Mesh(topGeometry, foliageMaterial);
    top.position.y = topY + 0.6 * scale;
    top.castShadow = true;
    treeGroup.add(top);
    
    // Tiny snow tip on very top
    const topSnowGeometry = new THREE.ConeGeometry(0.12 * scale, 0.1 * scale, 5);
    const topSnow = new THREE.Mesh(topSnowGeometry, snowMaterial);
    topSnow.position.y = topY + 1.15 * scale;
    treeGroup.add(topSnow);
    
    treeGroup.position.set(x, terrainY, z);
    // Use noise-based rotation for consistent but varied orientation
    treeGroup.rotation.y = terrainGenerator.fbm(x * 0.3, z * 0.3, 1, 0.5, 2.0) * Math.PI * 2;
    
    this.scene.add(treeGroup);
  }
  
  private createMountainRange(): void {
    // Background mountain range - further back to not interfere with ski slope
    // Finish line is around z=-450, so keep mountains well behind that
    this.createMountainLayer(-850, 0.4, 0x5a6a7a);  // Far mountains
    this.createMountainLayer(-750, 0.6, 0x6a7a8a);  // Mid mountains
    this.createMountainLayer(-650, 0.8, 0x7a8a9a);  // Near mountains
    
    // Side mountains along the slope (closer but off to the sides)
    this.createSideMountains();
  }
  
  private createSideMountains(): void {
    // Mountains flanking the ski slope - positioned well off the ski path
    const sideMountainPositions = [
      // Left side of slope
      { x: -200, z: -150, scale: 1.8, color: 0x7a8a9a },
      { x: -220, z: -300, scale: 2.0, color: 0x7a8a9a },
      { x: -180, z: -450, scale: 1.6, color: 0x7a8a9a },
      // Right side of slope
      { x: 200, z: -100, scale: 1.7, color: 0x7a8a9a },
      { x: 220, z: -250, scale: 1.9, color: 0x7a8a9a },
      { x: 190, z: -400, scale: 1.5, color: 0x7a8a9a },
    ];
    
    sideMountainPositions.forEach(pos => {
      this.createMountain(pos.x, pos.z, pos.scale, pos.color);
    });
  }
  
  private createMountainLayer(zBase: number, _opacity: number, color: number): void {
    // Mountains including center - all positioned well behind finish line
    const mountainPositions = [
      { x: -320, z: zBase - 50, scale: 2.5 },
      { x: -180, z: zBase + 20, scale: 2.0 },
      { x: 0, z: zBase - 80, scale: 2.8 },      // Center mountain - pushed further back
      { x: 180, z: zBase + 30, scale: 2.2 },
      { x: 320, z: zBase - 40, scale: 2.4 },
    ];
    
    mountainPositions.forEach(pos => {
      this.createMountain(pos.x, pos.z, pos.scale, color);
    });
  }
  
  private createMountain(x: number, z: number, scale: number, color: number): void {
    // Simple, solid mountain shapes - wider, gentler slopes
    const mountainGroup = new THREE.Group();
    
    const peakMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.85,
      flatShading: true
    });
    
    const snowMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f5ff,
      roughness: 0.8,
      flatShading: true
    });
    
    // Main peak - wider base, shorter height for gentler slope
    const peakGeometry = new THREE.ConeGeometry(70 * scale, 80 * scale, 6, 1);
    const peak = new THREE.Mesh(peakGeometry, peakMaterial);
    peak.position.y = 40 * scale;
    mountainGroup.add(peak);
    
    // Snow cap - covers top third, centered exactly on peak
    const snowCapGeometry = new THREE.ConeGeometry(28 * scale, 20 * scale, 6, 1);
    const snowCap = new THREE.Mesh(snowCapGeometry, snowMaterial);
    snowCap.position.set(0, 70 * scale, 0);  // Centered at x=0, z=0
    mountainGroup.add(snowCap);
    
    // Add 1-2 secondary peaks - also wider
    const secondaryCount = 1 + Math.floor((terrainGenerator.fbm(x * 0.01, z * 0.01, 1, 0.5, 2.0) + 1));
    for (let i = 0; i < secondaryCount; i++) {
      const angle = (i + 0.5) * Math.PI + terrainGenerator.fbm(x + i, z, 1, 0.5, 2.0) * 0.5;
      const distance = 40 * scale;
      const height = 0.5 + terrainGenerator.fbm(x * 0.05, z * 0.05, 1, 0.5, 2.0) * 0.2;
      
      // Wider secondary peaks
      const secGeometry = new THREE.ConeGeometry(40 * scale * height, 50 * scale * height, 5, 1);
      const secPeak = new THREE.Mesh(secGeometry, peakMaterial);
      secPeak.position.set(
        Math.cos(angle) * distance,
        25 * scale * height,
        Math.sin(angle) * distance
      );
      mountainGroup.add(secPeak);
      
      // Snow on secondary peak - centered on the peak
      const secSnowGeometry = new THREE.ConeGeometry(16 * scale * height, 12 * scale * height, 5, 1);
      const secSnow = new THREE.Mesh(secSnowGeometry, snowMaterial);
      const secPeakX = Math.cos(angle) * distance;
      const secPeakZ = Math.sin(angle) * distance;
      const secPeakTop = 25 * scale * height + 25 * scale * height;  // base Y + half height
      secSnow.position.set(secPeakX, secPeakTop - 4 * scale * height, secPeakZ);
      mountainGroup.add(secSnow);
    }
    
    // Position mountain on the terrain surface
    const terrainY = getTerrainHeight(z, x);
    mountainGroup.position.set(x, terrainY - 20, z);
    this.scene.add(mountainGroup);
  }
  
  private createClouds(): void {
    // Smaller, higher clouds for realistic sky
    for (let i = 0; i < 12; i++) {
      const cloud = this.createCloud();
      cloud.position.set(
        -400 + Math.random() * 800,
        150 + Math.random() * 80,  // Much higher
        -600 + Math.random() * 200  // Further back
      );
      cloud.scale.setScalar(0.4 + Math.random() * 0.6);  // Much smaller
      this.clouds.push(cloud);
      this.scene.add(cloud);
    }
  }
  
  private createCloud(): THREE.Group {
    const cloud = new THREE.Group();
    
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1,
      transparent: true,
      opacity: 0.85
    });
    
    // Create smaller, flatter cloud from spheres
    const sphereCount = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < sphereCount; i++) {
      const size = 8 + Math.random() * 6;  // Smaller spheres
      const sphereGeometry = new THREE.SphereGeometry(size, 6, 6);
      const sphere = new THREE.Mesh(sphereGeometry, cloudMaterial);
      sphere.position.set(
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 4,  // Flatter
        (Math.random() - 0.5) * 12
      );
      cloud.add(sphere);
    }
    
    return cloud;
  }
  
  private createRocks(): void {
    // Simple scattered boulders along slope edges
    for (let i = 0; i < 50; i++) {
      const side = randomBool() ? 1 : -1;
      const x = side * randomFloatInRange(32, 55);
      const z = randomFloatInRange(-350, -30);
      this.createBoulder(x, z, randomFloatInRange(0.8, 2.0));
    }
  }
  
  /**
   * Create a large standalone boulder with snow
   */
  private createBoulder(x: number, z: number, scale: number): void {
    const terrainY = getTerrainHeight(z, x);
    
    this.obstacleManager.addObstacle(x, z, scale * 1.3, 'rock');
    
    const boulder = this.createSingleRock(scale);
    boulder.position.set(x, terrainY + scale * 0.3, z);
    
    this.scene.add(boulder);
  }
  
  /**
   * Create a single solid rock mesh - simple low-poly style
   */
  private createSingleRock(scale: number): THREE.Mesh {
    // Use octahedron for clean, solid rock shape
    const geometry = new THREE.OctahedronGeometry(scale, 0);
    
    // Just flatten it slightly - no crazy deformation
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      positions.setY(i, y * 0.6); // Flatten vertically
    }
    geometry.computeVertexNormals();
    
    // Consistent gray rock color
    const colorBase = 0x606060;
    const colorVariation = Math.floor(Math.random() * 0x101010);
    
    const material = new THREE.MeshStandardMaterial({
      color: colorBase + colorVariation,
      roughness: 0.9,
      flatShading: true
    });
    
    const rock = new THREE.Mesh(geometry, material);
    
    // Slight random rotation
    rock.rotation.set(
      Math.random() * 0.2,
      Math.random() * Math.PI * 2,
      Math.random() * 0.2
    );
    
    rock.castShadow = true;
    rock.receiveShadow = true;
    
    return rock;
  }
  
  private createAtmosphericEffects(): void {
    // Light snow particles falling
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400 - 100;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.3,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });
    
    this.snowParticles = new THREE.Points(geometry, material);
    this.scene.add(this.snowParticles);
  }
  
  updateCamera(playerPosition: THREE.Vector3): void {
    // Smooth camera follow
    const targetPosition = playerPosition.clone().add(this.cameraOffset);
    this.camera.position.lerp(targetPosition, 0.05);
    
    const lookAtTarget = playerPosition.clone().add(this.cameraLookOffset);
    this.camera.lookAt(lookAtTarget);
    
    // Animate snow particles
    if (this.snowParticles) {
      const positions = this.snowParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 0.1; // Fall down
        positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.02; // Drift
        
        // Reset particles that fall below
        if (positions[i + 1] < -10) {
          positions[i + 1] = 100;
          positions[i] = (Math.random() - 0.5) * 200 + playerPosition.x;
          positions[i + 2] = (Math.random() - 0.5) * 100 + playerPosition.z;
        }
      }
      this.snowParticles.geometry.attributes.position.needsUpdate = true;
    }
    
    // Slowly move clouds
    this.clouds.forEach((cloud, i) => {
      cloud.position.x += 0.02 + i * 0.005;
      if (cloud.position.x > 400) {
        cloud.position.x = -400;
      }
    });
  }
  
  onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
