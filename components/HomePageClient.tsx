'use client';

import { useState, useMemo } from 'react';
import type { FileStructure } from '@/lib/files';
import FileList from '@/components/FileList';
import SearchBar from '@/components/SearchBar';
import FileUpload from '@/components/FileUpload';
import TagFilter from '@/components/TagFilter';
import RecentFiles from '@/components/RecentFiles';
import Link from 'next/link';

interface HomePageClientProps {
  initialStructure: FileStructure;
  allTags: string[];
}

export default function HomePageClient({ initialStructure, allTags }: HomePageClientProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Filter files by tags
  const structure = useMemo(() => {
    if (selectedTags.length === 0) {
      return initialStructure;
    }
    
    const filterFiles = (files: typeof initialStructure.files) => {
      return files.filter(file => 
        selectedTags.some(tag => file.tags.includes(tag))
      );
    };
    
    const filterFolders = (folders: typeof initialStructure.folders): typeof initialStructure.folders => {
      return folders.map(folder => ({
        ...folder,
        files: filterFiles(folder.files),
        subfolders: filterFolders(folder.subfolders),
      })).filter(folder => folder.files.length > 0 || folder.subfolders.length > 0);
    };
    
    return {
      files: filterFiles(initialStructure.files),
      folders: filterFolders(initialStructure.folders),
    };
  }, [initialStructure, selectedTags]);
  
  const totalItems = structure.files.length + structure.folders.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
            📁 Sentiment
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-6">
            File Management & Storage Dashboard
          </p>
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/timeline"
              className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Timeline
            </Link>
            <Link
              href="/searches"
              className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Saved Searches
            </Link>
            <Link
              href="/insights"
              className="px-4 py-2 text-sm font-medium bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Insights
            </Link>
          </div>
          <SearchBar />
        </header>

        <FileUpload />

        {/* Recent & Frequent Files */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recently Viewed
            </h3>
            <RecentFiles type="recent" limit={5} />
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Most Accessed
            </h3>
            <RecentFiles type="frequent" limit={5} />
          </div>
        </div>

        <TagFilter 
          allTags={allTags}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
        />

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white">
              Markdown Files
            </h2>
            <div className="flex items-center gap-3">
              <Link
                href="/journal"
                className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Daily Journal
              </Link>
              <Link
                href="/new"
                className="px-4 py-2 text-sm font-medium bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New File
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-between mb-6">
            <div />
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {structure.folders.length} {structure.folders.length === 1 ? 'folder' : 'folders'}, {structure.files.length} {structure.files.length === 1 ? 'file' : 'files'}
              </span>
              {totalItems > 0 && (
                <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                  Drag to reorder or into folders
                </span>
              )}
            </div>
          </div>

          <FileList initialStructure={structure} />
        </div>

        <footer className="text-center text-slate-500 dark:text-slate-400 text-sm">
          <p>Sentiment - Next.js File Management Dashboard</p>
        </footer>
      </div>
    </div>
  );
}
