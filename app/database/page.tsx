'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DatabaseStats {
  notes: number;
  tags: number;
  links: number;
  totalSize: number;
  totalWords: number;
  dbSize: number;
}

export default function DatabasePage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/database?action=stats');
      const data = await res.json();
      setStats(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const res = await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      });
      
      const data = await res.json();
      setSyncResult(data);
      
      // Refresh stats
      await fetchStats();
    } catch (error) {
      console.error('Error syncing:', error);
      setSyncResult({ success: false, message: 'Sync failed' });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading database stats...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Database Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            SQLite database with FTS5 full-text search
          </p>
        </div>

        {/* Sync Button */}
        <div className="mb-8">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isSyncing ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M5 9A7.5 7.5 0 0119.5 9m-15 6A7.5 7.5 0 0019.5 15" />
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M5 9A7.5 7.5 0 0119.5 9m-15 6A7.5 7.5 0 0019.5 15" />
                </svg>
                Sync Database
              </>
            )}
          </button>
        </div>

        {/* Sync Result */}
        {syncResult && (
          <div className={`mb-8 p-4 rounded-lg ${syncResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
            <div className={`font-medium ${syncResult.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
              {syncResult.message}
            </div>
            {syncResult.stats && (
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Added: {syncResult.stats.added} | Updated: {syncResult.stats.updated} | Deleted: {syncResult.stats.deleted}
              </div>
            )}
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Notes</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.notes.toLocaleString()}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Tags</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.tags.toLocaleString()}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Links</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.links.toLocaleString()}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Words</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalWords.toLocaleString()}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Content Size</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatBytes(stats.totalSize)}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Database Size</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatBytes(stats.dbSize)}</div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Database Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Full-Text Search (FTS5)
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Lightning-fast search across all note content with relevance ranking and snippet highlighting
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      High Performance
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Indexed queries and WAL mode for fast concurrent reads and writes
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Metadata Indexing
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Tags, aliases, and wikilinks are indexed for fast filtering and relationship queries
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Analytics Tracking
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Track note access counts, word counts, and modification times
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                About the Database
              </h2>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <p>
                  Sentiment uses <strong>SQLite</strong> with <strong>FTS5</strong> (Full-Text Search) for blazing-fast queries and powerful search capabilities.
                </p>
                <p>
                  The database automatically syncs with your markdown files and maintains indexes for tags, links, and content for optimal performance.
                </p>
                <p className="mt-4">
                  <strong>Location:</strong> <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">.sentiment-db.sqlite</code>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
