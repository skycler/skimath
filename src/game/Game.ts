import { SceneManager } from './SceneManager';
import { Player } from './Player';
import { GateManager } from './GateManager';
import { AudioManager } from './AudioManager';
import { QuestionManager } from '../questions/QuestionManager';
import { UIManager } from '../ui/UIManager';
import { GameState, Difficulty } from '../types';
import { SCORING, TIME_PENALTIES, ACHIEVEMENTS, UI } from '../config/GameConfig';
import { gameEvents, GameEventType } from '../utils/EventEmitter';
import { applyScorePenalty, formatTime, percentage } from '../utils/MathUtils';

export class Game {
  private sceneManager: SceneManager;
  private player: Player;
  private gateManager: GateManager;
  private audioManager: AudioManager;
  private questionManager: QuestionManager;
  private uiManager: UIManager;
  
  private gameState: GameState = GameState.MENU;
  private score: number = 0;
  private correctAnswers: number = 0;
  private totalQuestions: number = 0;
  private startTime: number = 0;
  private elapsedTime: number = 0;
  private difficulty: Difficulty = Difficulty.MEDIUM;
  private _playerName: string = 'Skier';
  
  private isPaused: boolean = false;
  
  constructor(canvas: HTMLCanvasElement) {
    this.sceneManager = new SceneManager(canvas);
    this.player = new Player(this.sceneManager.scene);
    this.gateManager = new GateManager(this.sceneManager.scene);
    this.audioManager = new AudioManager();
    this.questionManager = new QuestionManager();
    this.uiManager = new UIManager(this);
  }
  
  async init(): Promise<void> {
    this.sceneManager.init();
    await this.player.init(); // Async to load GLTF model
    // Pass obstacle manager to gate manager so gates avoid obstacles
    this.gateManager.setObstacleManager(this.sceneManager.obstacleManager);
    this.gateManager.init();
    this.uiManager.init();
    
    this.setupEventListeners();
    this.animate();
  }
  
  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.sceneManager.onWindowResize();
    });
    
    window.addEventListener('keydown', (e) => {
      if (this.gameState === GameState.PLAYING) {
        this.player.handleKeyDown(e.code);
      }
    });
    
    window.addEventListener('keyup', (e) => {
      if (this.gameState === GameState.PLAYING) {
        this.player.handleKeyUp(e.code);
      }
    });
    
    // Touch controls for mobile
    this.setupTouchControls();
    
    // Tilt controls for mobile (device orientation)
    this.setupTiltControls();
  }
  
  private isTouchDevice: boolean = false;
  private touchControls: HTMLElement | null = null;
  private tiltEnabled: boolean = false;
  private tiltCalibration: number = 0; // Baseline tilt when game starts
  
  private setupTouchControls(): void {
    this.touchControls = document.getElementById('touch-controls');
    const touchLeft = document.getElementById('touch-left');
    const touchRight = document.getElementById('touch-right');
    
    // Detect touch device
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Helper to handle both touch and mouse events
    const addControlEvents = (element: HTMLElement | null, keyCode: string) => {
      if (!element) return;
      
      const handleStart = (e: Event) => {
        e.preventDefault();
        if (this.gameState === GameState.PLAYING && !this.isPaused) {
          this.player.handleKeyDown(keyCode);
        }
      };
      
      const handleEnd = (e: Event) => {
        e.preventDefault();
        if (this.gameState === GameState.PLAYING) {
          this.player.handleKeyUp(keyCode);
        }
      };
      
      element.addEventListener('touchstart', handleStart, { passive: false });
      element.addEventListener('touchend', handleEnd, { passive: false });
      element.addEventListener('touchcancel', handleEnd, { passive: false });
      element.addEventListener('mousedown', handleStart);
      element.addEventListener('mouseup', handleEnd);
      element.addEventListener('mouseleave', handleEnd);
    };
    
    addControlEvents(touchLeft, 'ArrowLeft');
    addControlEvents(touchRight, 'ArrowRight');
  }
  
  private setupTiltControls(): void {
    // Check if device orientation is supported
    if (!window.DeviceOrientationEvent) {
      console.log('[Game] Device orientation not supported');
      return;
    }
    
    // For iOS 13+, we need to request permission
    const requestPermission = (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission;
    
    if (typeof requestPermission === 'function') {
      // iOS 13+ requires user gesture to request permission
      // Add a one-time click listener to request permission
      const requestTiltPermission = async () => {
        try {
          const permission = await requestPermission();
          if (permission === 'granted') {
            this.enableTiltControls();
            console.log('[Game] Tilt controls enabled (iOS)');
          }
        } catch (error) {
          console.warn('[Game] Tilt permission denied:', error);
        }
        document.removeEventListener('click', requestTiltPermission);
      };
      document.addEventListener('click', requestTiltPermission, { once: true });
    } else {
      // Non-iOS devices - just enable directly
      this.enableTiltControls();
    }
  }
  
  private enableTiltControls(): void {
    this.tiltEnabled = true;
    
    window.addEventListener('deviceorientation', (event) => {
      if (!this.tiltEnabled || this.gameState !== GameState.PLAYING || this.isPaused) {
        return;
      }
      
      // gamma is left/right tilt (-90 to 90 degrees)
      const gamma = event.gamma || 0;
      
      // Apply calibration offset
      const tilt = gamma - this.tiltCalibration;
      
      // Dead zone of ±5 degrees to prevent drift
      const deadZone = 5;
      
      if (Math.abs(tilt) < deadZone) {
        // In dead zone - release both keys
        this.player.handleKeyUp('ArrowLeft');
        this.player.handleKeyUp('ArrowRight');
      } else if (tilt < -deadZone) {
        // Tilting left
        this.player.handleKeyDown('ArrowLeft');
        this.player.handleKeyUp('ArrowRight');
      } else if (tilt > deadZone) {
        // Tilting right
        this.player.handleKeyDown('ArrowRight');
        this.player.handleKeyUp('ArrowLeft');
      }
    });
  }
  
  private calibrateTilt(): void {
    // Set current tilt as the neutral position
    // This is called when the game starts
    if (this.tiltEnabled && window.DeviceOrientationEvent) {
      const calibrate = (event: DeviceOrientationEvent) => {
        this.tiltCalibration = event.gamma || 0;
        console.log('[Game] Tilt calibrated to:', this.tiltCalibration);
        window.removeEventListener('deviceorientation', calibrate);
      };
      window.addEventListener('deviceorientation', calibrate, { once: true });
    }
  }
  
  private showTouchControls(): void {
    if (this.isTouchDevice && this.touchControls) {
      this.touchControls.classList.remove('hidden');
    }
  }
  
  private hideTouchControls(): void {
    if (this.touchControls) {
      this.touchControls.classList.add('hidden');
    }
  }
  
  startGame(difficulty: Difficulty, playerName: string = 'Skier'): void {
    this.difficulty = difficulty;
    this._playerName = playerName;
    this.gameState = GameState.PLAYING;
    this.score = 0;
    this.correctAnswers = 0;
    this.totalQuestions = 0;
    this.startTime = Date.now();
    this.elapsedTime = 0;
    
    this.player.reset();
    this.gateManager.reset();
    this.questionManager.setDifficulty(difficulty);
    
    // Emit game started event
    gameEvents.emit(GameEventType.GAME_STARTED, { 
      difficulty: difficulty.toString(), 
      playerName 
    });
    
    // Start audio
    this.audioManager.resume();
    this.audioManager.playStartRace();
    this.audioManager.startSkiingSound();
    this.audioManager.startCarvingSound();
    
    this.uiManager.hideStartScreen();
    this.uiManager.updateScore(this.score);
    this.uiManager.updateGates(0, this.gateManager.totalGates);
    
    // Show touch controls for mobile
    this.showTouchControls();
    
    // Calibrate tilt controls (set current tilt as neutral)
    this.calibrateTilt();
  }
  
  pauseGame(): void {
    this.isPaused = true;
    this.gameState = GameState.QUESTION;
    this.player.clearInput(); // Clear any stuck movement keys
    
    // Silence carving sound while paused (skiing ambient sound continues)
    this.audioManager.updateCarvingSound(false, 0);
    
    // Hide touch controls during question
    this.hideTouchControls();
    
    gameEvents.emit(GameEventType.GAME_PAUSED);
  }
  
  resumeGame(): void {
    this.isPaused = false;
    this.gameState = GameState.PLAYING;
    
    // Show touch controls again
    this.showTouchControls();
    
    gameEvents.emit(GameEventType.GAME_RESUMED);
  }
  
  endGame(): void {
    this.gameState = GameState.ENDED;
    
    // Hide touch controls
    this.hideTouchControls();
    
    // Stop skiing sound and play finish fanfare
    this.audioManager.stopSkiingSound();
    this.audioManager.playFinish();
    
    const accuracy = percentage(this.correctAnswers, this.totalQuestions);
    
    const achievements = this.calculateAchievements();
    
    gameEvents.emit(GameEventType.GAME_ENDED, {
      score: this.score,
      time: formatTime(this.elapsedTime),
      accuracy
    });
    
    this.uiManager.showEndScreen(
      this.score,
      formatTime(this.elapsedTime),
      accuracy,
      achievements
    );
  }
  
  private calculateAchievements(): string[] {
    const achievements: string[] = [];
    
    const accuracy = percentage(this.correctAnswers, this.totalQuestions);
    
    if (accuracy === ACHIEVEMENTS.PERFECT_ACCURACY) {
      achievements.push('🎯 Perfect Run');
    }
    if (accuracy >= ACHIEVEMENTS.MATH_MASTER_ACCURACY) {
      achievements.push('⭐ Math Master');
    }
    if (this.elapsedTime < ACHIEVEMENTS.SPEED_DEMON_TIME) {
      achievements.push('⚡ Speed Demon');
    }
    if (this.score >= ACHIEVEMENTS.HIGH_SCORER_POINTS) {
      achievements.push('🏆 High Scorer');
    }
    
    return achievements;
  }
  
  onGateReached(gateIndex: number): void {
    this.pauseGame();
    this.audioManager.playGatePass();
    
    gameEvents.emit(GameEventType.GATE_REACHED, { gateIndex });
    
    const question = this.questionManager.generateQuestion();
    this.uiManager.showQuestion(question);
  }
  
  onAnswerSelected(isCorrect: boolean): void {
    this.totalQuestions++;
    
    if (isCorrect) {
      this.correctAnswers++;
      const points = this.calculatePoints();
      this.score += points;
      this.gateManager.passGate();
      this.audioManager.playCorrect();
      this.uiManager.showFeedback(true, 'Correct! +' + points);
      
      gameEvents.emit(GameEventType.ANSWER_CORRECT, { points });
    } else {
      this.score = applyScorePenalty(this.score, SCORING.WRONG_ANSWER_PENALTY);
      this.elapsedTime += TIME_PENALTIES.WRONG_ANSWER;
      this.audioManager.playWrong();
      this.uiManager.showFeedback(false, `Wrong! -${TIME_PENALTIES.WRONG_ANSWER / 1000} seconds`);
      
      gameEvents.emit(GameEventType.ANSWER_WRONG, { penalty: TIME_PENALTIES.WRONG_ANSWER });
    }
    
    gameEvents.emit(GameEventType.SCORE_CHANGED, { 
      score: this.score, 
      delta: isCorrect ? this.calculatePoints() : -SCORING.WRONG_ANSWER_PENALTY 
    });
    
    this.uiManager.updateScore(this.score);
    this.uiManager.updateGates(this.gateManager.gatesPassed, this.gateManager.totalGates);
    
    setTimeout(() => {
      this.uiManager.hideQuestion();
      
      if (this.gateManager.gatesPassed >= this.gateManager.totalGates) {
        this.endGame();
      } else {
        this.resumeGame();
      }
    }, UI.QUESTION_FEEDBACK_DELAY);
  }
  
  private calculatePoints(): number {
    const difficultyMultiplier = {
      [Difficulty.EASY]: SCORING.DIFFICULTY_MULTIPLIERS.easy,
      [Difficulty.MEDIUM]: SCORING.DIFFICULTY_MULTIPLIERS.medium,
      [Difficulty.HARD]: SCORING.DIFFICULTY_MULTIPLIERS.hard,
      [Difficulty.EXPERT]: SCORING.DIFFICULTY_MULTIPLIERS.expert
    };
    return Math.round(SCORING.BASE_POINTS * difficultyMultiplier[this.difficulty]);
  }
  
  private animate = (): void => {
    requestAnimationFrame(this.animate);
    
    if (this.gameState === GameState.PLAYING && !this.isPaused) {
      this.elapsedTime = Date.now() - this.startTime;
      this.uiManager.updateTimer(formatTime(this.elapsedTime));
      
      this.player.update();
      
      // Use positionRef for hot-path collision checks (avoids allocations)
      const playerPos = this.player.positionRef;
      
      // Check for obstacle collisions (trees and rocks)
      const obstacleCollision = this.sceneManager.obstacleManager.checkCollision(playerPos);
      if (obstacleCollision) {
        this.player.applyCollision(obstacleCollision);
        this.audioManager.playCollision();
        gameEvents.emit(GameEventType.OBSTACLE_HIT, { 
          pushBack: { x: obstacleCollision.x, z: obstacleCollision.z } 
        });
      }
      
      // Check for flag pole collisions (graze, tumble, crash)
      if (!this.player.isCrashed && !this.player.isTumblingState) {
        const flagCollision = this.gateManager.checkFlagCollision(playerPos);
        if (flagCollision.type === 'crash' && flagCollision.gate) {
          this.player.crash(flagCollision.gate.position.z);
          this.audioManager.playCrash();
          this.score = applyScorePenalty(this.score, SCORING.CRASH_PENALTY);
          this.elapsedTime += TIME_PENALTIES.CRASH;
          this.uiManager.updateScore(this.score);
          gameEvents.emit(GameEventType.FLAG_CRASH, { gateZ: flagCollision.gate.position.z });
        } else if (flagCollision.type === 'tumble') {
          this.player.tumble();
          this.audioManager.playTumble();
          this.score = applyScorePenalty(this.score, SCORING.TUMBLE_PENALTY);
          this.elapsedTime += TIME_PENALTIES.TUMBLE;
          this.uiManager.updateScore(this.score);
          gameEvents.emit(GameEventType.FLAG_TUMBLE);
        } else if (flagCollision.type === 'graze') {
          this.audioManager.playFlagGraze();
          gameEvents.emit(GameEventType.FLAG_GRAZE);
        }
      }
      
      // Update skiing sound based on player speed
      this.audioManager.updateSkiingSound(this.player.speed);
      
      // Update carving sound based on turning
      this.audioManager.updateCarvingSound(this.player.isTurning, this.player.speed);
      
      // Check for gate collisions - only when player is not crashing/tumbling
      // If falling, fall first and then ask the question after recovery
      if (!this.player.isCrashed && !this.player.isTumblingState) {
        const gateCollision = this.gateManager.checkCollision(playerPos);
        if (gateCollision !== -1) {
          this.onGateReached(gateCollision);
        }
      }
      
      // Check if player crossed the finish line
      if (this.gateManager.checkFinishLine(playerPos)) {
        gameEvents.emit(GameEventType.FINISH_LINE_CROSSED);
        this.endGame();
      }
      
      // Update camera to follow player
      this.sceneManager.updateCamera(playerPos);
    }
    
    this.sceneManager.render();
  };
  
  toggleMute(): boolean {
    return this.audioManager.toggleMute();
  }
  
  get currentDifficulty(): Difficulty {
    return this.difficulty;
  }
  
  get skierName(): string {
    return this._playerName;
  }
}
