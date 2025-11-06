'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { GraphData, GraphNode } from '@/lib/graph';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface GraphVisualizationProps {
  graphData: GraphData;
  height?: number;
}

export default function GraphVisualization({ graphData, height = 600 }: GraphVisualizationProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set<string>());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const graphRef = useRef<any>(null);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node as GraphNode);
  }, []);

  const handleNodeHover = useCallback((node: any) => {
    setHoverNode(node as GraphNode);
    
    if (node) {
      // Highlight connected nodes and links
      const neighbors = new Set<string>();
      const links = new Set();
      
      graphData.edges.forEach(edge => {
        if (edge.source === node.id) {
          neighbors.add(edge.target);
          links.add(edge);
        } else if (edge.target === node.id) {
          neighbors.add(edge.source);
          links.add(edge);
        }
      });
      
      neighbors.add(node.id);
      setHighlightNodes(neighbors);
      setHighlightLinks(links);
    } else {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }
  }, [graphData.edges]);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;
    
    // Node circle
    const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(node.id);
    ctx.fillStyle = isHighlighted ? node.color : '#e2e8f0';
    ctx.globalAlpha = isHighlighted ? 1 : 0.3;
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.size / 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Label
    if (isHighlighted) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#1e293b';
      ctx.globalAlpha = 1;
      ctx.fillText(label, node.x, node.y + node.size / 2 + fontSize + 2);
    }
    
    ctx.globalAlpha = 1;
  }, [highlightNodes]);

  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const isHighlighted = highlightLinks.size === 0 || highlightLinks.has(link);
    
    ctx.strokeStyle = isHighlighted ? 
      (link.type === 'wikilink' ? '#3b82f6' : '#94a3b8') : 
      '#e2e8f0';
    ctx.globalAlpha = isHighlighted ? 0.6 : 0.1;
    ctx.lineWidth = isHighlighted ? 2 : 1;
    
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.stroke();
    
    ctx.globalAlpha = 1;
  }, [highlightLinks]);

  return (
    <div className="relative">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <ForceGraph2D
          ref={graphRef}
          graphData={{ nodes: graphData.nodes, links: graphData.edges }}
          nodeId="id"
          nodeLabel="label"
          nodeVal="size"
          linkSource="source"
          linkTarget="target"
          width={typeof window !== 'undefined' ? window.innerWidth - 100 : 1200}
          height={height}
          backgroundColor="#ffffff"
          nodeCanvasObject={paintNode}
          linkCanvasObject={paintLink}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          cooldownTicks={100}
          onEngineStop={() => graphRef.current?.zoomToFit(400)}
        />
      </div>

      {/* Node Info Panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-lg max-w-xs">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {selectedNode.label}
            </h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-2 mb-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Connections:</span> {selectedNode.linkCount}
            </div>
            {selectedNode.tags.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tags:</div>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Link
            href={`/file/${selectedNode.slug}`}
            className="block w-full px-4 py-2 text-sm font-medium text-center bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Open Note
          </Link>
        </div>
      )}

      {/* Hover Info */}
      {hoverNode && !selectedNode && (
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-lg text-sm">
          <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
            {hoverNode.label}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {hoverNode.linkCount} connection{hoverNode.linkCount !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-lg text-xs">
        <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Legend</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Hub (5+ connections)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Well-connected (3-5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Connected (1-2)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span className="text-gray-700 dark:text-gray-300">Isolated</span>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 my-1.5"></div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Wikilink</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gray-400"></div>
            <span className="text-gray-700 dark:text-gray-300">Tag relation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
