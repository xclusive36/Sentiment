'use client';

import React, { useState, useCallback } from 'react';
import { Search, X, Loader2, FileText, TrendingUp } from 'lucide-react';
import { search, type SearchResult } from '@/lib/vector/search';
import { useLoadingState } from '@/hooks/useLoadingState';

export interface VectorSearchProps {
  /** Callback when a result is clicked */
  onResultClick?: (documentId: string) => void;
  /** Minimum similarity threshold (0-1) */
  threshold?: number;
  /** Maximum results to show */
  limit?: number;
  /** Theme for styling */
  theme?: 'light' | 'dark';
}

/**
 * Semantic search interface using vector embeddings
 * Finds documents by meaning rather than exact keywords
 */
export function VectorSearch({
  onResultClick,
  threshold = 0.3,
  limit = 10,
  theme = 'light',
}: VectorSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const { isLoading, execute } = useLoadingState();

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      await execute(async () => {
        const searchResults = await search(searchQuery, {
          threshold,
          limit,
        });
        setResults(searchResults);
      });
    },
    [threshold, limit, execute]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
  };

  const isDark = theme === 'dark';

  return (
    <div className="vector-search w-full max-w-2xl mx-auto">
      {/* Search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className={`w-5 h-5 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          ) : (
            <Search className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search by meaning..."
          className={`
            w-full pl-10 pr-10 py-3 rounded-lg border-2 transition-colors
            ${isDark
              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20
          `}
        />

        {query && (
          <button
            onClick={handleClear}
            className={`
              absolute inset-y-0 right-0 pr-3 flex items-center
              ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}
            `}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div
          className={`
            mt-4 rounded-lg border overflow-hidden
            ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
          `}
        >
          <div
            className={`
              px-4 py-2 border-b flex items-center gap-2
              ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}
            `}
          >
            <TrendingUp className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </span>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {results.map((result) => (
              <SearchResultItem
                key={result.document.id}
                result={result}
                onClick={onResultClick}
                theme={theme}
              />
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {query && !isLoading && results.length === 0 && (
        <div
          className={`
            mt-4 p-8 rounded-lg border-2 border-dashed text-center
            ${isDark ? 'border-gray-700' : 'border-gray-300'}
          `}
        >
          <FileText className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`text-lg font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            No results found
          </p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Try a different search query or reduce the similarity threshold
          </p>
        </div>
      )}

      {/* Help text */}
      {!query && (
        <div className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <p className="mb-2">
            <strong>Semantic Search:</strong> Find documents by meaning, not just keywords.
          </p>
          <p>
            Try searching for concepts like &quot;productivity tips&quot; or &quot;learning strategies&quot;
            to find related notes, even if they don&apos;t contain those exact words.
          </p>
        </div>
      )}
    </div>
  );
}

interface SearchResultItemProps {
  result: SearchResult;
  index: number;
  onClick?: (documentId: string) => void;
  theme: 'light' | 'dark';
}

function SearchResultItem({ result, onClick, theme }: Omit<SearchResultItemProps, 'index'>) {
  const isDark = theme === 'dark';
  const similarity = Math.round(result.similarity * 100);

  // Get display text (limit to 200 chars)
  const displayText =
    result.document.text.length > 200
      ? result.document.text.slice(0, 200) + '...'
      : result.document.text;

  // Extract metadata with type narrowing from Record<string, unknown>
  const md = result.document.metadata as Record<string, unknown>;
  const fileName = (typeof md.fileName === 'string' ? md.fileName : undefined) || result.document.id;
  const path = (typeof md.path === 'string' ? md.path : '') || '';
  const chunkIndex = typeof md.chunkIndex === 'number' ? md.chunkIndex : undefined;
  const totalChunks = typeof md.totalChunks === 'number' ? md.totalChunks : undefined;

  return (
    <div
      onClick={() => onClick?.(result.document.id)}
      className={`
        p-4 transition-colors
        ${onClick ? 'cursor-pointer' : ''}
        ${isDark
          ? 'hover:bg-gray-750 active:bg-gray-700'
          : 'hover:bg-gray-50 active:bg-gray-100'
        }
      `}
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex-1 min-w-0">
          <h3
            className={`
              font-medium truncate
              ${isDark ? 'text-white' : 'text-gray-900'}
            `}
          >
            {fileName}
          </h3>
          {path && (
            <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {path}
            </p>
          )}
        </div>

        <div
          className={`
            shrink-0 px-2 py-1 rounded text-xs font-medium
            ${similarity >= 80
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : similarity >= 60
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }
          `}
        >
          {similarity}% match
        </div>
      </div>

      <p className={`text-sm line-clamp-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {displayText}
      </p>

      {typeof chunkIndex === 'number' && typeof totalChunks === 'number' && (
        <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          Chunk {chunkIndex + 1} of {totalChunks}
        </p>
      )}
    </div>
  );
}
