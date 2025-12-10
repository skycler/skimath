/**
 * Game event types for type-safe event handling
 */
export enum GameEventType {
  // Player events
  PLAYER_STARTED = 'player:started',
  PLAYER_CRASHED = 'player:crashed',
  PLAYER_TUMBLED = 'player:tumbled',
  PLAYER_RECOVERED = 'player:recovered',
  
  // Gate events
  GATE_REACHED = 'gate:reached',
  GATE_PASSED = 'gate:passed',
  FINISH_LINE_CROSSED = 'finish:crossed',
  
  // Collision events
  OBSTACLE_HIT = 'collision:obstacle',
  FLAG_GRAZE = 'collision:graze',
  FLAG_TUMBLE = 'collision:tumble',
  FLAG_CRASH = 'collision:crash',
  
  // Question events
  QUESTION_SHOWN = 'question:shown',
  ANSWER_CORRECT = 'answer:correct',
  ANSWER_WRONG = 'answer:wrong',
  
  // Game state events
  GAME_STARTED = 'game:started',
  GAME_PAUSED = 'game:paused',
  GAME_RESUMED = 'game:resumed',
  GAME_ENDED = 'game:ended',
  
  // Score events
  SCORE_CHANGED = 'score:changed',
  TIME_PENALTY = 'time:penalty',
}

/**
 * Event payload types for type safety
 */
export interface GameEventPayloads {
  [GameEventType.PLAYER_CRASHED]: { gateZ?: number };
  [GameEventType.PLAYER_TUMBLED]: undefined;
  [GameEventType.PLAYER_RECOVERED]: undefined;
  [GameEventType.PLAYER_STARTED]: undefined;
  
  [GameEventType.GATE_REACHED]: { gateIndex: number };
  [GameEventType.GATE_PASSED]: { gateIndex: number };
  [GameEventType.FINISH_LINE_CROSSED]: undefined;
  
  [GameEventType.OBSTACLE_HIT]: { pushBack: { x: number; z: number } };
  [GameEventType.FLAG_GRAZE]: undefined;
  [GameEventType.FLAG_TUMBLE]: undefined;
  [GameEventType.FLAG_CRASH]: { gateZ: number };
  
  [GameEventType.QUESTION_SHOWN]: { question: string; answers: string[] };
  [GameEventType.ANSWER_CORRECT]: { points: number };
  [GameEventType.ANSWER_WRONG]: { penalty: number };
  
  [GameEventType.GAME_STARTED]: { difficulty: string; playerName: string };
  [GameEventType.GAME_PAUSED]: undefined;
  [GameEventType.GAME_RESUMED]: undefined;
  [GameEventType.GAME_ENDED]: { score: number; time: string; accuracy: number };
  
  [GameEventType.SCORE_CHANGED]: { score: number; delta: number };
  [GameEventType.TIME_PENALTY]: { seconds: number };
}

type EventCallback<T = unknown> = (payload: T) => void;

/**
 * Simple typed event emitter for decoupled game communication
 * Implements a publish-subscribe pattern
 */
export class EventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  /**
   * Subscribe to an event
   * @param event - The event type to listen for
   * @param callback - Function to call when event is emitted
   * @returns Unsubscribe function
   */
  on<E extends GameEventType>(
    event: E,
    callback: EventCallback<GameEventPayloads[E]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback as EventCallback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event once (auto-unsubscribe after first emit)
   * @param event - The event type to listen for
   * @param callback - Function to call when event is emitted
   */
  once<E extends GameEventType>(
    event: E,
    callback: EventCallback<GameEventPayloads[E]>
  ): void {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe();
      callback(payload);
    });
  }

  /**
   * Unsubscribe from an event
   * @param event - The event type
   * @param callback - The callback to remove
   */
  off<E extends GameEventType>(
    event: E,
    callback: EventCallback<GameEventPayloads[E]>
  ): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback as EventCallback);
    }
  }

  /**
   * Emit an event with optional payload
   * @param event - The event type to emit
   * @param payload - Optional data to pass to listeners
   */
  emit<E extends GameEventType>(
    event: E,
    payload?: GameEventPayloads[E]
  ): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for a specific event or all events
   * @param event - Optional event type. If omitted, clears all listeners.
   */
  clear(event?: GameEventType): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   * @param event - The event type
   * @returns Number of listeners
   */
  listenerCount(event: GameEventType): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

/**
 * Global game event emitter instance
 * Import this to subscribe to or emit game events
 */
export const gameEvents = new EventEmitter();
