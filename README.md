# SkiMath - 3D Multiplication Practice Game

A gamified multiplication practice game featuring a 3D giant slalom ski course built with Three.js.

## Features

- 🎿 3D skiing experience with realistic terrain and environment
- ✖️ Multiplication questions at each gate
- 📊 Multiple difficulty levels (Easy, Medium, Hard, Expert)
- 🏆 Achievement system for milestones
- ⏱️ Time tracking with penalties for wrong answers
- 📱 Responsive design for desktop and mobile

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker

```bash
# Build and run with Docker
docker-compose up --build

# Or manually
docker build -t skimath .
docker run -p 3000:3000 skimath
```

## How to Play

1. Select your difficulty level on the start screen
2. Click "Start Race" to begin
3. Use **Arrow Keys** or **WASD** to control your skier:
   - Left/Right (A/D): Steer left/right
   - Up/Down (W/S): Speed up/slow down
4. When you approach a gate, answer the multiplication question
5. Correct answers let you pass through; wrong answers add time penalties
6. Complete all 10 gates to finish the race

## Scoring

- **Base Points**: 100 points per correct answer
- **Difficulty Multiplier**:
  - Easy: 1x
  - Medium: 1.5x
  - Hard: 2x
  - Expert: 3x
- **Penalties**: -3 seconds for wrong answers

## Achievements

- 🎯 **Perfect Run**: Complete without any wrong answers
- ⭐ **Math Master**: 90%+ accuracy
- ⚡ **Speed Demon**: Finish in under 1 minute
- 🏆 **High Scorer**: Score 1000+ points

## Tech Stack

- **Three.js** - 3D graphics
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Docker** - Containerized deployment

## Project Structure

```
skimath/
├── src/
│   ├── game/
│   │   ├── Game.ts          # Main game controller
│   │   ├── SceneManager.ts  # Three.js scene setup
│   │   ├── Player.ts        # Skier character
│   │   └── GateManager.ts   # Slalom gates
│   ├── questions/
│   │   └── QuestionManager.ts  # Question generation
│   ├── ui/
│   │   └── UIManager.ts     # UI interactions
│   ├── styles/
│   │   └── main.css         # Styling
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   └── main.ts              # Entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── Dockerfile
└── docker-compose.yml
```

## License

MIT
