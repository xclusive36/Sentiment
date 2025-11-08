'use client';

import { VectorSearch } from '@/components/VectorSearch';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function VectorSearchPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">📝 Sentiment</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">✨ Vector Search</h1>
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
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            🤖 AI-Powered Semantic Search
          </h2>
          <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
            Search your notes by meaning, not just keywords. Our AI understands context and finds related content even when exact words don&apos;t match.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-white dark:bg-slate-800 rounded p-3">
              <div className="font-semibold text-slate-900 dark:text-white mb-1">🧠 Smart Matching</div>
              <div className="text-slate-600 dark:text-slate-400">Finds conceptually similar notes</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded p-3">
              <div className="font-semibold text-slate-900 dark:text-white mb-1">⚡ Local AI</div>
              <div className="text-slate-600 dark:text-slate-400">Runs entirely in your browser</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded p-3">
              <div className="font-semibold text-slate-900 dark:text-white mb-1">🔒 Private</div>
              <div className="text-slate-600 dark:text-slate-400">Your data never leaves your device</div>
            </div>
          </div>
        </div>

        {/* Search Component */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <VectorSearch
            onResultClick={(docId) => {
              // Navigate to the document
              router.push(`/file/${encodeURIComponent(docId)}`);
            }}
            threshold={0.3}
            limit={10}
            theme="light"
          />
        </div>

        {/* Tips */}
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">💡 Search Tips</h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Try searching for concepts like &quot;productivity tips&quot; or &quot;learning strategies&quot;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>The AI will find related notes even if they use different words</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Similarity percentage shows how closely each result matches your query</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>First time using? The AI model will download (about 30MB) and run locally</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
