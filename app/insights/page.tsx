import Link from 'next/link';
import { getAllMarkdownFiles } from '@/lib/files';
import { findOrphans, findWeaklyConnected, getMostConnected, getHubFiles, getAuthorityFiles } from '@/lib/orphans';

export default function InsightsPage() {
  const structure = getAllMarkdownFiles();
  
  const orphans = findOrphans(structure);
  const weaklyConnected = findWeaklyConnected(structure, 2);
  const mostConnected = getMostConnected(structure, 10);
  const hubs = getHubFiles(structure, 10);
  const authorities = getAuthorityFiles(structure, 10);
  
  // Calculate total files
  const countFiles = (struct: typeof structure): number => {
    let count = struct.files.length;
    struct.folders.forEach(folder => {
      count += countFiles({ files: folder.files, folders: folder.subfolders });
    });
    return count;
  };
  
  const totalFiles = countFiles(structure);
  const orphanPercentage = totalFiles > 0 ? ((orphans.length / totalFiles) * 100).toFixed(1) : '0';
  
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
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            📊 Knowledge Graph Insights
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Analyze connections and discover orphaned notes
          </p>
        </header>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {totalFiles}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Total Notes</div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
              {orphans.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Orphans ({orphanPercentage}%)
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
              {weaklyConnected.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Weakly Connected</div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {mostConnected.length > 0 ? mostConnected[0].connectionScore : 0}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Highest Connection Score</div>
          </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Orphans */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🏝️</span>
              Orphaned Notes
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Notes with no incoming or outgoing links
            </p>
            
            {orphans.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                Great! No orphaned notes found. All your notes are connected.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {orphans.map((orphan) => (
                  <Link
                    key={orphan.file.relativePath}
                    href={`/file/${encodeURIComponent(orphan.file.relativePath.replace('.md', ''))}`}
                    className="block p-3 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                      {orphan.file.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {orphan.file.relativePath}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {/* Weakly Connected */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              Weakly Connected
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Notes with only 1-2 connections
            </p>
            
            {weaklyConnected.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                No weakly connected notes found.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {weaklyConnected.map((weak) => (
                  <Link
                    key={weak.file.relativePath}
                    href={`/file/${encodeURIComponent(weak.file.relativePath.replace('.md', ''))}`}
                    className="block p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                          {weak.file.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {weak.outgoingLinks} out, {weak.incomingLinks} in
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-xs bg-yellow-200 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100 px-2 py-1 rounded">
                          Score: {weak.connectionScore}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {/* Most Connected */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🌟</span>
              Most Connected
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Notes with the highest connection scores
            </p>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {mostConnected.map((conn) => (
                <Link
                  key={conn.file.relativePath}
                  href={`/file/${encodeURIComponent(conn.file.relativePath.replace('.md', ''))}`}
                  className="block p-3 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                        {conn.file.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {conn.outgoingLinks} out, {conn.incomingLinks} in
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-xs bg-green-200 dark:bg-green-700 text-green-900 dark:text-green-100 px-2 py-1 rounded font-bold">
                        {conn.connectionScore}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Authority Files */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">📌</span>
              Authority Notes
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Notes with the most incoming links
            </p>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {authorities.map((auth) => (
                <Link
                  key={auth.file.relativePath}
                  href={`/file/${encodeURIComponent(auth.file.relativePath.replace('.md', ''))}`}
                  className="block p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                        {auth.file.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Referenced {auth.incomingLinks} times
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-xs bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-purple-100 px-2 py-1 rounded font-bold">
                        {auth.incomingLinks} ←
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        {/* Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            💡 Tips for Better Connections
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>• <strong>Orphaned notes:</strong> Add wiki links to connect them to your knowledge base</li>
            <li>• <strong>Weakly connected:</strong> Consider adding more context or related links</li>
            <li>• <strong>Authority notes:</strong> These are your key concepts - keep them well-maintained</li>
            <li>• <strong>Connection score:</strong> Aim for scores above 50 for important notes</li>
            <li>• <strong>Regular reviews:</strong> Check this page periodically to maintain graph health</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
