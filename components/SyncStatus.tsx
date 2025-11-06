'use client';

import { useState, useEffect } from 'react';

interface SyncStats {
  isWatching: boolean;
  lastSync: string | null;
  changesDetected: number;
  conflictsResolved: number;
  listenersCount: number;
  watchedDirectory: string;
}

export default function SyncStatus() {
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/sync?action=stats');
      const data = await res.json();
      setStats(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching sync stats:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const toggleSync = async () => {
    if (!stats) return;

    try {
      const action = stats.isWatching ? 'stop' : 'start';
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      
      // Refresh stats immediately
      await fetchStats();
    } catch (error) {
      console.error('Error toggling sync:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-gray-600 dark:text-gray-400">Loading sync status...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-red-600 dark:text-red-400">Failed to load sync status</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          External Editor Sync
        </h2>
        <button
          onClick={toggleSync}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            stats.isWatching
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {stats.isWatching ? 'Stop Watching' : 'Start Watching'}
        </button>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div
          className={`w-3 h-3 rounded-full ${
            stats.isWatching ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`}
        />
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {stats.isWatching ? 'Actively Watching' : 'Not Watching'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {stats.isWatching
              ? 'Changes in external editors will sync automatically'
              : 'Enable sync to detect external changes'}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.changesDetected}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Changes Detected
          </div>
        </div>
        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.conflictsResolved}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Conflicts Resolved
          </div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.listenersCount}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Active Listeners
          </div>
        </div>
        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.lastSync
              ? new Date(stats.lastSync).toLocaleTimeString()
              : 'Never'}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Last Sync
          </div>
        </div>
      </div>

      {/* Watched Directory */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
          Watched Directory:
        </div>
        <code className="text-sm text-gray-600 dark:text-gray-400 break-all">
          {stats.watchedDirectory}
        </code>
      </div>
    </div>
  );
}
