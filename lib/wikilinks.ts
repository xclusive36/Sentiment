import { FileData, FileStructure } from './files';
import { findFileByTitleOrAlias } from './aliases';

export interface WikiLink {
  text: string;
  target: string;
}

export interface Backlink {
  sourceFile: FileData;
  context: string;
}

// Extract wiki links from markdown content
export function extractWikiLinks(content: string): WikiLink[] {
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  const links: WikiLink[] = [];
  let match;

  while ((match = wikiLinkRegex.exec(content)) !== null) {
    const fullText = match[1];
    const [target, text] = fullText.includes('|') 
      ? fullText.split('|').map(s => s.trim())
      : [fullText.trim(), fullText.trim()];
    
    links.push({ text, target });
  }

  return links;
}

// Find backlinks to a specific file
export function findBacklinks(targetPath: string, structure: FileStructure): Backlink[] {
  const backlinks: Backlink[] = [];
  const targetFileName = targetPath.replace('.md', '').split('/').pop() || '';

  const checkFile = (file: FileData) => {
    const links = extractWikiLinks(file.content);
    
    links.forEach(link => {
      // Match by filename (case-insensitive)
      const linkFileName = link.target.replace('.md', '');
      if (linkFileName.toLowerCase() === targetFileName.toLowerCase()) {
        // Extract context around the link
        const contentLines = file.content.split('\n');
        let context = '';
        
        for (const line of contentLines) {
          if (line.includes(`[[${link.target}]]`)) {
            context = line.trim();
            break;
          }
        }
        
        backlinks.push({
          sourceFile: file,
          context: context || file.excerpt,
        });
      }
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

  return backlinks;
}

// Convert wiki links to actual links in HTML
// Now supports alias resolution
export function renderWikiLinks(content: string, currentPath: string, structure?: FileStructure): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
    const [target, displayText] = linkText.includes('|')
      ? linkText.split('|').map((s: string) => s.trim())
      : [linkText.trim(), linkText.trim()];
    
    // Check if target is a date in YYYY-MM-DD format (daily note)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (datePattern.test(target)) {
      // Link to daily note in journal folder
      return `[${displayText}](/file/${encodeURIComponent(`journal/${target}`)})`;
    }
    
    // Try to resolve via alias if structure is provided
    if (structure) {
      const resolvedFile = findFileByTitleOrAlias(target, structure);
      if (resolvedFile) {
        return `[${displayText}](/file/${encodeURIComponent(resolvedFile.relativePath.replace('.md', ''))})`;
      }
    }
    
    // Fallback: Convert to relative path
    const targetFileName = target.endsWith('.md') ? target : `${target}.md`;
    const currentDir = currentPath.split('/').slice(0, -1).join('/');
    const targetPath = currentDir ? `${currentDir}/${targetFileName}` : targetFileName;
    
    return `[${displayText}](/file/${encodeURIComponent(targetPath)})`;
  });
}

// Find file by name (case-insensitive)
export function findFileByName(fileName: string, structure: FileStructure): FileData | null {
  const searchName = fileName.replace('.md', '').toLowerCase();

  const searchFiles = (files: FileData[]): FileData | null => {
    for (const file of files) {
      const fileBaseName = file.slug.toLowerCase();
      if (fileBaseName === searchName) {
        return file;
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
