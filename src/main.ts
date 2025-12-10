import { Game } from './game/Game';

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }
  
  const game = new Game(canvas);
  game.init();
});
