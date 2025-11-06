import { buildGraph } from '@/lib/graph';
import GraphVisualization from '@/components/GraphVisualization';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function GraphPage() {
  const graphData = buildGraph();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Knowledge Graph
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize connections between your notes
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Notes</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{graphData.stats.totalNodes}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Connections</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{graphData.stats.totalEdges}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Isolated Notes</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{graphData.stats.isolatedNodes}</div>
          </div>
        </div>

        {/* Graph Visualization */}
        <div className="mb-8">
          <GraphVisualization graphData={graphData} height={700} />
        </div>

        {/* Most Connected Notes */}
        {graphData.stats.mostConnected.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Most Connected Notes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {graphData.stats.mostConnected.slice(0, 10).map((node) => (
                <Link
                  key={node.slug}
                  href={`/file/${node.slug}`}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {node.title}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {node.connections}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Help */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Using the Graph
          </h2>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              <strong>Hover:</strong> Highlight a note and its connections
            </p>
            <p>
              <strong>Click:</strong> View note details and open it
            </p>
            <p>
              <strong>Zoom:</strong> Use scroll wheel to zoom in/out
            </p>
            <p>
              <strong>Pan:</strong> Click and drag to move around the graph
            </p>
            <p className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
              <strong>Colors:</strong> Purple nodes are hubs (highly connected), blue are well-connected, 
              cyan have some connections, and gray are isolated. Blue edges are wikilinks, gray edges are tag-based connections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
