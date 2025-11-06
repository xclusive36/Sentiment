import Link from 'next/link';
import { getAllMarkdownFiles } from '@/lib/files';
import type { FileData } from '@/lib/files';

export default function TimelinePage() {
  const structure = getAllMarkdownFiles();
  
  // Collect all files with timestamps
  const allFiles: FileData[] = [];
  
  const collectFiles = (files: FileData[]) => {
    allFiles.push(...files);
  };
  
  const collectFromFolders = (folders: typeof structure.folders) => {
    folders.forEach(folder => {
      collectFiles(folder.files);
      collectFromFolders(folder.subfolders);
    });
  };
  
  collectFiles(structure.files);
  collectFromFolders(structure.folders);
  
  // Sort by modification date (newest first)
  const sortedFiles = allFiles.sort((a, b) => 
    new Date(b.stats.modified).getTime() - new Date(a.stats.modified).getTime()
  );
  
  // Group by date
  const groupedByDate = sortedFiles.reduce((acc, file) => {
    const date = new Date(file.stats.modified).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(file);
    return acc;
  }, {} as Record<string, FileData[]>);
  
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <header className="mb-8">
          <Link 
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            📅 Timeline
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Chronological view of all notes and modifications
          </p>
        </header>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {allFiles.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Total Notes</div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
              {Object.keys(groupedByDate).length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Active Days</div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
              {sortedFiles[0] ? getRelativeTime(sortedFiles[0].stats.modified) : 'N/A'}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Last Activity</div>
          </div>
        </div>
        
        {/* Timeline */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
            
            <div className="space-y-8">
              {Object.entries(groupedByDate).map(([date, files]) => (
                <div key={date} className="relative">
                  {/* Date marker */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full shadow-lg">
                      <span className="text-white font-bold text-lg">
                        {new Date(files[0].stats.modified).getDate()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {date}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {getRelativeTime(files[0].stats.modified)} · {files.length} {files.length === 1 ? 'note' : 'notes'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Files for this date */}
                  <div className="ml-24 space-y-3">
                    {files.map((file) => (
                      <Link
                        key={file.relativePath}
                        href={`/file/${encodeURIComponent(file.relativePath.replace('.md', ''))}`}
                        className="block p-4 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-slate-800 dark:text-white truncate">
                                {file.title}
                              </h3>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {formatTime(file.stats.modified)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                              {file.excerpt}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                              <span>{file.relativePath}</span>
                              {file.tags.length > 0 && (
                                <>
                                  <span>·</span>
                                  <div className="flex gap-1">
                                    {file.tags.slice(0, 3).map((tag) => (
                                      <span
                                        key={tag}
                                        className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {file.tags.length > 3 && (
                                      <span className="text-slate-400">+{file.tags.length - 3}</span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <svg 
                            className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 flex-shrink-0 ml-3" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M9 5l7 7-7 7" 
                            />
                          </svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {allFiles.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-slate-500 dark:text-slate-400">
                No notes yet. Create your first note to see it here!
              </p>
            </div>
          )}
        </div>
        
        {/* Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            💡 Timeline Tips
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>• Notes are grouped by modification date</li>
            <li>• Click any note to view its full content</li>
            <li>• Most recent changes appear at the top</li>
            <li>• Use this to track your knowledge base activity over time</li>
            <li>• Great for finding notes you worked on recently</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
