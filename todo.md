# SkiMath - Code Quality Improvements

This document outlines potential improvements to the codebase across four dimensions: readability, maintainability, extensibility, and performance.

---

## 📖 Readability

### Issues

1. **Magic Numbers** - ~~Many hardcoded values scattered throughout~~ ✅ Extracted to `GameConfig.ts`:
   - ~~`Player.ts`: `0.3`, `0.008`, `0.6`, `60`, `120` (timers)~~ → `PLAYER.*`, `CRASH.*`
   - ~~`GateManager.ts`: `8`, `40`, `-30` (gate dimensions)~~ → `GATES.*`
   - ~~`AudioManager.ts`: `523.25`, `659.25` (frequencies)~~ → `AUDIO.NOTES.*`

2. **Long Methods** - ~~Several methods exceed 50+ lines~~ ✅ Already broken down:
   - ~~`Player.createSkier()` is ~400 lines~~ → Split into `SkierModel.ts` with 7 focused methods
   - ~~`GateManager.createGate()` is very long~~ → Split into 6 focused methods
   - ~~`SceneManager.createTerrain()` similar~~ → Split into 15 focused methods

3. **Inconsistent Naming** - ✅ Actually consistent (TypeScript convention):
   - `_position` vs `position` (getter) → Standard pattern for private backing fields
   - `_isCrashed` vs `isCrashed` (getter) → Standard pattern for private backing fields
   - `check*` vs `is*` → Semantic distinction: `check*` performs action and returns result, `is*` reports state

### Recommendations

- [x] Extract magic numbers to named constants ✅ (Created `src/config/GameConfig.ts`)
- [x] Break large methods into smaller, focused functions ✅ (SkierModel, GateManager, SceneManager all modular)
- [x] Use consistent naming conventions throughout ✅ (Already following TypeScript conventions)

---

## 🔧 Maintainability

### Issues

1. **Tight Coupling** - `Game.ts` knows too much about internal details:
   - Directly accesses `gateManager.checkFlagCollision().gate.position.z`
   - Manages audio, UI, player states all in one place

2. **No Event System** - ~~Direct method calls everywhere~~ ✅ Added EventEmitter:
   - ~~`this.audioManager.playCorrect()` hardcoded in multiple places~~ Events now emitted
   - ~~`this.uiManager.updateScore()` scattered throughout~~ Can subscribe to events

3. **Configuration Spread** - Settings are scattered:
   - Gate settings in `GateManager`
   - Player speed in `Player`
   - Collision distances in multiple files

4. **Duplicate Logic**:
   - ~~Terrain height calculation: `Math.max(0.5, z * -0.075)` appears in multiple files~~ ✅ `getTerrainHeight`
   - ~~Score penalty logic duplicated~~ ✅ `applyScorePenalty` utility

### Recommendations

- [x] Create a `GameConfig.ts` for centralized configuration ✅
- [x] Implement an event emitter for decoupled communication ✅ (`src/utils/EventEmitter.ts`)
- [x] Create shared utility functions for common calculations ✅ (`src/utils/MathUtils.ts`)
- [x] Extract terrain height calculation to utility function ✅ (`getTerrainHeight` in GameConfig.ts)

---

## 🔌 Extensibility

### Issues

1. **Hardcoded Operations** - Only multiplication supported:
   - `QuestionManager` is specifically for multiplication
   - No interface for other operations

2. **Fixed Course** - No easy way to add:
   - Different course types
   - Varying gate counts
   - Custom obstacles

3. **Monolithic Classes**:
   - ~~`Player.ts` handles model creation AND movement AND crash states~~ ✅ Split into `SkierModel.ts` + `SkierController.ts`
   - `SceneManager.ts` handles scene AND terrain AND environment AND effects

4. **No Plugin Architecture** - Adding features requires modifying core classes

### Recommendations

- [x] Create `IQuestionGenerator` interface for different math operations ✅ (`src/questions/IQuestionGenerator.ts` + implementations)
- [x] Create `ICourseGenerator` for different course layouts ✅ (`src/course/ICourseGenerator.ts` + implementations)
- [x] Separate concerns: `SkierModel`, `SkierMovement`, `SkierState` ✅ (Split into `SkierModel.ts` + `SkierController.ts`)
- [x] Use composition over inheritance ✅ (QuestionManager uses IQuestionGenerator)

---

## ⚡ Performance

### Issues

1. **Object Creation in Game Loop**:
   ```typescript
   // In animate()
   const flagCollision = this.gateManager.checkFlagCollision(this.player.position);
   ```
   Creates objects every frame

2. **No Object Pooling** - New THREE objects created for effects

3. **Inefficient Collision Checks**:
   - `ObstacleManager.checkCollision()` iterates all obstacles every frame
   - No spatial partitioning (quadtree/octree)

4. **Unoptimized Materials** - Many duplicate materials in `Player.createSkier()`:
   ```typescript
   const suitMaterial = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
   // Created fresh each time
   ```

5. **Audio Buffer Recreation** - Noise buffers recreated each call in some methods

### Recommendations

- [x] Reuse collision result objects (avoid allocations in game loop) ✅ (`COLLISION_RESULT` in ObstacleManager, `FLAG_COLLISION_RESULT` in GateManager, `positionRef` in SkierController)
- [x] Implement spatial partitioning for obstacles ✅ (`SpatialGrid.ts` - grid-based spatial hash with 50×50 cells)
- [x] Share materials between similar meshes ✅
- [x] Pre-create audio buffers during initialization ✅ (7 pre-allocated buffers in AudioManager)
- [x] Use shared `MathUtils` functions throughout ✅ (SceneManager, GateManager, ObstacleManager, SkierController)

---

## 🎯 Suggested Priority

### High Priority (Quick Wins)

| Task | Impact | Effort | Status |
|------|--------|--------|--------|
| Create `GameConfig.ts` - centralize magic numbers | High | Low | ✅ Done |
| Extract terrain height to utility function | Medium | Low | ✅ Done |
| Share materials in Player model | Medium | Low | ✅ Done |

### Medium Priority

| Task | Impact | Effort | Status |
|------|--------|--------|--------|
| Split `Player.ts` into `SkierModel.ts` + `SkierController.ts` | High | Medium | ✅ Done |
| Add event emitter for game events | High | Medium | ✅ Done |
| Implement spatial partitioning for collisions | Medium | Medium | ✅ Done |

### Lower Priority (Future-proofing)

| Task | Impact | Effort | Status |
|------|--------|--------|--------|
| Create question generator interface | Medium | Medium | ✅ Done |
| Create course generator interface | Medium | Medium | ✅ Done |
| Object pooling for particles/effects | Low | Medium | N/A - No particle system exists; no applicable use case |

---

## Files to Create

- ~~`src/config/GameConfig.ts` - Centralized configuration~~ ✅ Created
- ~~`src/utils/terrain.ts` - Terrain utility functions~~ ✅ (Added `getTerrainHeight` to GameConfig.ts)
- ~~`src/utils/EventEmitter.ts` - Simple pub/sub event system~~ ✅ Created
- ~~`src/game/SkierModel.ts` - Skier 3D model (extracted from Player)~~ ✅ Created
- ~~`src/game/SkierController.ts` - Skier movement logic~~ ✅ Created
- ~~`src/questions/IQuestionGenerator.ts` - Interface for question generators~~ ✅ Created
- ~~`src/questions/QuestionGenerators.ts` - Concrete implementations (Mult/Div/Add/Sub/Mixed)~~ ✅ Created
- ~~`src/course/ICourseGenerator.ts` - Interface for course generators~~ ✅ Created
- ~~`src/course/CourseGenerators.ts` - Concrete implementations (Slalom/GiantSlalom/Custom)~~ ✅ Created

---

## Notes

- Current bundle size: ~561KB (144KB gzipped) - acceptable for a Three.js game
- Game runs smoothly; performance improvements are optimizations, not fixes
- Extensibility improvements would allow adding division, addition, subtraction modes

---

## ✅ Status: Complete

**All tasks completed as of 10 December 2025.**

This code quality improvement initiative has successfully addressed:
- 📖 Readability: Magic numbers extracted, methods decomposed, naming conventions verified
- 🔧 Maintainability: Centralized config, event emitter, shared utilities
- 🔌 Extensibility: Question/course generator interfaces with multiple implementations
- ⚡ Performance: Spatial partitioning, pre-allocated buffers, reusable collision objects
