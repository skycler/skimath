/**
 * AudioManager - Handles all game sound effects using Web Audio API
 * Generates sounds procedurally without external audio files
 */
import { AUDIO } from '../config/GameConfig';

/**
 * Pre-defined buffer durations (in seconds) for various sound effects
 */
const BUFFER_DURATIONS = {
  GATE_PASS: 0.2,
  COLLISION: 0.1,
  FLAG_GRAZE: 0.15,
  TUMBLE: 0.5,
  CRASH: 0.6,
  SKIING: 2.0,
  CARVING: 2.0,
} as const;

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private skiingOscillator: OscillatorNode | null = null;
  private skiingGain: GainNode | null = null;
  private carvingNoise: AudioBufferSourceNode | null = null;
  private carvingGain: GainNode | null = null;
  private carvingFilter: BiquadFilterNode | null = null;
  private isSkiingSoundPlaying: boolean = false;
  private isCarvingSoundPlaying: boolean = false;
  private isMuted: boolean = false;
  
  // Pre-created audio buffers to avoid runtime allocations
  private whiteNoiseBuffer: AudioBuffer | null = null;
  private pinkNoiseBuffer: AudioBuffer | null = null;
  private gatePassBuffer: AudioBuffer | null = null;
  private collisionBuffer: AudioBuffer | null = null;
  private flagGrazeBuffer: AudioBuffer | null = null;
  private tumbleBuffer: AudioBuffer | null = null;
  private crashBuffer: AudioBuffer | null = null;
  
  constructor() {
    this.initAudioContext();
  }
  
  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = AUDIO.MASTER_VOLUME;
      this.masterGain.connect(this.audioContext.destination);
      
      // Pre-create all audio buffers
      this.createNoiseBuffers();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }
  
  /**
   * Pre-create all noise buffers during initialization
   * This avoids creating new buffers during gameplay
   */
  private createNoiseBuffers(): void {
    if (!this.audioContext) return;
    
    const sampleRate = this.audioContext.sampleRate;
    
    // White noise buffer (2 seconds, loopable for carving)
    const whiteSize = Math.floor(sampleRate * BUFFER_DURATIONS.CARVING);
    this.whiteNoiseBuffer = this.audioContext.createBuffer(1, whiteSize, sampleRate);
    const whiteData = this.whiteNoiseBuffer.getChannelData(0);
    for (let i = 0; i < whiteSize; i++) {
      whiteData[i] = Math.random() * 2 - 1;
    }
    
    // Pink noise buffer (2 seconds, loopable for skiing)
    const pinkSize = Math.floor(sampleRate * BUFFER_DURATIONS.SKIING);
    this.pinkNoiseBuffer = this.audioContext.createBuffer(1, pinkSize, sampleRate);
    const pinkData = this.pinkNoiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < pinkSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.0555179;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      pinkData[i] = (b0 + b1 + b2 + white * 0.1848) * 0.2;
    }
    
    // Gate pass swoosh buffer (fading white noise)
    const gatePassSize = Math.floor(sampleRate * BUFFER_DURATIONS.GATE_PASS);
    this.gatePassBuffer = this.audioContext.createBuffer(1, gatePassSize, sampleRate);
    const gatePassData = this.gatePassBuffer.getChannelData(0);
    for (let i = 0; i < gatePassSize; i++) {
      gatePassData[i] = (Math.random() * 2 - 1) * (1 - i / gatePassSize);
    }
    
    // Collision buffer (exponential decay noise)
    const collisionSize = Math.floor(sampleRate * BUFFER_DURATIONS.COLLISION);
    this.collisionBuffer = this.audioContext.createBuffer(1, collisionSize, sampleRate);
    const collisionData = this.collisionBuffer.getChannelData(0);
    for (let i = 0; i < collisionSize; i++) {
      collisionData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (collisionSize * 0.3));
    }
    
    // Flag graze buffer (quick exponential decay)
    const flagGrazeSize = Math.floor(sampleRate * BUFFER_DURATIONS.FLAG_GRAZE);
    this.flagGrazeBuffer = this.audioContext.createBuffer(1, flagGrazeSize, sampleRate);
    const flagGrazeData = this.flagGrazeBuffer.getChannelData(0);
    for (let i = 0; i < flagGrazeSize; i++) {
      flagGrazeData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (flagGrazeSize * 0.2));
    }
    
    // Tumble buffer (rolling noise with sine modulation)
    const tumbleSize = Math.floor(sampleRate * BUFFER_DURATIONS.TUMBLE);
    this.tumbleBuffer = this.audioContext.createBuffer(1, tumbleSize, sampleRate);
    const tumbleData = this.tumbleBuffer.getChannelData(0);
    for (let i = 0; i < tumbleSize; i++) {
      const t = i / sampleRate;
      tumbleData[i] = (Math.random() * 2 - 1) * Math.sin(t * 15) * Math.exp(-t * 3);
    }
    
    // Crash buffer (big exponential decay)
    const crashSize = Math.floor(sampleRate * BUFFER_DURATIONS.CRASH);
    this.crashBuffer = this.audioContext.createBuffer(1, crashSize, sampleRate);
    const crashData = this.crashBuffer.getChannelData(0);
    for (let i = 0; i < crashSize; i++) {
      crashData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (crashSize * 0.15));
    }
  }
  
  /**
   * Resume audio context (required after user interaction)
   */
  resume(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }
  
  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : AUDIO.MASTER_VOLUME;
    }
    return this.isMuted;
  }
  
  /**
   * Play correct answer sound - ascending cheerful tone
   */
  playCorrect(): void {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    // Create ascending arpeggio using note frequencies from config
    const notes = [AUDIO.NOTES.C5, AUDIO.NOTES.E5, AUDIO.NOTES.G5, AUDIO.NOTES.C6];
    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.08 + 0.02);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.08 + 0.15);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.2);
    });
  }
  
  /**
   * Play wrong answer sound - descending buzzer tone
   */
  playWrong(): void {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    // Create descending "wrong" sound
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.3);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.4);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(now);
    osc.stop(now + 0.4);
    
    // Add second dissonant tone
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();
    
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(250, now);
    osc2.frequency.linearRampToValueAtTime(120, now + 0.3);
    
    gain2.gain.setValueAtTime(0.1, now);
    gain2.gain.linearRampToValueAtTime(0, now + 0.35);
    
    osc2.connect(gain2);
    gain2.connect(this.masterGain!);
    
    osc2.start(now);
    osc2.stop(now + 0.4);
  }
  
  /**
   * Play gate pass sound - quick swoosh
   */
  playGatePass(): void {
    if (!this.audioContext || !this.masterGain || !this.gatePassBuffer) return;
    
    const now = this.audioContext.currentTime;
    
    // Use pre-created buffer for swoosh
    const noise = this.audioContext.createBufferSource();
    noise.buffer = this.gatePassBuffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.linearRampToValueAtTime(500, now + 0.15);
    filter.Q.value = 1;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    
    noise.start(now);
  }
  
  /**
   * Play collision sound - thud
   */
  playCollision(): void {
    if (!this.audioContext || !this.masterGain || !this.collisionBuffer) return;
    
    const now = this.audioContext.currentTime;
    
    // Low frequency thud
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
    
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(now);
    osc.stop(now + 0.25);
    
    // Use pre-created noise buffer
    const noise = this.audioContext.createBufferSource();
    noise.buffer = this.collisionBuffer;
    
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.value = 0.15;
    
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain!);
    
    noise.start(now);
  }
  
  /**
   * Start skiing sound - continuous snow/wind noise
   */
  startSkiingSound(): void {
    if (!this.audioContext || !this.masterGain || this.isSkiingSoundPlaying || !this.pinkNoiseBuffer) return;
    
    this.isSkiingSoundPlaying = true;
    
    // Use pre-created pink noise buffer
    this.skiingOscillator = this.audioContext.createBufferSource() as any;
    (this.skiingOscillator as any).buffer = this.pinkNoiseBuffer;
    (this.skiingOscillator as any).loop = true;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    
    this.skiingGain = this.audioContext.createGain();
    this.skiingGain.gain.value = 0;
    
    (this.skiingOscillator as any).connect(filter);
    filter.connect(this.skiingGain);
    this.skiingGain.connect(this.masterGain!);
    
    (this.skiingOscillator as any).start();
  }
  
  /**
   * Update skiing sound volume based on speed
   */
  updateSkiingSound(speed: number): void {
    if (!this.skiingGain) return;
    
    // Map speed to volume (0-0.15 range)
    const targetVolume = Math.min(0.15, Math.abs(speed) * 0.3);
    const currentTime = this.audioContext?.currentTime || 0;
    this.skiingGain.gain.setTargetAtTime(targetVolume, currentTime, 0.1);
  }
  
  /**
   * Stop skiing sound
   */
  stopSkiingSound(): void {
    if (this.skiingOscillator && this.skiingGain) {
      const currentTime = this.audioContext?.currentTime || 0;
      this.skiingGain.gain.setTargetAtTime(0, currentTime, 0.1);
      
      setTimeout(() => {
        try {
          (this.skiingOscillator as any)?.stop();
        } catch (e) {
          // Already stopped
        }
        this.skiingOscillator = null;
        this.skiingGain = null;
        this.isSkiingSoundPlaying = false;
      }, 200);
    }
    
    // Also stop carving sound
    this.stopCarvingSound();
  }
  
  /**
   * Start carving/edge sound - higher frequency scraping for turning
   */
  startCarvingSound(): void {
    if (!this.audioContext || !this.masterGain || this.isCarvingSoundPlaying || !this.whiteNoiseBuffer) return;
    
    this.isCarvingSoundPlaying = true;
    
    // Use pre-created white noise buffer
    this.carvingNoise = this.audioContext.createBufferSource();
    this.carvingNoise.buffer = this.whiteNoiseBuffer;
    this.carvingNoise.loop = true;
    
    // Bandpass filter for that ice/snow scraping sound
    this.carvingFilter = this.audioContext.createBiquadFilter();
    this.carvingFilter.type = 'bandpass';
    this.carvingFilter.frequency.value = 3000;
    this.carvingFilter.Q.value = 2;
    
    this.carvingGain = this.audioContext.createGain();
    this.carvingGain.gain.value = 0;
    
    this.carvingNoise.connect(this.carvingFilter);
    this.carvingFilter.connect(this.carvingGain);
    this.carvingGain.connect(this.masterGain!);
    
    this.carvingNoise.start();
  }
  
  /**
   * Update carving sound based on whether player is turning
   */
  updateCarvingSound(isTurning: boolean, speed: number): void {
    if (!this.carvingGain || !this.carvingFilter) return;
    
    const currentTime = this.audioContext?.currentTime || 0;
    
    if (isTurning && speed > 0.1) {
      // Carving sound volume based on speed
      const targetVolume = Math.min(0.12, speed * 0.25);
      this.carvingGain.gain.setTargetAtTime(targetVolume, currentTime, 0.05);
      
      // Higher frequency at higher speeds
      const targetFreq = 2500 + speed * 1500;
      this.carvingFilter.frequency.setTargetAtTime(targetFreq, currentTime, 0.1);
    } else {
      // Fade out when not turning
      this.carvingGain.gain.setTargetAtTime(0, currentTime, 0.08);
    }
  }
  
  /**
   * Stop carving sound
   */
  stopCarvingSound(): void {
    if (this.carvingNoise && this.carvingGain) {
      const currentTime = this.audioContext?.currentTime || 0;
      this.carvingGain.gain.setTargetAtTime(0, currentTime, 0.05);
      
      setTimeout(() => {
        try {
          this.carvingNoise?.stop();
        } catch (e) {
          // Already stopped
        }
        this.carvingNoise = null;
        this.carvingGain = null;
        this.carvingFilter = null;
        this.isCarvingSoundPlaying = false;
      }, 150);
    }
  }
  
  /**
   * Play finish fanfare - triumphant sound
   */
  playFinish(): void {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    // Fanfare chord progression
    const chords = [
      [261.63, 329.63, 392.00], // C major
      [293.66, 369.99, 440.00], // D major  
      [329.63, 415.30, 493.88], // E major
      [349.23, 440.00, 523.25], // F major
      [392.00, 493.88, 587.33], // G major
      [523.25, 659.25, 783.99], // C major (high)
    ];
    
    chords.forEach((chord, chordIndex) => {
      chord.forEach((freq) => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        const startTime = now + chordIndex * 0.15;
        const duration = chordIndex === chords.length - 1 ? 0.6 : 0.2;
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
        gain.gain.setValueAtTime(0.15, startTime + duration - 0.05);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        
        osc.connect(gain);
        gain.connect(this.masterGain!);
        
        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);
      });
    });
  }
  
  /**
   * Play start race sound - countdown beeps then go (1 second intervals)
   */
  playStartRace(): void {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    // Countdown beeps with 1 second intervals
    const notes = [440, 440, 440, 880]; // A4, A4, A4, A5 (go!)
    const beepDuration = 0.2;
    const interval = 1.0; // 1 second between beeps
    
    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      
      osc.type = 'square';
      osc.frequency.value = freq;
      
      const startTime = now + i * interval;
      const duration = i === notes.length - 1 ? 0.4 : beepDuration; // Longer "go" beep
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
      gain.gain.setValueAtTime(0.2, startTime + duration - 0.02);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
    });
  }
  
  /**
   * Play flag graze sound - quick swoosh/brush
   */
  playFlagGraze(): void {
    if (!this.audioContext || !this.masterGain || !this.flagGrazeBuffer) return;
    
    const now = this.audioContext.currentTime;
    
    // Use pre-created buffer for quick high-pitched swoosh
    const noise = this.audioContext.createBufferSource();
    noise.buffer = this.flagGrazeBuffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    
    noise.start(now);
  }
  
  /**
   * Play tumble sound - impact with rolling
   */
  playTumble(): void {
    if (!this.audioContext || !this.masterGain || !this.tumbleBuffer) return;
    
    const now = this.audioContext.currentTime;
    
    // Impact thud
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);
    
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(now);
    osc.stop(now + 0.35);
    
    // Use pre-created tumble noise buffer
    const noise = this.audioContext.createBufferSource();
    noise.buffer = this.tumbleBuffer;
    
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.value = 0.2;
    
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain!);
    
    noise.start(now + 0.1);
  }
  
  /**
   * Play crash sound - big impact
   */
  playCrash(): void {
    if (!this.audioContext || !this.masterGain || !this.crashBuffer) return;
    
    const now = this.audioContext.currentTime;
    
    // Big impact
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
    
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(now);
    osc.stop(now + 0.5);
    
    // Use pre-created crash noise buffer
    const noise = this.audioContext.createBufferSource();
    noise.buffer = this.crashBuffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.value = 0.35;
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);
    
    noise.start(now);
    
    // Secondary impact
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(80, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(40, now + 0.4);
    
    gain2.gain.setValueAtTime(0.3, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc2.connect(gain2);
    gain2.connect(this.masterGain!);
    
    osc2.start(now + 0.15);
    osc2.stop(now + 0.55);
  }
  
  /**
   * Clean up audio resources
   */
  dispose(): void {
    this.stopSkiingSound();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
