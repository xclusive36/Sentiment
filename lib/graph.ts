import { getAllMarkdownFiles, FileData } from './files';

export interface GraphNode {
  id: string;
  label: string;
  slug: string;
  size: number;
  color: string;
  tags: string[];
  linkCount: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'wikilink' | 'backlink' | 'tag';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    isolatedNodes: number;
    mostConnected: { slug: string; title: string; connections: number }[];
  };
}

/**
 * Extract wikilinks from content
 */
function extractWikilinks(content: string): string[] {
  const pattern = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  const links: string[] = [];
  let match;
  
  while ((match = pattern.exec(content)) !== null) {
    links.push(match[1].trim());
  }
  
  return links;
}

/**
 * Normalize slug/filename for matching
 */
function normalizeSlug(slug: string): string {
  return slug.replace(/\.md$/, '').toLowerCase();
}

/**
 * Build a graph from file structure
 */
export function buildGraph(): GraphData {
  const structure = getAllMarkdownFiles();
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const fileMap = new Map<string, FileData>();
  const slugToId = new Map<string, string>();
  
  // Collect all files
  const collectFiles = (files: FileData[]) => {
    files.forEach(file => {
      fileMap.set(file.slug, file);
      slugToId.set(normalizeSlug(file.slug), file.slug);
      slugToId.set(normalizeSlug(file.title), file.slug);
      
      // Also add aliases
      file.aliases?.forEach(alias => {
        slugToId.set(normalizeSlug(alias), file.slug);
      });
    });
  };
  
  const collectFromFolders = (folders: typeof structure.folders) => {
    folders.forEach(folder => {
      collectFiles(folder.files);
      collectFromFolders(folder.subfolders);
    });
  };
  
  collectFiles(structure.files);
  collectFromFolders(structure.folders);
  
  // Build edges from wikilinks
  const connections = new Map<string, Set<string>>();
  
  fileMap.forEach((file, slug) => {
    if (!connections.has(slug)) {
      connections.set(slug, new Set());
    }
    
    const wikilinks = extractWikilinks(file.content);
    
    wikilinks.forEach(link => {
      const normalizedLink = normalizeSlug(link);
      const targetSlug = slugToId.get(normalizedLink);
      
      if (targetSlug && targetSlug !== slug) {
        connections.get(slug)!.add(targetSlug);
        
        edges.push({
          source: slug,
          target: targetSlug,
          type: 'wikilink',
        });
      }
    });
  });
  
  // Build edges from shared tags
  const tagGroups = new Map<string, Set<string>>();
  
  fileMap.forEach((file, slug) => {
    file.tags.forEach(tag => {
      if (!tagGroups.has(tag)) {
        tagGroups.set(tag, new Set());
      }
      tagGroups.get(tag)!.add(slug);
    });
  });
  
  // Add tag-based edges (limit to avoid clutter)
  tagGroups.forEach((slugs, tag) => {
    if (slugs.size > 1 && slugs.size <= 10) {
      const slugArray = Array.from(slugs);
      for (let i = 0; i < slugArray.length; i++) {
        for (let j = i + 1; j < slugArray.length; j++) {
          // Only add if no wikilink already exists
          const hasWikilink = edges.some(
            e => (e.source === slugArray[i] && e.target === slugArray[j]) ||
                 (e.source === slugArray[j] && e.target === slugArray[i])
          );
          
          if (!hasWikilink) {
            edges.push({
              source: slugArray[i],
              target: slugArray[j],
              type: 'tag',
            });
          }
        }
      }
    }
  });
  
  // Create nodes
  fileMap.forEach((file, slug) => {
    const linkCount = connections.get(slug)?.size || 0;
    const incomingLinks = edges.filter(e => e.target === slug).length;
    const totalConnections = linkCount + incomingLinks;
    
    // Size based on connections
    const size = Math.max(10, Math.min(30, 10 + totalConnections * 2));
    
    // Color based on connection count
    let color = '#94a3b8'; // gray (isolated)
    if (totalConnections > 5) {
      color = '#8b5cf6'; // purple (hub)
    } else if (totalConnections > 2) {
      color = '#3b82f6'; // blue (well-connected)
    } else if (totalConnections > 0) {
      color = '#06b6d4'; // cyan (connected)
    }
    
    nodes.push({
      id: slug,
      label: file.title,
      slug,
      size,
      color,
      tags: file.tags,
      linkCount: totalConnections,
    });
  });
  
  // Calculate stats
  const isolatedNodes = nodes.filter(n => n.linkCount === 0).length;
  const mostConnected = nodes
    .sort((a, b) => b.linkCount - a.linkCount)
    .slice(0, 10)
    .map(n => ({
      slug: n.slug,
      title: n.label,
      connections: n.linkCount,
    }));
  
  return {
    nodes,
    edges,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      isolatedNodes,
      mostConnected,
    },
  };
}

/**
 * Get neighbors of a specific node
 */
export function getNeighbors(slug: string, graph: GraphData): GraphNode[] {
  const neighborIds = new Set<string>();
  
  graph.edges.forEach(edge => {
    if (edge.source === slug) {
      neighborIds.add(edge.target);
    } else if (edge.target === slug) {
      neighborIds.add(edge.source);
    }
  });
  
  return graph.nodes.filter(node => neighborIds.has(node.id));
}

/**
 * Get subgraph around a specific node (node + neighbors)
 */
export function getSubgraph(slug: string, graph: GraphData, depth: number = 1): GraphData {
  const includedNodes = new Set<string>([slug]);
  
  // BFS to find nodes within depth
  let currentLayer = [slug];
  for (let i = 0; i < depth; i++) {
    const nextLayer: string[] = [];
    
    currentLayer.forEach(nodeId => {
      graph.edges.forEach(edge => {
        if (edge.source === nodeId && !includedNodes.has(edge.target)) {
          includedNodes.add(edge.target);
          nextLayer.push(edge.target);
        } else if (edge.target === nodeId && !includedNodes.has(edge.source)) {
          includedNodes.add(edge.source);
          nextLayer.push(edge.source);
        }
      });
    });
    
    currentLayer = nextLayer;
  }
  
  const nodes = graph.nodes.filter(n => includedNodes.has(n.id));
  const edges = graph.edges.filter(
    e => includedNodes.has(e.source) && includedNodes.has(e.target)
  );
  
  return {
    nodes,
    edges,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      isolatedNodes: 0,
      mostConnected: [],
    },
  };
}

/**
 * Filter graph by tags
 */
export function filterGraphByTags(graph: GraphData, tags: string[]): GraphData {
  const nodes = graph.nodes.filter(node =>
    tags.some(tag => node.tags.includes(tag))
  );
  
  const nodeIds = new Set(nodes.map(n => n.id));
  const edges = graph.edges.filter(
    e => nodeIds.has(e.source) && nodeIds.has(e.target)
  );
  
  return {
    nodes,
    edges,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      isolatedNodes: 0,
      mostConnected: [],
    },
  };
}

/**
 * Get orphaned nodes (no connections)
 */
export function getOrphanedNodes(graph: GraphData): GraphNode[] {
  return graph.nodes.filter(n => n.linkCount === 0);
}

/**
 * Get hub nodes (highly connected)
 */
export function getHubNodes(graph: GraphData, threshold: number = 3): GraphNode[] {
  return graph.nodes.filter(n => n.linkCount >= threshold);
}
