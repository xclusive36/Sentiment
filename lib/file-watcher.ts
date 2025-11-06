import chokidar, { type FSWatcher } from 'chokidar';
import path from 'path';
import fs from 'fs';

export type FileChangeType = 'add' | 'change' | 'unlink';

export interface FileChange {
  type: FileChangeType;
  path: string;
  relativePath: string;
  timestamp: Date;
}

export interface SyncStatus {
  isWatching: boolean;
  lastSync: Date | null;
  changesDetected: number;
  conflictsResolved: number;
}

let watcher: FSWatcher | null = null;
let changeListeners: ((change: FileChange) => void)[] = [];
let syncStatus: SyncStatus = {
  isWatching: false,
  lastSync: null,
  changesDetected: 0,
  conflictsResolved: 0,
};

const markdownDirectory = path.join(process.cwd(), 'markdown');

/**
 * Start watching the markdown directory for changes
 */
export function startWatching(): void {
  if (watcher) {
    console.log('File watcher already running');
    return;
  }

  console.log('Starting file watcher for:', markdownDirectory);

  watcher = chokidar.watch(markdownDirectory, {
    ignored: [
      /(^|[\/\\])\../, // Ignore dotfiles
      /\.sentiment-.*\.json$/, // Ignore sentiment config files
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  });

  watcher
    .on('add', (filePath) => handleFileChange('add', filePath))
    .on('change', (filePath) => handleFileChange('change', filePath))
    .on('unlink', (filePath) => handleFileChange('unlink', filePath))
    .on('error', (error) => console.error('File watcher error:', error));

  syncStatus.isWatching = true;
  syncStatus.lastSync = new Date();
}

/**
 * Stop watching for file changes
 */
export async function stopWatching(): Promise<void> {
  if (watcher) {
    await watcher.close();
    watcher = null;
    syncStatus.isWatching = false;
    console.log('File watcher stopped');
  }
}

/**
 * Handle file change event
 */
function handleFileChange(type: FileChangeType, filePath: string): void {
  // Only process markdown files
  if (!filePath.endsWith('.md')) {
    return;
  }

  const relativePath = path.relative(markdownDirectory, filePath);
  
  const change: FileChange = {
    type,
    path: filePath,
    relativePath,
    timestamp: new Date(),
  };

  syncStatus.changesDetected++;
  syncStatus.lastSync = new Date();

  console.log(`File ${type}:`, relativePath);

  // Notify all listeners
  changeListeners.forEach(listener => {
    try {
      listener(change);
    } catch (error) {
      console.error('Error in change listener:', error);
    }
  });
}

/**
 * Register a listener for file changes
 */
export function onFileChange(listener: (change: FileChange) => void): () => void {
  changeListeners.push(listener);
  
  // Return unsubscribe function
  return () => {
    changeListeners = changeListeners.filter(l => l !== listener);
  };
}

/**
 * Get current sync status
 */
export function getSyncStatus(): SyncStatus {
  return { ...syncStatus };
}

/**
 * Check if file has conflicts (modified both externally and internally)
 */
export function detectConflict(
  filePath: string,
  lastKnownMtime: Date
): boolean {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    const stats = fs.statSync(filePath);
    const currentMtime = stats.mtime;

    // If file was modified after our last known modification time
    // and we also have pending changes, it's a conflict
    return currentMtime > lastKnownMtime;
  } catch (error) {
    console.error('Error detecting conflict:', error);
    return false;
  }
}

/**
 * Resolve conflict by creating a backup
 */
export function resolveConflict(
  filePath: string,
  conflictResolutionStrategy: 'keep-external' | 'keep-internal' | 'create-backup'
): boolean {
  try {
    if (conflictResolutionStrategy === 'create-backup') {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = filePath.replace('.md', `.conflict-${timestamp}.md`);
      
      fs.copyFileSync(filePath, backupPath);
      console.log('Conflict backup created:', backupPath);
      
      syncStatus.conflictsResolved++;
      return true;
    }
    
    // For 'keep-external' we don't need to do anything
    // For 'keep-internal' the caller should overwrite the file
    
    syncStatus.conflictsResolved++;
    return true;
  } catch (error) {
    console.error('Error resolving conflict:', error);
    return false;
  }
}

/**
 * Get list of all files in markdown directory
 */
export function listMarkdownFiles(): string[] {
  const files: string[] = [];
  
  function walkDir(dir: string) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      // Skip hidden files and sentinel config files
      if (item.startsWith('.') || item.startsWith('.sentiment-')) {
        return;
      }
      
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (item.endsWith('.md')) {
        const relativePath = path.relative(markdownDirectory, fullPath);
        files.push(relativePath);
      }
    });
  }
  
  if (fs.existsSync(markdownDirectory)) {
    walkDir(markdownDirectory);
  }
  
  return files;
}

/**
 * Watch for changes and trigger cache invalidation
 */
export function setupCacheInvalidation(invalidateCache: () => void): () => void {
  return onFileChange(() => {
    // Debounce cache invalidation
    setTimeout(() => {
      invalidateCache();
    }, 100);
  });
}

/**
 * Initialize file watcher if not already running
 */
export function ensureWatcherRunning(): void {
  if (!watcher) {
    startWatching();
  }
}

/**
 * Get modification time for a file
 */
export function getFileMtime(filePath: string): Date | null {
  try {
    const fullPath = path.join(markdownDirectory, filePath);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    const stats = fs.statSync(fullPath);
    return stats.mtime;
  } catch (error) {
    console.error('Error getting file mtime:', error);
    return null;
  }
}

/**
 * Export file watcher stats for monitoring
 */
export function getWatcherStats() {
  return {
    ...syncStatus,
    listenersCount: changeListeners.length,
    watchedDirectory: markdownDirectory,
  };
}
