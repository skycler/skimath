import { Game } from './game/Game';

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }
  
  const game = new Game(canvas);
  await game.init();
});
