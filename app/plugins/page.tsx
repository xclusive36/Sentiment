'use client';

import { PluginManager } from '@/components/PluginManager';
import Link from 'next/link';
import { useEffect } from 'react';
import { pluginManager } from '@/lib/plugin-system';
import { WordCountPlugin, TimeTrackerPlugin, PomodoroPlugin } from '@/plugins';

export default function PluginsPage() {
  useEffect(() => {
    // Register plugins on mount
    const plugins = [
      new WordCountPlugin(),
      new TimeTrackerPlugin(),
      new PomodoroPlugin(),
    ];

    plugins.forEach(plugin => {
      pluginManager.registerPlugin(plugin);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">📝 Sentiment</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">🔌 Plugins</h1>
          </div>
          
          <Link
            href="/"
            className="px-3 py-2 text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            Back
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Info Card */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
            🚀 Extend Your PKM
          </h2>
          <p className="text-purple-800 dark:text-purple-200 text-sm mb-3">
            Plugins add extra functionality to Sentiment. Enable the ones you need and customize their settings.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-white dark:bg-slate-800 rounded p-3">
              <div className="font-semibold text-slate-900 dark:text-white mb-1">📊 Word Count</div>
              <div className="text-slate-600 dark:text-slate-400">Track statistics and reading time</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded p-3">
              <div className="font-semibold text-slate-900 dark:text-white mb-1">⏱️ Time Tracker</div>
              <div className="text-slate-600 dark:text-slate-400">Monitor time spent on notes</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded p-3">
              <div className="font-semibold text-slate-900 dark:text-white mb-1">🍅 Pomodoro</div>
              <div className="text-slate-600 dark:text-slate-400">Focus timer for productivity</div>
            </div>
          </div>
        </div>

        {/* Plugin Manager */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg">
          <PluginManager theme="light" />
        </div>

        {/* Developer Info */}
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">🛠️ For Developers</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Want to create your own plugin? Check out the plugin system documentation in <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">FEATURES.md</code>
          </p>
          <div className="bg-slate-50 dark:bg-slate-900 rounded p-4 text-xs font-mono">
            <div className="text-slate-600 dark:text-slate-400">&quot;// Example plugin structure&quot;</div>
            <div className="text-blue-600 dark:text-blue-400">import</div> {`{ Plugin } `}<div className="text-blue-600 dark:text-blue-400 inline">from</div> {`'@/lib/plugin-system'`};
            <br /><br />
            <div className="text-blue-600 dark:text-blue-400">class</div> {`MyPlugin `}<div className="text-blue-600 dark:text-blue-400 inline">extends</div> {` Plugin {`}
            <br />
            {`  async onLoad() { ... }`}
            <br />
            {`}`}
          </div>
        </div>
      </div>
    </div>
  );
}
