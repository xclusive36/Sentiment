import fs from 'fs';
import path from 'path';
import { FileData, FileStructure } from './files';

const SEARCHES_FILE = path.join(process.cwd(), 'markdown', '.sentiment-searches.json');

export interface SearchFilter {
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  folders?: string[];
  content?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilter;
  color?: string;
  icon?: string;
  pinned: boolean;
  createdAt: string;
  lastUsed?: string;
}

export interface SavedSearchesData {
  searches: Record<string, SavedSearch>;
  lastUpdated: string;
}

/**
 * Load saved searches from disk
 */
export function loadSavedSearches(): SavedSearchesData {
  try {
    if (fs.existsSync(SEARCHES_FILE)) {
      const content = fs.readFileSync(SEARCHES_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error loading saved searches:', error);
  }
  
  return {
    searches: {},
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Save searches to disk
 */
export function saveSavedSearches(data: SavedSearchesData): void {
  try {
    const dir = path.dirname(SEARCHES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(SEARCHES_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving searches:', error);
  }
}

/**
 * Create a new saved search
 */
export function createSavedSearch(
  name: string,
  query: string,
  filters: SearchFilter,
  options?: { color?: string; icon?: string; pinned?: boolean }
): SavedSearch {
  const data = loadSavedSearches();
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  const search: SavedSearch = {
    id,
    name,
    query,
    filters,
    color: options?.color || '#3B82F6',
    icon: options?.icon || '🔍',
    pinned: options?.pinned || false,
    createdAt: new Date().toISOString(),
  };
  
  data.searches[id] = search;
  saveSavedSearches(data);
  
  return search;
}

/**
 * Update a saved search
 */
export function updateSavedSearch(
  id: string,
  updates: Partial<Omit<SavedSearch, 'id' | 'createdAt'>>
): SavedSearch | null {
  const data = loadSavedSearches();
  
  if (!data.searches[id]) {
    return null;
  }
  
  data.searches[id] = {
    ...data.searches[id],
    ...updates,
  };
  
  saveSavedSearches(data);
  return data.searches[id];
}

/**
 * Delete a saved search
 */
export function deleteSavedSearch(id: string): boolean {
  const data = loadSavedSearches();
  
  if (!data.searches[id]) {
    return false;
  }
  
  delete data.searches[id];
  saveSavedSearches(data);
  return true;
}

/**
 * Get all saved searches
 */
export function getAllSavedSearches(): SavedSearch[] {
  const data = loadSavedSearches();
  return Object.values(data.searches).sort((a, b) => {
    // Pinned searches first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    // Then by creation date
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Get a saved search by ID
 */
export function getSavedSearch(id: string): SavedSearch | null {
  const data = loadSavedSearches();
  return data.searches[id] || null;
}

/**
 * Execute a saved search
 */
export function executeSavedSearch(
  search: SavedSearch,
  structure: FileStructure
): FileData[] {
  const results: FileData[] = [];
  
  const checkFile = (file: FileData): boolean => {
    // Check query match
    if (search.query) {
      const queryLower = search.query.toLowerCase();
      const titleMatch = file.title.toLowerCase().includes(queryLower);
      const contentMatch = file.content.toLowerCase().includes(queryLower);
      const tagMatch = file.tags.some(tag => tag.toLowerCase().includes(queryLower));
      
      if (!titleMatch && !contentMatch && !tagMatch) {
        return false;
      }
    }
    
    // Check tag filters
    if (search.filters.tags && search.filters.tags.length > 0) {
      const hasAllTags = search.filters.tags.every(filterTag =>
        file.tags.some(fileTag => fileTag.toLowerCase() === filterTag.toLowerCase())
      );
      if (!hasAllTags) {
        return false;
      }
    }
    
    // Check folder filters
    if (search.filters.folders && search.filters.folders.length > 0) {
      const inFolder = search.filters.folders.some(folder =>
        file.relativePath.toLowerCase().startsWith(folder.toLowerCase())
      );
      if (!inFolder) {
        return false;
      }
    }
    
    // Check date range
    if (search.filters.dateRange) {
      const fileDate = new Date(file.stats.modified);
      const startDate = new Date(search.filters.dateRange.start);
      const endDate = new Date(search.filters.dateRange.end);
      
      if (fileDate < startDate || fileDate > endDate) {
        return false;
      }
    }
    
    // Check content filter
    if (search.filters.content) {
      const contentMatch = file.content.toLowerCase().includes(
        search.filters.content.toLowerCase()
      );
      if (!contentMatch) {
        return false;
      }
    }
    
    return true;
  };
  
  const processFiles = (files: FileData[]) => {
    files.forEach(file => {
      if (checkFile(file)) {
        results.push(file);
      }
    });
  };
  
  const processFolders = (folders: typeof structure.folders) => {
    folders.forEach(folder => {
      processFiles(folder.files);
      processFolders(folder.subfolders);
    });
  };
  
  processFiles(structure.files);
  processFolders(structure.folders);
  
  return results;
}

/**
 * Mark search as used (update lastUsed timestamp)
 */
export function markSearchAsUsed(id: string): void {
  updateSavedSearch(id, {
    lastUsed: new Date().toISOString(),
  });
}

/**
 * Get pinned searches
 */
export function getPinnedSearches(): SavedSearch[] {
  return getAllSavedSearches().filter(s => s.pinned);
}

/**
 * Common search presets
 */
export const SEARCH_PRESETS: Omit<SavedSearch, 'id' | 'createdAt'>[] = [
  {
    name: 'Untagged Files',
    query: '',
    filters: {},
    icon: '🏷️',
    color: '#F59E0B',
    pinned: false,
  },
  {
    name: 'Recent Files',
    query: '',
    filters: {
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
    },
    icon: '⏰',
    color: '#10B981',
    pinned: false,
  },
  {
    name: 'TODO Items',
    query: '',
    filters: {
      content: '- [ ]',
    },
    icon: '✅',
    color: '#8B5CF6',
    pinned: false,
  },
];
