'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { TagNode, flattenTagHierarchy } from '@/lib/tag-hierarchy';

interface TagBrowserProps {
  tagHierarchy: TagNode[];
  selectedTag?: string;
}

export default function TagBrowser({ tagHierarchy, selectedTag }: TagBrowserProps) {
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten hierarchy for rendering
  const flatTags = useMemo(() => flattenTagHierarchy(tagHierarchy), [tagHierarchy]);

  // Filter tags by search query
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return flatTags;
    const query = searchQuery.toLowerCase();
    return flatTags.filter(tag => tag.fullPath.toLowerCase().includes(query));
  }, [flatTags, searchQuery]);

  const toggleExpand = (tagPath: string) => {
    setExpandedTags(prev => {
      const next = new Set(prev);
      if (next.has(tagPath)) {
        next.delete(tagPath);
      } else {
        next.add(tagPath);
      }
      return next;
    });
  };

  const isExpanded = (tagPath: string) => expandedTags.has(tagPath);

  const hasChildren = (node: TagNode) => node.children.length > 0;

  // Auto-expand selected tag's ancestors
  React.useEffect(() => {
    if (selectedTag) {
      const parts = selectedTag.split('/');
      const ancestors = new Set<string>();
      for (let i = 1; i < parts.length; i++) {
        ancestors.add(parts.slice(0, i).join('/'));
      }
      setExpandedTags(prev => new Set([...prev, ...ancestors]));
    }
  }, [selectedTag]);

  const renderTag = (node: TagNode) => {
    const expanded = isExpanded(node.fullPath);
    const hasKids = hasChildren(node);
    const isSelected = selectedTag === node.fullPath;
    const showChildren = expanded && hasKids;

    return (
      <div key={node.fullPath} className="select-none">
        <div
          className={`flex items-center py-1.5 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : ''
          }`}
          style={{ paddingLeft: `${node.level * 16 + 8}px` }}
        >
          {hasKids && (
            <button
              onClick={() => toggleExpand(node.fullPath)}
              className="mr-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}
          {!hasKids && <span className="w-5" />}
          
          <Link
            href={`/tags/${encodeURIComponent(node.fullPath)}`}
            className="flex-1 flex items-center justify-between group"
          >
            <span className={`text-sm ${isSelected ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'} group-hover:text-blue-600 dark:group-hover:text-blue-400`}>
              #{node.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {node.fileCount}
            </span>
          </Link>
        </div>
        
        {showChildren && (
          <div>
            {node.children.map(child => renderTag(child))}
          </div>
        )}
      </div>
    );
  };

  const expandAll = () => {
    const allPaths = new Set(flatTags.filter(t => hasChildren(t)).map(t => t.fullPath));
    setExpandedTags(allPaths);
  };

  const collapseAll = () => {
    setExpandedTags(new Set());
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-xs">
        <span className="text-gray-600 dark:text-gray-400">
          {filteredTags.length} tag{filteredTags.length !== 1 ? 's' : ''}
        </span>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Expand All
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={collapseAll}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Tag Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredTags.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            No tags found
          </div>
        ) : (
          tagHierarchy.map(node => renderTag(node))
        )}
      </div>
    </div>
  );
}
