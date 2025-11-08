/**
 * Editor State for History Management
 */
export interface EditorState {
  content: string;
  cursorPosition: number;
  timestamp: number;
}

/**
 * History Manager Configuration
 */
export interface HistoryManagerConfig {
  /** Maximum number of states to keep in history */
  maxSize?: number;
  /** Debounce delay in milliseconds before capturing state */
  debounceMs?: number;
  /** Minimum time between state captures in milliseconds */
  captureInterval?: number;
}

/**
 * History Manager for implementing undo/redo functionality
 * with debouncing to prevent spam from rapid typing
 */
export class HistoryManager {
  private history: EditorState[] = [];
  private currentIndex: number = -1;
  private readonly maxSize: number;
  private readonly debounceMs: number;
  private readonly captureInterval: number;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private lastCaptureTime: number = 0;

  constructor(config: HistoryManagerConfig = {}) {
    this.maxSize = config.maxSize || 100;
    this.debounceMs = config.debounceMs || 500;
    this.captureInterval = config.captureInterval || 1000;
  }

  /**
   * Push a new state to history (debounced)
   */
  push(content: string, cursorPosition: number): void {
    // Clear existing debounce timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // Set new debounce timeout
    this.debounceTimeout = setTimeout(() => {
      this.pushImmediate(content, cursorPosition);
    }, this.debounceMs);
  }

  /**
   * Push a new state to history immediately (bypass debounce)
   */
  pushImmediate(content: string, cursorPosition: number): void {
    const now = Date.now();

    // Prevent spam - enforce minimum time between captures
    if (now - this.lastCaptureTime < this.captureInterval) {
      return;
    }

    // Don't add if content is the same as current state
    if (this.currentIndex >= 0) {
      const current = this.history[this.currentIndex];
      if (current && current.content === content) {
        return;
      }
    }

    // Remove any states after current index (if we're not at the end)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Add new state
    const newState: EditorState = {
      content,
      cursorPosition,
      timestamp: now,
    };

    this.history.push(newState);
    this.currentIndex = this.history.length - 1;
    this.lastCaptureTime = now;

    // Enforce max size
    if (this.history.length > this.maxSize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  /**
   * Undo to previous state
   */
  undo(): EditorState | null {
    if (!this.canUndo()) {
      return null;
    }

    this.currentIndex--;
    return this.getCurrentState();
  }

  /**
   * Redo to next state
   */
  redo(): EditorState | null {
    if (!this.canRedo()) {
      return null;
    }

    this.currentIndex++;
    return this.getCurrentState();
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get current state
   */
  getCurrentState(): EditorState | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.history.length) {
      return null;
    }
    return this.history[this.currentIndex] || null;
  }

  /**
   * Get all history (for debugging)
   */
  getHistory(): EditorState[] {
    return [...this.history];
  }

  /**
   * Get current index (for debugging)
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Clear all history
   */
  clear(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    this.history = [];
    this.currentIndex = -1;
    this.lastCaptureTime = 0;
  }

  /**
   * Get memory usage estimate
   */
  getMemoryUsage(): { states: number; estimatedBytes: number; estimatedMB: number } {
    const states = this.history.length;
    const estimatedBytes = this.history.reduce((sum, state) => {
      return sum + state.content.length * 2 + 16; // Rough estimate
    }, 0);
    const estimatedMB = estimatedBytes / (1024 * 1024);

    return { states, estimatedBytes, estimatedMB };
  }

  /**
   * Export history for persistence
   */
  export(): string {
    return JSON.stringify({
      history: this.history,
      currentIndex: this.currentIndex,
    });
  }

  /**
   * Import history from persistence
   */
  import(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed.history) && typeof parsed.currentIndex === 'number') {
        this.history = parsed.history;
        this.currentIndex = parsed.currentIndex;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.clear();
  }
}
