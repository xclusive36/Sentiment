import { getAllMarkdownFiles } from '@/lib/files';
import { buildTagHierarchy, getTagCounts, getRootTags } from '@/lib/tag-hierarchy';
import TagBrowser from '@/components/TagBrowser';

export const dynamic = 'force-dynamic';

export default async function TagsPage() {
  const structure = getAllMarkdownFiles();
  
  // Collect all unique tags
  const allTags = new Set<string>();
  
  const collectTags = (tags: string[]) => {
    tags.forEach(tag => allTags.add(tag));
  };
  
  const processFiles = (files: typeof structure.files) => {
    files.forEach(file => collectTags(file.tags));
  };
  
  const processFolders = (folders: typeof structure.folders) => {
    folders.forEach(folder => {
      processFiles(folder.files);
      processFolders(folder.subfolders);
    });
  };
  
  processFiles(structure.files);
  processFolders(structure.folders);
  
  const tagCounts = getTagCounts(structure);
  const tagHierarchy = buildTagHierarchy([...allTags], tagCounts);
  
  // Calculate statistics
  const totalTags = allTags.size;
  const rootTags = getRootTags([...allTags]);
  const maxDepth = Math.max(...[...allTags].map(tag => tag.split('/').length));
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Tag Browser
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore your knowledge base through hierarchical tags
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Tags</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalTags}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Root Categories</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{rootTags.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Max Depth</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{maxDepth}</div>
          </div>
        </div>

        {/* Tag Browser */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden h-[600px]">
          <TagBrowser tagHierarchy={tagHierarchy} />
        </div>

        {/* Help */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Using Hierarchical Tags
          </h2>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              <strong>Create nested tags:</strong> Use forward slashes to create hierarchies, e.g., <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">#project/work/client-a</code>
            </p>
            <p>
              <strong>Auto-organization:</strong> Parent tags automatically include all child notes (e.g., <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">#project</code> shows all <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">#project/work</code> notes)
            </p>
            <p>
              <strong>Best practices:</strong> Use hierarchies for: Projects (project/work/client), Topics (learning/programming/python), Areas (health/fitness/workouts)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
