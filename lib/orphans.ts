import { FileData, FileStructure } from './files';
import { extractWikiLinks, findBacklinks } from './wikilinks';

export interface OrphanInfo {
  file: FileData;
  outgoingLinks: number;
  incomingLinks: number;
  connectionScore: number; // 0-100, higher is more connected
}

/**
 * Check if a file is an orphan (no incoming or outgoing links)
 */
export function isOrphan(file: FileData, structure: FileStructure): boolean {
  const outgoingLinks = extractWikiLinks(file.content);
  const incomingLinks = findBacklinks(file.relativePath, structure);
  
  return outgoingLinks.length === 0 && incomingLinks.length === 0;
}

/**
 * Calculate connection score for a file (0-100)
 * Higher score means more connected
 */
export function calculateConnectionScore(file: FileData, structure: FileStructure): number {
  const outgoingLinks = extractWikiLinks(file.content);
  const incomingLinks = findBacklinks(file.relativePath, structure);
  
  const totalLinks = outgoingLinks.length + incomingLinks.length;
  
  // Score based on number of links
  // 0 links = 0 score
  // 1 link = 20 score
  // 5 links = 60 score
  // 10+ links = 100 score
  
  if (totalLinks === 0) return 0;
  if (totalLinks >= 10) return 100;
  
  return Math.min(100, totalLinks * 10);
}

/**
 * Find all orphan files
 */
export function findOrphans(structure: FileStructure): OrphanInfo[] {
  const orphans: OrphanInfo[] = [];
  
  const checkFile = (file: FileData) => {
    const outgoingLinks = extractWikiLinks(file.content);
    const incomingLinks = findBacklinks(file.relativePath, structure);
    
    if (outgoingLinks.length === 0 && incomingLinks.length === 0) {
      orphans.push({
        file,
        outgoingLinks: 0,
        incomingLinks: 0,
        connectionScore: 0,
      });
    }
  };
  
  const processFiles = (files: FileData[]) => {
    files.forEach(checkFile);
  };
  
  const processFolders = (folders: typeof structure.folders) => {
    folders.forEach(folder => {
      processFiles(folder.files);
      processFolders(folder.subfolders);
    });
  };
  
  processFiles(structure.files);
  processFolders(structure.folders);
  
  return orphans;
}

/**
 * Find weakly connected files (few links)
 */
export function findWeaklyConnected(structure: FileStructure, threshold: number = 2): OrphanInfo[] {
  const weakFiles: OrphanInfo[] = [];
  
  const checkFile = (file: FileData) => {
    const outgoingLinks = extractWikiLinks(file.content);
    const incomingLinks = findBacklinks(file.relativePath, structure);
    const totalLinks = outgoingLinks.length + incomingLinks.length;
    
    if (totalLinks > 0 && totalLinks <= threshold) {
      weakFiles.push({
        file,
        outgoingLinks: outgoingLinks.length,
        incomingLinks: incomingLinks.length,
        connectionScore: calculateConnectionScore(file, structure),
      });
    }
  };
  
  const processFiles = (files: FileData[]) => {
    files.forEach(checkFile);
  };
  
  const processFolders = (folders: typeof structure.folders) => {
    folders.forEach(folder => {
      processFiles(folder.files);
      processFolders(folder.subfolders);
    });
  };
  
  processFiles(structure.files);
  processFolders(structure.folders);
  
  return weakFiles.sort((a, b) => a.connectionScore - b.connectionScore);
}

/**
 * Get connection info for all files
 */
export function getAllConnectionInfo(structure: FileStructure): OrphanInfo[] {
  const allFiles: OrphanInfo[] = [];
  
  const checkFile = (file: FileData) => {
    const outgoingLinks = extractWikiLinks(file.content);
    const incomingLinks = findBacklinks(file.relativePath, structure);
    
    allFiles.push({
      file,
      outgoingLinks: outgoingLinks.length,
      incomingLinks: incomingLinks.length,
      connectionScore: calculateConnectionScore(file, structure),
    });
  };
  
  const processFiles = (files: FileData[]) => {
    files.forEach(checkFile);
  };
  
  const processFolders = (folders: typeof structure.folders) => {
    folders.forEach(folder => {
      processFiles(folder.files);
      processFolders(folder.subfolders);
    });
  };
  
  processFiles(structure.files);
  processFolders(structure.folders);
  
  return allFiles.sort((a, b) => a.connectionScore - b.connectionScore);
}

/**
 * Get most connected files
 */
export function getMostConnected(structure: FileStructure, limit: number = 10): OrphanInfo[] {
  const allFiles = getAllConnectionInfo(structure);
  return allFiles
    .sort((a, b) => b.connectionScore - a.connectionScore)
    .slice(0, limit);
}

/**
 * Get hub files (files with many outgoing links)
 */
export function getHubFiles(structure: FileStructure, limit: number = 10): OrphanInfo[] {
  const allFiles = getAllConnectionInfo(structure);
  return allFiles
    .sort((a, b) => b.outgoingLinks - a.outgoingLinks)
    .slice(0, limit);
}

/**
 * Get authority files (files with many incoming links)
 */
export function getAuthorityFiles(structure: FileStructure, limit: number = 10): OrphanInfo[] {
  const allFiles = getAllConnectionInfo(structure);
  return allFiles
    .sort((a, b) => b.incomingLinks - a.incomingLinks)
    .slice(0, limit);
}
