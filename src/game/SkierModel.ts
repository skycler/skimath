import * as THREE from 'three';

/**
 * Shared materials for the skier model
 * Created once and reused for better performance
 */
const SKIER_MATERIALS = {
  skin: new THREE.MeshStandardMaterial({ 
    color: 0xffdbac,
    roughness: 0.7 
  }),
  suit: new THREE.MeshStandardMaterial({ 
    color: 0xe74c3c, // Racing red
    roughness: 0.4,
    metalness: 0.1
  }),
  suitAccent: new THREE.MeshStandardMaterial({ 
    color: 0x2c3e50, // Dark navy accents
    roughness: 0.3
  }),
  helmet: new THREE.MeshStandardMaterial({ 
    color: 0xe74c3c,
    roughness: 0.2,
    metalness: 0.3
  }),
  goggle: new THREE.MeshStandardMaterial({ 
    color: 0x1a1a1a,
    roughness: 0.1,
    metalness: 0.8
  }),
  goggleLens: new THREE.MeshStandardMaterial({ 
    color: 0xff6b35,
    roughness: 0.0,
    metalness: 0.9,
    opacity: 0.7,
    transparent: true
  }),
  ski: new THREE.MeshStandardMaterial({ 
    color: 0x0984e3,
    roughness: 0.3,
    metalness: 0.2
  }),
  boot: new THREE.MeshStandardMaterial({ 
    color: 0x2d3436,
    roughness: 0.4
  }),
  pole: new THREE.MeshStandardMaterial({ 
    color: 0xbdc3c7,
    roughness: 0.2,
    metalness: 0.8
  }),
  glove: new THREE.MeshStandardMaterial({ 
    color: 0x2c3e50,
    roughness: 0.5
  }),
  bib: new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    roughness: 0.8
  }),
} as const;

/**
 * SkierModel - Handles the 3D model creation for the skier character
 * Separated from movement logic for better maintainability
 */
export class SkierModel {
  private mesh: THREE.Group;

  constructor() {
    this.mesh = new THREE.Group();
  }

  /**
   * Create the complete skier 3D model
   */
  create(): THREE.Group {
    this.createTorso();
    this.createHead();
    this.createArms();
    this.createLegs();
    this.createBoots();
    this.createSkis();
    this.createPoles();
    
    return this.mesh;
  }

  /**
   * Get the mesh group
   */
  getMesh(): THREE.Group {
    return this.mesh;
  }

  private createTorso(): void {
    const M = SKIER_MATERIALS;

    // Main torso - slightly hunched skiing position
    const torsoGeometry = new THREE.CapsuleGeometry(0.25, 0.5, 8, 16);
    const torso = new THREE.Mesh(torsoGeometry, M.suit);
    torso.position.set(0, 1.1, 0);
    torso.rotation.x = 0.3; // Leaning forward
    torso.castShadow = true;
    this.mesh.add(torso);

    // Racing number bib
    const bibGeometry = new THREE.PlaneGeometry(0.35, 0.25);
    const bib = new THREE.Mesh(bibGeometry, M.bib);
    bib.position.set(0, 1.15, 0.26);
    bib.rotation.x = 0.3;
    this.mesh.add(bib);
  }

  private createHead(): void {
    const M = SKIER_MATERIALS;

    // Neck
    const neckGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.15, 12);
    const neck = new THREE.Mesh(neckGeometry, M.skin);
    neck.position.set(0, 1.5, 0.05);
    neck.castShadow = true;
    this.mesh.add(neck);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const head = new THREE.Mesh(headGeometry, M.skin);
    head.position.set(0, 1.7, 0.05);
    head.scale.set(1, 1.1, 1);
    head.castShadow = true;
    this.mesh.add(head);

    // Helmet - full coverage racing helmet
    const helmetGeometry = new THREE.SphereGeometry(0.23, 16, 16);
    const helmet = new THREE.Mesh(helmetGeometry, M.helmet);
    helmet.position.set(0, 1.73, 0.03);
    helmet.scale.set(1.1, 1.05, 1.15);
    helmet.castShadow = true;
    this.mesh.add(helmet);

    // Helmet visor edge
    const visorEdgeGeometry = new THREE.TorusGeometry(0.18, 0.02, 8, 24, Math.PI);
    const visorEdge = new THREE.Mesh(visorEdgeGeometry, M.goggle);
    visorEdge.position.set(0, 1.72, 0.18);
    visorEdge.rotation.x = Math.PI / 2;
    visorEdge.rotation.z = Math.PI;
    this.mesh.add(visorEdge);

    // Goggles frame
    const gogglesFrameGeometry = new THREE.TorusGeometry(0.12, 0.02, 8, 24);
    const gogglesFrame = new THREE.Mesh(gogglesFrameGeometry, M.goggle);
    gogglesFrame.position.set(0, 1.7, 0.2);
    gogglesFrame.scale.set(1.8, 1, 1);
    this.mesh.add(gogglesFrame);

    // Goggles lens
    const gogglesLensGeometry = new THREE.PlaneGeometry(0.35, 0.12);
    const gogglesLens = new THREE.Mesh(gogglesLensGeometry, M.goggleLens);
    gogglesLens.position.set(0, 1.7, 0.2);
    this.mesh.add(gogglesLens);

    // Chin guard
    const chinGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const chin = new THREE.Mesh(chinGeometry, M.skin);
    chin.position.set(0, 1.55, 0.18);
    chin.scale.set(1, 0.8, 0.8);
    this.mesh.add(chin);
  }

  private createArms(): void {
    const M = SKIER_MATERIALS;

    // Upper arms - bent for pole holding
    const upperArmGeometry = new THREE.CapsuleGeometry(0.08, 0.25, 4, 8);
    
    const leftUpperArm = new THREE.Mesh(upperArmGeometry, M.suit);
    leftUpperArm.position.set(-0.35, 1.2, 0.05);
    leftUpperArm.rotation.z = 0.5;
    leftUpperArm.rotation.x = 0.4;
    leftUpperArm.castShadow = true;
    this.mesh.add(leftUpperArm);

    const rightUpperArm = new THREE.Mesh(upperArmGeometry, M.suit);
    rightUpperArm.position.set(0.35, 1.2, 0.05);
    rightUpperArm.rotation.z = -0.5;
    rightUpperArm.rotation.x = 0.4;
    rightUpperArm.castShadow = true;
    this.mesh.add(rightUpperArm);

    // Forearms
    const forearmGeometry = new THREE.CapsuleGeometry(0.06, 0.22, 4, 8);
    
    const leftForearm = new THREE.Mesh(forearmGeometry, M.suit);
    leftForearm.position.set(-0.5, 1.0, 0.2);
    leftForearm.rotation.z = 0.3;
    leftForearm.rotation.x = -0.6;
    leftForearm.castShadow = true;
    this.mesh.add(leftForearm);

    const rightForearm = new THREE.Mesh(forearmGeometry, M.suit);
    rightForearm.position.set(0.5, 1.0, 0.2);
    rightForearm.rotation.z = -0.3;
    rightForearm.rotation.x = -0.6;
    rightForearm.castShadow = true;
    this.mesh.add(rightForearm);

    // Gloves
    const gloveGeometry = new THREE.SphereGeometry(0.07, 8, 8);
    
    const leftGlove = new THREE.Mesh(gloveGeometry, M.glove);
    leftGlove.position.set(-0.55, 0.85, 0.35);
    leftGlove.scale.set(1, 1.2, 1.4);
    leftGlove.castShadow = true;
    this.mesh.add(leftGlove);

    const rightGlove = new THREE.Mesh(gloveGeometry, M.glove);
    rightGlove.position.set(0.55, 0.85, 0.35);
    rightGlove.scale.set(1, 1.2, 1.4);
    rightGlove.castShadow = true;
    this.mesh.add(rightGlove);
  }

  private createLegs(): void {
    const M = SKIER_MATERIALS;

    // Thighs - bent in skiing crouch
    const thighGeometry = new THREE.CapsuleGeometry(0.12, 0.3, 4, 8);
    
    const leftThigh = new THREE.Mesh(thighGeometry, M.suitAccent);
    leftThigh.position.set(-0.15, 0.7, 0.1);
    leftThigh.rotation.x = -0.8;
    leftThigh.rotation.z = 0.1;
    leftThigh.castShadow = true;
    this.mesh.add(leftThigh);

    const rightThigh = new THREE.Mesh(thighGeometry, M.suitAccent);
    rightThigh.position.set(0.15, 0.7, 0.1);
    rightThigh.rotation.x = -0.8;
    rightThigh.rotation.z = -0.1;
    rightThigh.castShadow = true;
    this.mesh.add(rightThigh);

    // Shins
    const shinGeometry = new THREE.CapsuleGeometry(0.09, 0.28, 4, 8);
    
    const leftShin = new THREE.Mesh(shinGeometry, M.suitAccent);
    leftShin.position.set(-0.18, 0.35, 0.25);
    leftShin.rotation.x = 0.4;
    leftShin.castShadow = true;
    this.mesh.add(leftShin);

    const rightShin = new THREE.Mesh(shinGeometry, M.suitAccent);
    rightShin.position.set(0.18, 0.35, 0.25);
    rightShin.rotation.x = 0.4;
    rightShin.castShadow = true;
    this.mesh.add(rightShin);
  }

  private createBoots(): void {
    const M = SKIER_MATERIALS;

    const bootGeometry = new THREE.BoxGeometry(0.14, 0.15, 0.3);
    
    const leftBoot = new THREE.Mesh(bootGeometry, M.boot);
    leftBoot.position.set(-0.2, 0.1, 0.1);
    leftBoot.castShadow = true;
    this.mesh.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeometry, M.boot);
    rightBoot.position.set(0.2, 0.1, 0.1);
    rightBoot.castShadow = true;
    this.mesh.add(rightBoot);

    // Boot buckles
    const buckleGeometry = new THREE.BoxGeometry(0.16, 0.02, 0.04);
    const buckleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x95a5a6,
      metalness: 0.7
    });
    
    [-0.2, 0.2].forEach(x => {
      [0.05, 0.12].forEach(y => {
        const buckle = new THREE.Mesh(buckleGeometry, buckleMaterial);
        buckle.position.set(x, y, 0.2);
        this.mesh.add(buckle);
      });
    });
  }

  private createSkis(): void {
    const M = SKIER_MATERIALS;

    // Modern shaped skis with better geometry
    const skiShape = new THREE.Shape();
    skiShape.moveTo(-0.06, -1);
    skiShape.quadraticCurveTo(-0.08, -0.5, -0.07, 0);
    skiShape.quadraticCurveTo(-0.08, 0.5, -0.05, 0.9);
    skiShape.quadraticCurveTo(0, 1.0, 0.05, 0.9);
    skiShape.quadraticCurveTo(0.08, 0.5, 0.07, 0);
    skiShape.quadraticCurveTo(0.08, -0.5, 0.06, -1);
    skiShape.quadraticCurveTo(0, -1.05, -0.06, -1);

    const skiExtrudeSettings = {
      steps: 1,
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2
    };

    const skiGeometry = new THREE.ExtrudeGeometry(skiShape, skiExtrudeSettings);
    skiGeometry.rotateX(Math.PI / 2);
    
    const leftSki = new THREE.Mesh(skiGeometry, M.ski);
    leftSki.position.set(-0.2, 0.02, 0);
    leftSki.castShadow = true;
    this.mesh.add(leftSki);

    const rightSki = new THREE.Mesh(skiGeometry, M.ski);
    rightSki.position.set(0.2, 0.02, 0);
    rightSki.castShadow = true;
    this.mesh.add(rightSki);

    // Ski bindings
    const bindingGeometry = new THREE.BoxGeometry(0.1, 0.04, 0.12);
    const bindingMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2d3436,
      roughness: 0.3
    });
    
    const leftBinding = new THREE.Mesh(bindingGeometry, bindingMaterial);
    leftBinding.position.set(-0.2, 0.05, 0.1);
    this.mesh.add(leftBinding);

    const rightBinding = new THREE.Mesh(bindingGeometry, bindingMaterial);
    rightBinding.position.set(0.2, 0.05, 0.1);
    this.mesh.add(rightBinding);
  }

  private createPoles(): void {
    const M = SKIER_MATERIALS;

    // Pole shafts - carbon fiber style
    const poleShaftGeometry = new THREE.CylinderGeometry(0.012, 0.015, 1.1, 8);
    
    const leftPoleShaft = new THREE.Mesh(poleShaftGeometry, M.pole);
    leftPoleShaft.position.set(-0.6, 0.4, 0.5);
    leftPoleShaft.rotation.x = 0.6;
    leftPoleShaft.rotation.z = -0.15;
    leftPoleShaft.castShadow = true;
    this.mesh.add(leftPoleShaft);

    const rightPoleShaft = new THREE.Mesh(poleShaftGeometry, M.pole);
    rightPoleShaft.position.set(0.6, 0.4, 0.5);
    rightPoleShaft.rotation.x = 0.6;
    rightPoleShaft.rotation.z = 0.15;
    rightPoleShaft.castShadow = true;
    this.mesh.add(rightPoleShaft);

    // Pole grips
    const gripGeometry = new THREE.CylinderGeometry(0.025, 0.02, 0.12, 8);
    const gripMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3436 });
    
    const leftGrip = new THREE.Mesh(gripGeometry, gripMaterial);
    leftGrip.position.set(-0.55, 0.88, 0.32);
    leftGrip.rotation.x = 0.6;
    this.mesh.add(leftGrip);

    const rightGrip = new THREE.Mesh(gripGeometry, gripMaterial);
    rightGrip.position.set(0.55, 0.88, 0.32);
    rightGrip.rotation.x = 0.6;
    this.mesh.add(rightGrip);

    // Pole baskets
    const basketGeometry = new THREE.TorusGeometry(0.04, 0.008, 8, 16);
    const basketMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    
    const leftBasket = new THREE.Mesh(basketGeometry, basketMaterial);
    leftBasket.position.set(-0.68, -0.15, 0.85);
    leftBasket.rotation.x = -Math.PI / 2 + 0.6;
    this.mesh.add(leftBasket);

    const rightBasket = new THREE.Mesh(basketGeometry, basketMaterial);
    rightBasket.position.set(0.68, -0.15, 0.85);
    rightBasket.rotation.x = -Math.PI / 2 + 0.6;
    this.mesh.add(rightBasket);

    // Pole tips
    const tipGeometry = new THREE.ConeGeometry(0.015, 0.06, 8);
    const tipMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2d3436,
      metalness: 0.8
    });
    
    const leftTip = new THREE.Mesh(tipGeometry, tipMaterial);
    leftTip.position.set(-0.7, -0.2, 0.9);
    leftTip.rotation.x = Math.PI + 0.6;
    this.mesh.add(leftTip);

    const rightTip = new THREE.Mesh(tipGeometry, tipMaterial);
    rightTip.position.set(0.7, -0.2, 0.9);
    rightTip.rotation.x = Math.PI + 0.6;
    this.mesh.add(rightTip);
  }
}
