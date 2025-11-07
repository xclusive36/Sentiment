import fs from 'fs';
import path from 'path';

const STATS_FILE = path.join(process.cwd(), 'markdown', '.sentiment-stats.json');

export interface FileAccessStats {
  path: string;
  accessCount: number;
  lastAccessed: string;
  firstAccessed: string;
}

export interface StatsData {
  fileAccess: Record<string, FileAccessStats>;
  lastUpdated: string;
}

/**
 * Load statistics from disk
 */
export function loadStats(): StatsData {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const content = fs.readFileSync(STATS_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
  
  return {
    fileAccess: {},
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Save statistics to disk
 */
export function saveStats(stats: StatsData): void {
  try {
    const dir = path.dirname(STATS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    stats.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving stats:', error);
  }
}

/**
 * Record a file access
 */
export function recordFileAccess(filePath: string): void {
  const stats = loadStats();
  const now = new Date().toISOString();
  
  if (stats.fileAccess[filePath]) {
    stats.fileAccess[filePath].accessCount++;
    stats.fileAccess[filePath].lastAccessed = now;
  } else {
    stats.fileAccess[filePath] = {
      path: filePath,
      accessCount: 1,
      lastAccessed: now,
      firstAccessed: now,
    };
  }
  
  saveStats(stats);
}

/**
 * Get recently accessed files
 */
export function getRecentlyAccessed(limit: number = 10): FileAccessStats[] {
  const stats = loadStats();
  
  return Object.values(stats.fileAccess)
    .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
    .slice(0, limit);
}

/**
 * Get frequently accessed files
 */
export function getFrequentlyAccessed(limit: number = 10): FileAccessStats[] {
  const stats = loadStats();
  
  return Object.values(stats.fileAccess)
    .sort((a, b) => b.accessCount - a.accessCount)
    .slice(0, limit);
}

/**
 * Get statistics for a specific file
 */
export function getFileStats(filePath: string): FileAccessStats | null {
  const stats = loadStats();
  return stats.fileAccess[filePath] || null;
}

/**
 * Clear all statistics
 */
export function clearStats(): void {
  const stats: StatsData = {
    fileAccess: {},
    lastUpdated: new Date().toISOString(),
  };
  saveStats(stats);
}

/**
 * Get total access count
 */
export function getTotalAccesses(): number {
  const stats = loadStats();
  return Object.values(stats.fileAccess).reduce((sum, file) => sum + file.accessCount, 0);
}

/**
 * Get most accessed file
 */
export function getMostAccessedFile(): FileAccessStats | null {
  const frequently = getFrequentlyAccessed(1);
  return frequently.length > 0 ? frequently[0] : null;
}

/**
 * Delete stats for a specific file
 */
export function deleteFileStats(filePath: string): void {
  const stats = loadStats();
  
  if (stats.fileAccess[filePath]) {
    delete stats.fileAccess[filePath];
    saveStats(stats);
  }
}

/**
 * Rename file stats (when a file is renamed/moved)
 */
export function renameFileStats(oldPath: string, newPath: string): void {
  const stats = loadStats();
  
  if (stats.fileAccess[oldPath]) {
    // Copy the stats to the new path
    stats.fileAccess[newPath] = {
      ...stats.fileAccess[oldPath],
      path: newPath,
    };
    
    // Delete the old entry
    delete stats.fileAccess[oldPath];
    
    saveStats(stats);
  }
}
