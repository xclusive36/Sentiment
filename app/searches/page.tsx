'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { SavedSearch } from '@/lib/saved-searches';
import type { FileData } from '@/lib/files';

export default function SavedSearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSearch, setSelectedSearch] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<FileData[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');
  const [newSearchQuery, setNewSearchQuery] = useState('');
  
  useEffect(() => {
    loadSearches();
  }, []);
  
  const loadSearches = async () => {
    try {
      const response = await fetch('/api/saved-searches');
      const data = await response.json();
      setSearches(data.searches || []);
    } catch (error) {
      console.error('Error loading searches:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const executeSearch = async (id: string) => {
    setSelectedSearch(id);
    setIsExecuting(true);
    try {
      const response = await fetch(`/api/saved-searches?id=${id}&execute=true`);
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Error executing search:', error);
      setSearchResults([]);
    } finally {
      setIsExecuting(false);
    }
  };
  
  const createSearch = async () => {
    if (!newSearchName.trim()) return;
    
    try {
      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSearchName,
          query: newSearchQuery,
          filters: {},
          pinned: false,
        }),
      });
      
      if (response.ok) {
        setNewSearchName('');
        setNewSearchQuery('');
        setShowCreateModal(false);
        loadSearches();
      }
    } catch (error) {
      console.error('Error creating search:', error);
    }
  };
  
  const deleteSearch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved search?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/saved-searches?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadSearches();
        if (selectedSearch === id) {
          setSelectedSearch(null);
          setSearchResults([]);
        }
      }
    } catch (error) {
      console.error('Error deleting search:', error);
    }
  };
  
  const togglePin = async (id: string, currentlyPinned: boolean) => {
    try {
      await fetch('/api/saved-searches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, pinned: !currentlyPinned }),
      });
      loadSearches();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <Link 
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
          >
            ← Back to Home
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                🔍 Saved Searches
              </h1>
              <p className="text-slate-600 dark:text-slate-300">
                Smart folders that auto-update based on your search criteria
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Search
            </button>
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Saved Searches List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                Your Searches
              </h2>
              
              {searches.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  No saved searches yet. Create one to get started!
                </p>
              ) : (
                <div className="space-y-2">
                  {searches.map((search) => (
                    <div
                      key={search.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedSearch === search.id
                          ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                          : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border-2 border-transparent'
                      }`}
                      onClick={() => executeSearch(search.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{search.icon}</span>
                            <span className="font-medium text-slate-800 dark:text-white text-sm">
                              {search.name}
                            </span>
                            {search.pinned && (
                              <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 3.22l-.61-.6a5.5 5.5 0 00-7.78 7.77L10 18.78l8.39-8.4a5.5 5.5 0 00-7.78-7.77l-.61.61z" />
                              </svg>
                            )}
                          </div>
                          {search.query && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              Query: {search.query}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin(search.id, search.pinned);
                            }}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                          >
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSearch(search.id);
                            }}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          >
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Results */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              {!selectedSearch ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-slate-500 dark:text-slate-400">
                    Select a search to view results
                  </p>
                </div>
              ) : isExecuting ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">Executing search...</p>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4">
                    Results ({searchResults.length})
                  </h2>
                  
                  {searchResults.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                      No files match this search criteria
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map((file) => (
                        <Link
                          key={file.relativePath}
                          href={`/file/${encodeURIComponent(file.relativePath.replace('.md', ''))}`}
                          className="block p-4 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        >
                          <div className="font-medium text-slate-800 dark:text-white mb-1">
                            {file.title}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                            {file.excerpt}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 dark:text-slate-500">
                              {file.relativePath}
                            </span>
                            {file.tags.length > 0 && (
                              <div className="flex gap-1">
                                {file.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Create Search Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Create Saved Search
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newSearchName}
                  onChange={(e) => setNewSearchName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="My Search"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Search Query (optional)
                </label>
                <input
                  type="text"
                  value={newSearchQuery}
                  onChange={(e) => setNewSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="Search term..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createSearch}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
