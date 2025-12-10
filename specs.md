# SkiMath - Gamification for Multiplication Practice

This specification outlines a gamification approach to help users practice multiplication in an engaging way. The game involves answering multiplication questions while skiing down a 3D giant slalom course - each correct answer allows the player to pass through a gate, while incorrect answers result in time penalties.

## Game Mechanics

### Starting the Game
- Player begins at a **starting gate house** (wooden hut with red roof and snow)
- Yellow starting gate bar with "START" sign
- Select difficulty level before starting: Easy, Medium, Hard, or Expert
- **Countdown beeps** play with 1-second intervals (3 beeps + GO)
- **Skier waits at start** until player presses forward key (↑ or W) to begin racing
- Timer starts when player initiates movement

### Course Layout
- **10 slalom gates** alternating left and right down the slope
- Gates are **red and blue alternating** colors (Gate 1 = red, Gate 2 = blue, etc.)
- **Uneven gate spacing**: 75%-125% variation (30-50 units) for natural feel
- Each gate has **two poles with a banner** between them (professional slalom style)
  - Poles are 0.5m apart with a 0.45m × 0.7m banner
  - Banners display gate number
- Gates are placed in clear areas, avoiding trees and rocks
- **Finish area** with arch, checkered banner, fencing, and sponsor flags

### Answering Questions
- Player selects from **4 multiple-choice answers**
- Wrong answers include plausible distractors (off-by-one, addition instead of multiplication, etc.)

### Scoring System
- **Correct Answer**: Pass through gate, earn points:
  - Easy: 100 points
  - Medium: 150 points
  - Hard: 200 points
  - Expert: 300 points
- **Incorrect Answer**: 
  - Lose 50 points
  - 3-second time penalty
  - Gate turns green on success

### Difficulty Levels
- **Easy**: Numbers 1-5
- **Medium**: Numbers 1-10
- **Hard**: Numbers 1-12
- **Expert**: Numbers 10-20

### Controls

#### Keyboard
- **Any key**: Start race (first press)
- **↑ / W**: Speed up
- **← / A**: Rotate skier left (carve left turn)
- **→ / D**: Rotate skier right (carve right turn)
- **↓ / S**: Brake/slow down (snow plow)
- Movement is mutually exclusive (left cancels right) to prevent stuck keys

#### Touch Controls (Mobile/iPhone)
- **◀ Left button**: Rotate skier left (vertically centered, left side of screen)
- **▶ Right button**: Rotate skier right (vertically centered, right side of screen)
- Touch controls **only visible while actively skiing**:
  - Hidden on start screen
  - Shown during gameplay
  - Hidden during math questions
  - Hidden on end screen
- Auto-appear on touch-enabled devices
- Buttons are large (90px) and clearly visible for easy tapping

### Transversal Skiing Physics
The skier uses **rotation-based steering** for realistic carving:

- **Rotation controls**: Left/right inputs rotate the skier's facing angle
- **Hold rotation**: When releasing controls, skier maintains current angle
- **Speed-dependent turning**: 
  - Lower speed = easier to turn (3× turn rate at standstill)
  - Higher speed = harder to turn (1× turn rate at max speed)
- **Angle affects speed**:
  - Riding straight = slight speed bonus (gravity pulls you down faster)
  - Larger turn angles = slower speed (carving bleeds momentum)
  - Gentle curves maintain speed better than sharp turns
- **Visual feedback**: Skier body tilts into carves realistically
- **Max turn angle**: 45° (controlled carving, not fully sideways)

### Question Timing
- Questions appear **only when skier reaches the exact gate position**
- If player is **crashing or tumbling**, recovery completes first before question appears
- One question per gate - gates only trigger once

### Finishing the Race
- Game ends when player **crosses the finish line** (wide detection zone)
- Final screen shows: Score, Time, Accuracy percentage
- Achievements awarded based on performance

### Achievements
- 🎯 **Perfect Run**: Complete without any wrong answers (100% accuracy)
- ⭐ **Math Master**: 90%+ accuracy
- ⚡ **Speed Demon**: Finish in under 1 minute
- 🏆 **High Scorer**: Score 1000+ points

## Player Character

### Realistic Skier Model
- **Racing suit**: Red jacket with navy pants, racing number bib
- **Safety gear**: Full-coverage helmet with orange-tinted goggles
- **Skiing stance**: Authentic crouch position, leaning forward
- **Equipment**:
  - Modern shaped skis with curved profile and bindings
  - Carbon fiber poles with grips, baskets, and tips
  - Ski boots with buckle details
- **Animation**: Skier leans into turns (left/right tilt)

### Camera
- Close third-person view behind skier
- Camera offset: 2.5 units up, 5 units behind (immersive close-up)
- Narrower FOV (65°) for larger on-screen appearance
- Smooth follow with look-ahead targeting

## Environment & Scenery

### Terrain
- Procedurally generated using **simplex noise** (via `simplex-noise` package)
- **Single source of truth**: All terrain height calculations use `TerrainGenerator.getHeightFromLocal()`
  - Terrain geometry, skier, gates, trees, rocks, and mountains all use the same height function
  - Ensures perfect alignment of all objects with the terrain surface
- **Steep pro-level slope**: 0.25 slope factor (~150 units vertical drop)
- **Terrain features**:
  - Steep base slope like World Cup ski courses
  - Large rolling hills (fBm noise, 3 octaves)
  - Medium terrain variation for natural look
  - Fine snow texture detail
  - Raised edges on sides of slope (edge factor)
- Terrain plane: 500×600 units, rotated and centered at z=-250
- Snow-covered ground with subtle ski trail markings

### Atmosphere
- **Gradient sky dome**: Deep blue at top, light blue at horizon
- **Falling snow particles** with wind drift effect
- **Moving clouds**: Small, high-altitude clouds for realistic sky
- **Exponential fog** for depth and atmosphere
- ACES filmic tone mapping for cinematic look

### Forest
- 80+ pine trees in dense forests on both sides
- **Multi-tier stylized trees**: 5-7 branch tiers with natural variation
- Thin snow coverage on branch tips
- Varied foliage colors using noise for natural look
- Trees placed at x: ±35 to ±80 (outside ski path)
- All trees properly grounded on terrain surface

### Mountains
- Low-poly stylized mountains with 6-segment cones
- Multiple peaks with thin snow caps (properly centered)
- Secondary peaks for added depth
- Flat shading for stylized aesthetic
- Atmospheric color variation (farther = hazier)
- **Three layers**: Far (z=-850), mid (z=-750), near (z=-650)
- **Side mountains**: Flank the ski slope at x=±180-220
- All mountains follow terrain height for proper grounding

### Rocks & Boulders
- Simplified octahedron-based geometry
- Flattened for natural boulder appearance
- Scattered on terrain edges with snow coverage
- Properly positioned on terrain surface

### Details
- Realistic lighting: warm sun, blue sky reflection, fill light
- High-quality shadows (4K shadow maps)

## Collision System

### Flag Pole Collisions
Hitting flag poles has consequences based on how close the impact is:

- **Crash** (direct pole hit): 
  - Player falls down with dramatic tumbling animation
  - -100 points, +5 second penalty
  - Recovery time: ~2 seconds
  - Player repositioned past the gate (center of course, 5 units beyond gate)
  
- **Tumble** (through banner area):
  - Player wobbles but stays upright
  - -25 points, +2 second penalty  
  - Reduced speed during recovery
  - No repositioning needed (skier continues past gate)
  
- **Graze** (close to pole):
  - Swoosh sound effect only
  - No penalties

### Obstacles
- **Trees**: Collision radius of 1.5× scale around trunks
- **Rocks**: Collision radius of 1.2× rock size
- Player bounces off obstacles with reduced velocity

### Ski Path
- Clear corridor from x: -25 to +25
- Player movement bounded to this area
- All obstacles placed outside ski path
- Gates positioned avoiding obstacles

## User Interface

### During Gameplay
- **Score panel** (top-left): Current score, timer, gates passed
- **Question modal** (center): Question text, 4 answer buttons, feedback
- Visual and audio feedback for correct/incorrect answers

### Start Screen
- Game title and description
- **Player name input** (optional, defaults to "Skier")
- Difficulty selector dropdown
- "Start Race" button

### End Screen
- Personalized header: "[Player Name] Finished!"
- Final score, time, accuracy percentage
- Earned achievements displayed
- "Race Again" button

## Technical Implementation

### Stack
- **Three.js** for 3D graphics
- **TypeScript** for type-safe development
- **Vite** for fast build/dev server
- **Docker** for containerized deployment

### Project Structure
```
skimath/
├── src/
│   ├── config/
│   │   └── GameConfig.ts     # Centralized game configuration constants
│   ├── game/
│   │   ├── Game.ts           # Main game controller
│   │   ├── SceneManager.ts   # 3D scene, environment, lighting
│   │   ├── Player.ts         # Player facade (composes model + controller)
│   │   ├── SkierModel.ts     # Skier 3D model creation
│   │   ├── SkierController.ts # Skier movement and state
│   │   ├── GateManager.ts    # Slalom gates, start/finish areas
│   │   ├── ObstacleManager.ts # Tree/rock collision tracking
│   │   └── AudioManager.ts   # Procedural audio generation
│   ├── questions/
│   │   ├── IQuestionGenerator.ts  # Interface for pluggable question generators
│   │   ├── QuestionGenerators.ts  # Implementations: Mult/Div/Add/Sub/Mixed
│   │   ├── QuestionManager.ts     # Question generation (uses composition)
│   │   └── index.ts               # Module exports
│   ├── course/
│   │   ├── ICourseGenerator.ts    # Interface for pluggable course generators
│   │   ├── CourseGenerators.ts    # Implementations: Slalom/GiantSlalom/Custom
│   │   └── index.ts               # Module exports
│   ├── ui/
│   │   └── UIManager.ts      # UI interactions
│   ├── utils/
│   │   ├── EventEmitter.ts   # Typed pub/sub event system for decoupled communication
│   │   ├── MathUtils.ts      # Shared math utilities (randomInRange, shuffle, clamp, etc.)
│   │   ├── TerrainGenerator.ts # Procedural terrain using simplex noise (single source of truth)
│   │   └── ModelLoader.ts    # GLTF/GLB model loading utility with caching
│   ├── styles/
│   │   └── main.css          # Styling
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   └── main.ts               # Entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── Dockerfile
├── docker-compose.yml
├── specs.md                  # This specification document
└── todo.md                   # Code quality improvement tracker
```

### Running the Game

#### Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

#### Production
```bash
npm run build
npm run preview
```

#### Docker
```bash
docker-compose up --build
```

#### GitHub Pages Deployment
The game is deployed automatically to GitHub Pages on push to `main`:
- **Live URL**: `https://skycler.github.io/skimath/`
- Auto-deploy via GitHub Actions workflow (`.github/workflows/deploy.yml`)
- Static site build with Vite, base path set to `/skimath/`

### Mobile Support
- **iOS Safari**: Full support with touch controls
- **Android Chrome**: Full support with touch controls + install prompt
- **Add to Home Screen / Install**:
  - **iOS**: Share → "Add to Home Screen"
  - **Android**: Menu (⋮) → "Install app" or "Add to Home Screen"
  - Opens fullscreen without browser UI
  - Shows in app drawer like a native app

### Progressive Web App (PWA)
The game is a full PWA with:
- **Web App Manifest** (`public/manifest.json`):
  - App name, description, and branding
  - Fullscreen display mode
  - Portrait orientation lock
  - Custom app icons (192x192, 512x512 SVG)
- **Fullscreen optimizations**:
  - `apple-mobile-web-app-capable` for iOS standalone mode
  - `mobile-web-app-capable` for Android standalone mode
  - `viewport-fit=cover` for edge-to-edge display
  - Safe area insets for iPhone notch/home indicator
  - Pull-to-refresh disabled during gameplay
  - Theme color matches game background (#1a1a2e)
- Viewport optimized for mobile (no pinch-to-zoom during gameplay)

## Future Enhancements (Not Yet Implemented)
- Leaderboard with persistent scores
- ~~Additional operations (division, addition, subtraction)~~ ✅ Interface ready via `IQuestionGenerator`
- ~~More course variations~~ ✅ Interface ready via `ICourseGenerator`
- ~~Mobile touch controls~~ ✅ Implemented
- Multiplayer mode

## Audio System (Implemented)

### Sound Effects
All sounds are procedurally generated using the Web Audio API - no external audio files required.

- **Skiing sound**: Continuous pink noise that adjusts volume based on speed
- **Carving sound**: High-frequency edge noise when turning (scales with speed)
- **Gate pass**: Swoosh sound when approaching a gate
- **Correct answer**: Ascending cheerful arpeggio (C-E-G-C)
- **Wrong answer**: Descending dissonant buzzer
- **Collision**: Low thud with noise burst when hitting trees/rocks
- **Flag graze**: Quick swoosh sound when brushing past a flag pole
- **Tumble**: Impact sounds with sliding noise when going through banner
- **Crash**: Dramatic impact with tumbling sounds when hitting pole directly
- **Start race**: Countdown beeps with 1-second intervals (beep-beep-beep-GO!)
- **Finish**: Triumphant fanfare chord progression

### Audio Behavior
- Carving sound stops when game pauses for questions
- Ambient skiing sound continues during questions
- All sounds stop at race end

### Audio Controls
- **Mute button** (🔊/🔇) in the score panel to toggle all sounds
- Audio resumes automatically on user interaction (browser requirement)