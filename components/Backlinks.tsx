import Link from 'next/link';
import type { Backlink } from '@/lib/wikilinks';

interface BacklinksProps {
  backlinks: Backlink[];
}

export default function Backlinks({ backlinks }: BacklinksProps) {
  if (backlinks.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Backlinks ({backlinks.length})
      </h3>
      <div className="space-y-3">
        {backlinks.map((backlink, index) => (
          <Link
            key={index}
            href={`/file/${encodeURIComponent(backlink.sourceFile.relativePath)}`}
            className="block p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 dark:text-white mb-1">
                  {backlink.sourceFile.title}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {backlink.context}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  {backlink.sourceFile.relativePath}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
