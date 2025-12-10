import { Game } from '../game/Game';
import { Question, Difficulty } from '../types';

export class UIManager {
  private game: Game;
  private playerName: string = 'Skier';
  
  // UI Elements
  private scoreValue: HTMLElement;
  private timerValue: HTMLElement;
  private gatesValue: HTMLElement;
  private questionModal: HTMLElement;
  private questionText: HTMLElement;
  private answerChoices: HTMLElement;
  private feedback: HTMLElement;
  private startScreen: HTMLElement;
  private endScreen: HTMLElement;
  private startButton: HTMLElement;
  private restartButton: HTMLElement;
  private difficultySelect: HTMLSelectElement;
  private playerNameInput: HTMLInputElement;
  private playerFinishName: HTMLElement;
  private finalScore: HTMLElement;
  private finalTime: HTMLElement;
  private finalAccuracy: HTMLElement;
  private achievements: HTMLElement;
  private muteButton: HTMLElement;
  
  private currentQuestion: Question | null = null;
  
  constructor(game: Game) {
    this.game = game;
    
    // Get all UI elements
    this.scoreValue = document.getElementById('score-value')!;
    this.timerValue = document.getElementById('timer-value')!;
    this.gatesValue = document.getElementById('gates-value')!;
    this.questionModal = document.getElementById('question-modal')!;
    this.questionText = document.getElementById('question-text')!;
    this.answerChoices = document.getElementById('answer-choices')!;
    this.feedback = document.getElementById('feedback')!;
    this.startScreen = document.getElementById('start-screen')!;
    this.endScreen = document.getElementById('end-screen')!;
    this.startButton = document.getElementById('start-button')!;
    this.restartButton = document.getElementById('restart-button')!;
    this.difficultySelect = document.getElementById('difficulty-select') as HTMLSelectElement;
    this.playerNameInput = document.getElementById('player-name') as HTMLInputElement;
    this.playerFinishName = document.getElementById('player-finish-name')!;
    this.finalScore = document.getElementById('final-score')!;
    this.finalTime = document.getElementById('final-time')!;
    this.finalAccuracy = document.getElementById('final-accuracy')!;
    this.achievements = document.getElementById('achievements')!;
    this.muteButton = document.getElementById('mute-button')!;
  }
  
  init(): void {
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    this.startButton.addEventListener('click', () => {
      // Get player name (default to 'Skier' if empty)
      this.playerName = this.playerNameInput.value.trim() || 'Skier';
      const difficulty = this.getDifficultyFromSelect();
      this.game.startGame(difficulty, this.playerName);
    });
    
    this.restartButton.addEventListener('click', () => {
      this.hideEndScreen();
      this.showStartScreen();
    });
    
    this.muteButton.addEventListener('click', () => {
      const isMuted = this.game.toggleMute();
      this.muteButton.textContent = isMuted ? '🔇' : '🔊';
      this.muteButton.classList.toggle('muted', isMuted);
    });
  }
  
  private getDifficultyFromSelect(): Difficulty {
    const value = this.difficultySelect.value;
    switch (value) {
      case 'easy': return Difficulty.EASY;
      case 'medium': return Difficulty.MEDIUM;
      case 'hard': return Difficulty.HARD;
      case 'expert': return Difficulty.EXPERT;
      default: return Difficulty.MEDIUM;
    }
  }
  
  updateScore(score: number): void {
    this.scoreValue.textContent = score.toString();
  }
  
  updateTimer(time: string): void {
    this.timerValue.textContent = time;
  }
  
  updateGates(passed: number, total: number): void {
    this.gatesValue.textContent = `${passed}/${total}`;
  }
  
  showQuestion(question: Question): void {
    this.currentQuestion = question;
    this.questionText.textContent = question.text;
    this.feedback.classList.add('hidden');
    
    // Clear previous answers
    this.answerChoices.innerHTML = '';
    
    // Create answer buttons
    question.answers.forEach(answer => {
      const button = document.createElement('button');
      button.className = 'answer-btn';
      button.textContent = answer.toString();
      button.addEventListener('click', () => this.onAnswerClick(answer, button));
      this.answerChoices.appendChild(button);
    });
    
    this.questionModal.classList.remove('hidden');
  }
  
  private onAnswerClick(answer: number, button: HTMLElement): void {
    if (!this.currentQuestion) return;
    
    // Disable all buttons
    const buttons = this.answerChoices.querySelectorAll('.answer-btn');
    buttons.forEach(btn => {
      (btn as HTMLButtonElement).disabled = true;
    });
    
    const isCorrect = answer === this.currentQuestion.correctAnswer;
    
    // Show correct/incorrect styling
    if (isCorrect) {
      button.classList.add('correct');
    } else {
      button.classList.add('incorrect');
      // Highlight correct answer
      buttons.forEach(btn => {
        if (btn.textContent === this.currentQuestion!.correctAnswer.toString()) {
          btn.classList.add('correct');
        }
      });
    }
    
    this.game.onAnswerSelected(isCorrect);
  }
  
  showFeedback(isCorrect: boolean, message: string): void {
    this.feedback.textContent = message;
    this.feedback.className = isCorrect ? 'correct' : 'incorrect';
    this.feedback.classList.remove('hidden');
  }
  
  hideQuestion(): void {
    this.questionModal.classList.add('hidden');
    this.currentQuestion = null;
  }
  
  showStartScreen(): void {
    this.startScreen.classList.remove('hidden');
  }
  
  hideStartScreen(): void {
    this.startScreen.classList.add('hidden');
  }
  
  showEndScreen(score: number, time: string, accuracy: number, achievementsList: string[]): void {
    this.playerFinishName.textContent = this.playerName;
    this.finalScore.textContent = score.toString();
    this.finalTime.textContent = time;
    this.finalAccuracy.textContent = `${accuracy}%`;
    
    // Display achievements
    this.achievements.innerHTML = '';
    achievementsList.forEach(achievement => {
      const div = document.createElement('div');
      div.className = 'achievement';
      div.textContent = achievement;
      this.achievements.appendChild(div);
    });
    
    this.endScreen.classList.remove('hidden');
  }
  
  hideEndScreen(): void {
    this.endScreen.classList.add('hidden');
  }
}
