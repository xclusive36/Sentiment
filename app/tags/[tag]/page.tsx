import React from 'react';
import { getAllMarkdownFiles, FileData } from '@/lib/files';
import { 
  buildTagHierarchy, 
  getTagCounts, 
  getDescendantTags,
  getParentTag,
  getAncestorTags,
  parseTagPath
} from '@/lib/tag-hierarchy';
import TagBrowser from '@/components/TagBrowser';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ tag: string }>;
}

export default async function TagPage({ params }: Props) {
  const { tag: encodedTag } = await params;
  const tag = decodeURIComponent(encodedTag);
  
  const structure = getAllMarkdownFiles();
  
  // Collect all unique tags
  const allTags = new Set<string>();
  
  const collectTags = (tags: string[]) => {
    tags.forEach(t => allTags.add(t));
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
  
  // Get descendant tags
  const descendants = getDescendantTags(tag, [...allTags]);
  const allRelatedTags = [tag, ...descendants];
  
  // Get files with this tag or any descendant tag
  const matchingFiles: FileData[] = [];
  
  const collectMatchingFiles = (files: typeof structure.files) => {
    files.forEach(file => {
      if (file.tags.some(t => allRelatedTags.includes(t))) {
        matchingFiles.push(file);
      }
    });
  };
  
  const processMatchingFolders = (folders: typeof structure.folders) => {
    folders.forEach(folder => {
      collectMatchingFiles(folder.files);
      processMatchingFolders(folder.subfolders);
    });
  };
  
  collectMatchingFiles(structure.files);
  processMatchingFolders(structure.folders);
  
  // Sort by modification date
  matchingFiles.sort((a, b) => 
    new Date(b.stats.modified).getTime() - new Date(a.stats.modified).getTime()
  );
  
  // Get breadcrumb path
  const tagParts = parseTagPath(tag);
  const breadcrumbs = tagParts.map((_, index) => ({
    name: tagParts[index],
    path: tagParts.slice(0, index + 1).join('/'),
  }));
  
  const parentTag = getParentTag(tag);
  const childCount = descendants.length;
  const directFileCount = matchingFiles.filter(f => f.tags.includes(tag)).length;
  const totalFileCount = matchingFiles.length;
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Tag Browser */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-4 h-[calc(100vh-2rem)]">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  All Tags
                </h2>
              </div>
              <TagBrowser tagHierarchy={tagHierarchy} selectedTag={tag} />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Breadcrumb */}
            <nav className="mb-4 flex items-center space-x-2 text-sm">
              <Link href="/tags" className="text-blue-600 dark:text-blue-400 hover:underline">
                Tags
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                  <span className="text-gray-400">/</span>
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {crumb.name}
                    </span>
                  ) : (
                    <Link
                      href={`/tags/${encodeURIComponent(crumb.path)}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {crumb.name}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>

            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                #{tag}
              </h1>
              {parentTag && (
                <Link
                  href={`/tags/${encodeURIComponent(parentTag)}`}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  ← Back to #{parentTag}
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Direct Notes</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{directFileCount}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Notes</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalFileCount}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  (including subtags)
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Subtags</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{childCount}</div>
              </div>
            </div>

            {/* Files List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Notes ({matchingFiles.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {matchingFiles.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No notes found with this tag
                  </div>
                ) : (
                  matchingFiles.map((file) => (
                    <Link
                      key={file.slug}
                      href={`/file/${file.slug}`}
                      className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {file.title}
                          </h3>
                          {file.excerpt && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {file.excerpt}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {file.tags.map((fileTag) => (
                              <span
                                key={fileTag}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  fileTag === tag
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : allRelatedTags.includes(fileTag)
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                              >
                                #{fileTag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="ml-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date(file.stats.modified).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
