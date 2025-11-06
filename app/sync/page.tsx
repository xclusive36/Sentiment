import SyncStatus from '@/components/SyncStatus';

export default function SyncPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            External Editor Sync
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sync changes with VS Code, Obsidian, and other markdown editors
          </p>
        </div>

        {/* Sync Status */}
        <div className="mb-8">
          <SyncStatus />
        </div>

        {/* How It Works */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            How It Works
          </h2>
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <div className="font-medium mb-1">File Watching</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Sentiment monitors the markdown folder for any changes made by external editors.
                  Changes are detected in real-time using efficient file system watchers.
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <div className="font-medium mb-1">Auto-Refresh</div>
                <div className="text-gray-600 dark:text-gray-400">
                  When a file is modified externally, Sentiment automatically refreshes the file list
                  and updates any open file views. You'll see changes instantly without manual refresh.
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <div className="font-medium mb-1">Conflict Detection</div>
                <div className="text-gray-600 dark:text-gray-400">
                  If you're editing a file in both Sentiment and an external editor simultaneously,
                  conflicts are detected and resolved by creating backup files.
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                4
              </div>
              <div>
                <div className="font-medium mb-1">Bidirectional Sync</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Changes flow both ways: edits in Sentiment are immediately visible in external editors,
                  and vice versa. This enables seamless workflow between different tools.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Supported Editors */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Supported Editors
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <div className="text-2xl mb-2">📝</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">VS Code</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <div className="text-2xl mb-2">🔮</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Obsidian</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <div className="text-2xl mb-2">✏️</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Vim/Neovim</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Any Editor</div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 Tips for Best Experience
          </h2>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-disc list-inside">
            <li>Keep sync enabled while working to see changes instantly</li>
            <li>Use version control (git) for additional backup and history</li>
            <li>Close files in Sentiment before making major edits externally</li>
            <li>Conflict backups are created with timestamps for easy recovery</li>
            <li>The watcher is lightweight and won't impact system performance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
