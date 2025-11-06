import { getAllMarkdownFiles, FileData } from './files';

export interface BlockReference {
  blockId: string;
  content: string;
  fileSlug: string;
  fileTitle: string;
  lineNumber: number;
}

export interface TransclusionMatch {
  original: string;
  fileSlug: string;
  blockId?: string;
  isFullFile: boolean;
}

/**
 * Parse block references from markdown content
 * Format: ^block-id at the end of a line or block
 */
export function extractBlockReferences(content: string, fileSlug: string, fileTitle: string): BlockReference[] {
  const blocks: BlockReference[] = [];
  const lines = content.split('\n');
  
  let currentBlock = '';
  let currentBlockStart = 0;
  
  lines.forEach((line, index) => {
    const blockIdMatch = line.match(/\^([a-zA-Z0-9-_]+)\s*$/);
    
    if (blockIdMatch) {
      const blockId = blockIdMatch[1];
      // Remove the block ID marker from the content
      const cleanLine = line.replace(/\s*\^[a-zA-Z0-9-_]+\s*$/, '');
      currentBlock += cleanLine;
      
      blocks.push({
        blockId,
        content: currentBlock.trim(),
        fileSlug,
        fileTitle,
        lineNumber: currentBlockStart + 1,
      });
      
      currentBlock = '';
      currentBlockStart = index + 1;
    } else if (line.trim() === '') {
      // Empty line resets the current block
      currentBlock = '';
      currentBlockStart = index + 1;
    } else {
      currentBlock += line + '\n';
    }
  });
  
  return blocks;
}

/**
 * Build a global index of all block references
 */
export function buildBlockIndex(): Map<string, BlockReference> {
  const index = new Map<string, BlockReference>();
  const structure = getAllMarkdownFiles();
  
  const processFiles = (files: FileData[]) => {
    files.forEach(file => {
      const blocks = extractBlockReferences(file.content, file.slug, file.title);
      blocks.forEach(block => {
        const key = `${file.slug}#${block.blockId}`;
        index.set(key, block);
      });
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
  
  return index;
}

/**
 * Find transclusion patterns in content
 * Formats:
 * - ![[filename]] - embed entire file
 * - ![[filename#block-id]] - embed specific block
 */
export function findTransclusions(content: string): TransclusionMatch[] {
  const pattern = /!\[\[([^\]#]+)(?:#([^\]]+))?\]\]/g;
  const matches: TransclusionMatch[] = [];
  
  let match;
  while ((match = pattern.exec(content)) !== null) {
    matches.push({
      original: match[0],
      fileSlug: match[1].trim(),
      blockId: match[2]?.trim(),
      isFullFile: !match[2],
    });
  }
  
  return matches;
}

/**
 * Resolve a single block reference
 */
export function resolveBlockReference(fileSlug: string, blockId: string): BlockReference | null {
  const index = buildBlockIndex();
  const key = `${fileSlug}#${blockId}`;
  return index.get(key) || null;
}

/**
 * Get all blocks from a file
 */
export function getFileBlocks(fileSlug: string, content: string, title: string): BlockReference[] {
  return extractBlockReferences(content, fileSlug, title);
}

/**
 * Process transclusions in content
 * Replaces transclusion syntax with actual content
 */
export function processTransclusions(content: string): string {
  const transclusions = findTransclusions(content);
  let processedContent = content;
  
  const structure = getAllMarkdownFiles();
  const fileMap = new Map<string, FileData>();
  
  const collectFiles = (files: FileData[]) => {
    files.forEach(file => fileMap.set(file.slug, file));
  };
  
  const collectFromFolders = (folders: typeof structure.folders) => {
    folders.forEach(folder => {
      collectFiles(folder.files);
      collectFromFolders(folder.subfolders);
    });
  };
  
  collectFiles(structure.files);
  collectFromFolders(structure.folders);
  
  transclusions.forEach(trans => {
    const file = fileMap.get(trans.fileSlug);
    if (!file) {
      return;
    }
    
    let replacementContent = '';
    
    if (trans.isFullFile) {
      // Embed entire file
      replacementContent = `> **Transcluded from: [[${file.title}]]**\n>\n${file.content.split('\n').map(line => `> ${line}`).join('\n')}`;
    } else if (trans.blockId) {
      // Embed specific block
      const block = resolveBlockReference(trans.fileSlug, trans.blockId);
      if (block) {
        replacementContent = `> **Block from: [[${file.title}]]**\n>\n${block.content.split('\n').map(line => `> ${line}`).join('\n')}`;
      }
    }
    
    processedContent = processedContent.replace(trans.original, replacementContent);
  });
  
  return processedContent;
}

/**
 * Get all files that reference a specific block
 */
export function getBlockReferences(fileSlug: string, blockId: string): Array<{
  fileSlug: string;
  fileTitle: string;
  count: number;
}> {
  const structure = getAllMarkdownFiles();
  const references: Map<string, { fileTitle: string; count: number }> = new Map();
  
  const pattern = new RegExp(`!\\[\\[${fileSlug}#${blockId}\\]\\]`, 'g');
  
  const checkFiles = (files: FileData[]) => {
    files.forEach(file => {
      const matches = file.content.match(pattern);
      if (matches && matches.length > 0) {
        references.set(file.slug, {
          fileTitle: file.title,
          count: matches.length,
        });
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
  
  return Array.from(references.entries()).map(([slug, data]) => ({
    fileSlug: slug,
    fileTitle: data.fileTitle,
    count: data.count,
  }));
}

/**
 * Get all transclusions in a file (what this file embeds)
 */
export function getFileTransclusions(content: string): Array<{
  fileSlug: string;
  blockId?: string;
  isFullFile: boolean;
}> {
  const transclusions = findTransclusions(content);
  return transclusions.map(trans => ({
    fileSlug: trans.fileSlug,
    blockId: trans.blockId,
    isFullFile: trans.isFullFile,
  }));
}

/**
 * Validate block ID format
 */
export function isValidBlockId(blockId: string): boolean {
  return /^[a-zA-Z0-9-_]+$/.test(blockId);
}

/**
 * Generate a random block ID
 */
export function generateBlockId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Check if content contains any transclusions
 */
export function hasTransclusions(content: string): boolean {
  return /!\[\[[^\]]+\]\]/.test(content);
}
