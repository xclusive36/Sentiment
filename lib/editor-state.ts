/**
 * Editor State Persistence Utility
 * Manages cursor position, scroll position, and recently edited files
 */

interface EditorState {
  cursorPosition?: { line: number; ch: number };
  scrollPosition?: number;
  lastModified: number;
}

interface RecentFile {
  path: string;
  lastOpened: number;
  title: string;
}

const EDITOR_STATE_PREFIX = 'sentiment-editor-state-';
const RECENT_FILES_KEY = 'sentiment-recent-files';
const MAX_RECENT_FILES = 10;

export class EditorStatePersistence {
  /**
   * Save editor state for a specific file
   */
  static saveState(filePath: string, state: Partial<EditorState>) {
    try {
      const key = `${EDITOR_STATE_PREFIX}${filePath}`;
      const existing = this.getState(filePath);
      const newState: EditorState = {
        ...existing,
        ...state,
        lastModified: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(newState));
    } catch (error) {
      console.error('Failed to save editor state:', error);
    }
  }

  /**
   * Get editor state for a specific file
   */
  static getState(filePath: string): EditorState {
    try {
      const key = `${EDITOR_STATE_PREFIX}${filePath}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to get editor state:', error);
    }
    return { lastModified: Date.now() };
  }

  /**
   * Clear editor state for a specific file
   */
  static clearState(filePath: string) {
    try {
      const key = `${EDITOR_STATE_PREFIX}${filePath}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear editor state:', error);
    }
  }

  /**
   * Add a file to recently edited list
   */
  static addRecentFile(filePath: string, title: string) {
    try {
      const recent = this.getRecentFiles();
      
      // Remove if already exists
      const filtered = recent.filter(f => f.path !== filePath);
      
      // Add to beginning
      filtered.unshift({
        path: filePath,
        lastOpened: Date.now(),
        title,
      });
      
      // Keep only max recent files
      const trimmed = filtered.slice(0, MAX_RECENT_FILES);
      
      localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to add recent file:', error);
    }
  }

  /**
   * Get list of recently edited files
   */
  static getRecentFiles(): RecentFile[] {
    try {
      const stored = localStorage.getItem(RECENT_FILES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to get recent files:', error);
    }
    return [];
  }

  /**
   * Remove a file from recently edited list
   */
  static removeRecentFile(filePath: string) {
    try {
      const recent = this.getRecentFiles();
      const filtered = recent.filter(f => f.path !== filePath);
      localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove recent file:', error);
    }
  }

  /**
   * Clear all editor states (useful for cleanup)
   */
  static clearAllStates() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(EDITOR_STATE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      localStorage.removeItem(RECENT_FILES_KEY);
    } catch (error) {
      console.error('Failed to clear all states:', error);
    }
  }

  /**
   * Clean up old editor states (older than 30 days)
   */
  static cleanupOldStates() {
    try {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith(EDITOR_STATE_PREFIX)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const state: EditorState = JSON.parse(stored);
            if (state.lastModified < thirtyDaysAgo) {
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.error('Failed to cleanup old states:', error);
    }
  }
}
