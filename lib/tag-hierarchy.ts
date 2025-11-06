import { FileStructure } from './files';

export interface TagNode {
  name: string;
  fullPath: string;
  parent: TagNode | null;
  children: TagNode[];
  fileCount: number;
  level: number;
}

/**
 * Parse a tag into its hierarchical parts
 * Example: "project/work/client-a" => ["project", "work", "client-a"]
 */
export function parseTagPath(tag: string): string[] {
  return tag.split('/').filter(part => part.trim().length > 0);
}

/**
 * Build a tag hierarchy tree from flat tag list
 */
export function buildTagHierarchy(tags: string[], tagCounts: Map<string, number>): TagNode[] {
  const rootNodes: TagNode[] = [];
  const nodeMap = new Map<string, TagNode>();
  
  // Sort tags to ensure parents are processed before children
  const sortedTags = [...tags].sort();
  
  sortedTags.forEach(tag => {
    const parts = parseTagPath(tag);
    let currentPath = '';
    let parentNode: TagNode | null = null;
    
    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      if (!nodeMap.has(currentPath)) {
        const node: TagNode = {
          name: part,
          fullPath: currentPath,
          parent: parentNode,
          children: [],
          fileCount: tagCounts.get(currentPath) || 0,
          level: index,
        };
        
        nodeMap.set(currentPath, node);
        
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          rootNodes.push(node);
        }
      }
      
      parentNode = nodeMap.get(currentPath) || null;
    });
  });
  
  return rootNodes;
}

/**
 * Get all tags from a file structure with their counts
 */
export function getTagCounts(structure: FileStructure): Map<string, number> {
  const tagCounts = new Map<string, number>();
  
  const countTags = (tags: string[]) => {
    tags.forEach(tag => {
      // Count the tag itself
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      
      // Count all parent tags
      const parts = parseTagPath(tag);
      let currentPath = '';
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
        if (currentPath !== tag) {
          tagCounts.set(currentPath, (tagCounts.get(currentPath) || 0) + 1);
        }
      }
    });
  };
  
  const processFiles = (files: typeof structure.files) => {
    files.forEach(file => countTags(file.tags));
  };
  
  const processFolders = (folders: typeof structure.folders) => {
    folders.forEach(folder => {
      processFiles(folder.files);
      processFolders(folder.subfolders);
    });
  };
  
  processFiles(structure.files);
  processFolders(structure.folders);
  
  return tagCounts;
}

/**
 * Get all descendant tags for a given tag
 * Example: "project" => ["project/work", "project/work/client-a", "project/personal"]
 */
export function getDescendantTags(tag: string, allTags: string[]): string[] {
  const prefix = tag + '/';
  return allTags.filter(t => t.startsWith(prefix));
}

/**
 * Get parent tag
 * Example: "project/work/client-a" => "project/work"
 */
export function getParentTag(tag: string): string | null {
  const parts = parseTagPath(tag);
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join('/');
}

/**
 * Get all ancestor tags
 * Example: "project/work/client-a" => ["project", "project/work"]
 */
export function getAncestorTags(tag: string): string[] {
  const parts = parseTagPath(tag);
  const ancestors: string[] = [];
  
  for (let i = 1; i < parts.length; i++) {
    ancestors.push(parts.slice(0, i).join('/'));
  }
  
  return ancestors;
}

/**
 * Check if a tag is a child of another tag
 */
export function isChildOf(childTag: string, parentTag: string): boolean {
  return childTag.startsWith(parentTag + '/');
}

/**
 * Get the depth/level of a tag
 * Example: "project" => 1, "project/work" => 2, "project/work/client-a" => 3
 */
export function getTagLevel(tag: string): number {
  return parseTagPath(tag).length;
}

/**
 * Get all leaf tags (tags with no children)
 */
export function getLeafTags(allTags: string[]): string[] {
  const tagSet = new Set(allTags);
  return allTags.filter(tag => {
    const descendants = getDescendantTags(tag, allTags);
    return descendants.length === 0;
  });
}

/**
 * Get all root tags (tags with no parent)
 */
export function getRootTags(allTags: string[]): string[] {
  return allTags.filter(tag => getTagLevel(tag) === 1);
}

/**
 * Flatten tag hierarchy to a list with indentation info
 */
export function flattenTagHierarchy(nodes: TagNode[]): TagNode[] {
  const result: TagNode[] = [];
  
  const traverse = (node: TagNode) => {
    result.push(node);
    node.children.forEach(child => traverse(child));
  };
  
  nodes.forEach(node => traverse(node));
  return result;
}

/**
 * Search tags by partial match
 */
export function searchTags(query: string, allTags: string[]): string[] {
  const queryLower = query.toLowerCase();
  return allTags.filter(tag => tag.toLowerCase().includes(queryLower));
}

/**
 * Get suggested child tag names based on existing patterns
 */
export function suggestChildTags(parentTag: string, allTags: string[]): string[] {
  const children = allTags.filter(tag => {
    const parent = getParentTag(tag);
    return parent === parentTag;
  });
  
  return children.map(tag => parseTagPath(tag).pop() || '');
}

/**
 * Normalize tag path (remove empty parts, trim)
 */
export function normalizeTag(tag: string): string {
  return parseTagPath(tag).join('/');
}

/**
 * Check if a tag path is valid
 */
export function isValidTag(tag: string): boolean {
  if (!tag || tag.trim().length === 0) return false;
  if (tag.startsWith('/') || tag.endsWith('/')) return false;
  if (tag.includes('//')) return false;
  return true;
}
