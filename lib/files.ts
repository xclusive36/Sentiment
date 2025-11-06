import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { loadOrder, applyOrder } from './order';

export interface FileData {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  relativePath: string;
  tags: string[];
  aliases: string[];
  stats: {
    size: number;
    created: Date;
    modified: Date;
  };
}

export interface FolderData {
  id: string;
  name: string;
  path: string;
  files: FileData[];
  subfolders: FolderData[];
}

export interface FileStructure {
  files: FileData[];
  folders: FolderData[];
}

const markdownDirectory = path.join(process.cwd(), 'markdown');

function getFileData(filePath: string, relativePath: string): FileData {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  const stats = fs.statSync(filePath);
  const fileName = path.basename(filePath, '.md');
  const excerpt = content.split('\n\n')[0].replace(/[#*`]/g, '').trim();

  // Extract tags from frontmatter
  let tags: string[] = [];
  if (data.tags) {
    if (Array.isArray(data.tags)) {
      tags = data.tags.map(tag => String(tag).trim());
    } else if (typeof data.tags === 'string') {
      tags = data.tags.split(',').map(tag => tag.trim());
    }
  }

  // Extract aliases from frontmatter
  let aliases: string[] = [];
  if (data.aliases) {
    if (Array.isArray(data.aliases)) {
      aliases = data.aliases.map(alias => String(alias).trim());
    } else if (typeof data.aliases === 'string') {
      aliases = data.aliases.split(',').map(alias => alias.trim());
    }
  }

  return {
    id: relativePath,
    slug: fileName,
    title: data.title || fileName,
    content,
    excerpt: excerpt.substring(0, 150) + (excerpt.length > 150 ? '...' : ''),
    relativePath,
    tags,
    aliases,
    stats: {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
    },
  };
}

function readDirectoryRecursive(dirPath: string, baseDir: string): FileStructure {
  const files: FileData[] = [];
  const folders: FolderData[] = [];

  if (!fs.existsSync(dirPath)) {
    return { files, folders };
  }

  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    // Skip order file
    if (item === '.sentiment-order.json') {
      continue;
    }
    
    const fullPath = path.join(dirPath, item);
    const stats = fs.statSync(fullPath);
    const relativePath = path.relative(baseDir, fullPath);

    if (stats.isDirectory()) {
      const subStructure = readDirectoryRecursive(fullPath, baseDir);
      folders.push({
        id: relativePath,
        name: item,
        path: relativePath,
        files: subStructure.files,
        subfolders: subStructure.folders,
      });
    } else if (item.endsWith('.md')) {
      files.push(getFileData(fullPath, relativePath));
    }
  }

  // Apply saved order
  const orderConfig = loadOrder();
  const currentDir = path.relative(baseDir, dirPath) || '';
  const folderOrder = orderConfig[currentDir];
  
  if (folderOrder) {
    const orderedFiles = applyOrder(files, folderOrder.files);
    const orderedFolders = applyOrder(folders, folderOrder.folders);
    return { files: orderedFiles, folders: orderedFolders };
  }

  return { files, folders };
}

export function getAllMarkdownFiles(): FileStructure {
  return readDirectoryRecursive(markdownDirectory, markdownDirectory);
}

export function getAllTags(structure: FileStructure): string[] {
  const tagsSet = new Set<string>();
  
  const collectTags = (files: FileData[]) => {
    files.forEach(file => {
      file.tags.forEach(tag => tagsSet.add(tag));
    });
  };
  
  const collectFromFolders = (folders: FolderData[]) => {
    folders.forEach(folder => {
      collectTags(folder.files);
      collectFromFolders(folder.subfolders);
    });
  };
  
  collectTags(structure.files);
  collectFromFolders(structure.folders);
  
  return Array.from(tagsSet).sort();
}

export function getMarkdownFileByPath(relativePath: string): FileData | null {
  const fullPath = path.join(markdownDirectory, relativePath);
  
  if (!fs.existsSync(fullPath) || !fullPath.endsWith('.md')) {
    return null;
  }

  return getFileData(fullPath, relativePath);
}

export function moveFile(oldPath: string, newPath: string): boolean {
  try {
    const oldFullPath = path.join(markdownDirectory, oldPath);
    const newFullPath = path.join(markdownDirectory, newPath);
    
    // Ensure the target directory exists
    const newDir = path.dirname(newFullPath);
    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir, { recursive: true });
    }
    
    fs.renameSync(oldFullPath, newFullPath);
    return true;
  } catch (error) {
    console.error('Error moving file:', error);
    return false;
  }
}
