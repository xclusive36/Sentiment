import { FileData, FileStructure } from './files';

/**
 * Find file by title or any of its aliases
 */
export function findFileByTitleOrAlias(
  searchTerm: string,
  structure: FileStructure
): FileData | null {
  const searchLower = searchTerm.toLowerCase().trim();
  
  const searchFiles = (files: FileData[]): FileData | null => {
    for (const file of files) {
      // Check title
      if (file.title.toLowerCase() === searchLower) {
        return file;
      }
      
      // Check slug/filename
      if (file.slug.toLowerCase() === searchLower) {
        return file;
      }
      
      // Check aliases
      if (file.aliases) {
        for (const alias of file.aliases) {
          if (alias.toLowerCase() === searchLower) {
            return file;
          }
        }
      }
    }
    return null;
  };
  
  const searchFolders = (folders: typeof structure.folders): FileData | null => {
    for (const folder of folders) {
      const found = searchFiles(folder.files) || searchFolders(folder.subfolders);
      if (found) return found;
    }
    return null;
  };
  
  return searchFiles(structure.files) || searchFolders(structure.folders);
}

/**
 * Get all aliases across all files
 */
export function getAllAliases(structure: FileStructure): Map<string, FileData> {
  const aliasMap = new Map<string, FileData>();
  
  const collectAliases = (files: FileData[]) => {
    files.forEach(file => {
      // Add title as alias
      aliasMap.set(file.title.toLowerCase(), file);
      
      // Add slug as alias
      aliasMap.set(file.slug.toLowerCase(), file);
      
      // Add all explicit aliases
      file.aliases?.forEach(alias => {
        aliasMap.set(alias.toLowerCase(), file);
      });
    });
  };
  
  const collectFromFolders = (folders: typeof structure.folders) => {
    folders.forEach(folder => {
      collectAliases(folder.files);
      collectFromFolders(folder.subfolders);
    });
  };
  
  collectAliases(structure.files);
  collectFromFolders(structure.folders);
  
  return aliasMap;
}

/**
 * Check if an alias already exists
 */
export function aliasExists(alias: string, structure: FileStructure): boolean {
  const aliasMap = getAllAliases(structure);
  return aliasMap.has(alias.toLowerCase());
}

/**
 * Get all files that use a specific alias
 */
export function getFilesWithAlias(alias: string, structure: FileStructure): FileData[] {
  const results: FileData[] = [];
  const aliasLower = alias.toLowerCase();
  
  const checkFiles = (files: FileData[]) => {
    files.forEach(file => {
      if (file.aliases?.some(a => a.toLowerCase() === aliasLower)) {
        results.push(file);
      }
    });
  };
  
  const checkFolders = (folders: typeof structure.folders) => {
    folders.forEach(folder => {
      checkFiles(folder.files);
      checkFolders(folder.subfolders);
    });
  };
  
  checkFiles(structure.files);
  checkFolders(structure.folders);
  
  return results;
}

/**
 * Suggest aliases for a file based on content
 */
export function suggestAliases(file: FileData): string[] {
  const suggestions: string[] = [];
  
  // Add filename variations
  const slug = file.slug;
  
  // Add acronym if title has multiple words
  const words = file.title.split(/\s+/);
  if (words.length > 1 && words.length <= 5) {
    const acronym = words
      .filter(w => w.length > 0 && /^[A-Z]/.test(w))
      .map(w => w[0].toUpperCase())
      .join('');
    if (acronym.length >= 2 && acronym.length <= 5) {
      suggestions.push(acronym);
    }
  }
  
  // Add common variations
  const titleLower = file.title.toLowerCase();
  
  // Singular/plural variations
  if (titleLower.endsWith('s')) {
    suggestions.push(file.title.slice(0, -1)); // Remove 's'
  } else {
    suggestions.push(file.title + 's'); // Add 's'
  }
  
  // Remove "The" prefix if present
  if (titleLower.startsWith('the ')) {
    suggestions.push(file.title.substring(4));
  }
  
  // Hyphenated to space
  if (slug.includes('-')) {
    suggestions.push(slug.replace(/-/g, ' '));
  }
  
  // Deduplicate and return
  return [...new Set(suggestions)].filter(s => s !== file.title);
}

/**
 * Validate alias format
 */
export function isValidAlias(alias: string): boolean {
  // Alias must be non-empty, no special wiki-link characters
  if (!alias || alias.trim().length === 0) return false;
  if (alias.includes('[[') || alias.includes(']]')) return false;
  if (alias.includes('|')) return false;
  return true;
}
