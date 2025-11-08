"use client";

import { useState, useMemo, useEffect } from "react";
import type { FileStructure } from "@/lib/files";
import FileList from "@/components/FileList";
import SearchBar from "@/components/SearchBar";
import FileUpload from "@/components/FileUpload";
import TagFilter from "@/components/TagFilter";
import RecentFiles from "@/components/RecentFiles";
import QuickEditor from "@/components/QuickEditor";
import CommandPalette from "@/components/CommandPalette";
import CollapsibleSidebar from "@/components/CollapsibleSidebar";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import Link from "next/link";

interface HomePageClientProps {
  initialStructure: FileStructure;
  allTags: string[];
}

export default function HomePageClient({
  initialStructure,
  allTags,
}: HomePageClientProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [recentFilesKey, setRecentFilesKey] = useState(0);

  // Refresh recent files when page becomes visible (user returns to home)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setRecentFilesKey((prev) => prev + 1);
      }
    };

    const handleFileChanged = () => {
      setRecentFilesKey((prev) => prev + 1);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("file-changed", handleFileChanged);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("file-changed", handleFileChanged);
    };
  }, []);

  // Filter files by tags
  const structure = useMemo(() => {
    if (selectedTags.length === 0) {
      return initialStructure;
    }

    const filterFiles = (files: typeof initialStructure.files) => {
      return files.filter((file) =>
        selectedTags.some((tag) => file.tags.includes(tag))
      );
    };

    const filterFolders = (
      folders: typeof initialStructure.folders
    ): typeof initialStructure.folders => {
      return folders
        .map((folder) => ({
          ...folder,
          files: filterFiles(folder.files),
          subfolders: filterFolders(folder.subfolders),
        }))
        .filter(
          (folder) => folder.files.length > 0 || folder.subfolders.length > 0
        );
    };

    return {
      files: filterFiles(initialStructure.files),
      folders: filterFolders(initialStructure.folders),
    };
  }, [initialStructure, selectedTags]);

  return (
    <>
      <KeyboardShortcuts
        onCommandPalette={() => setIsCommandPaletteOpen(true)}
      />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        structure={structure}
      />

      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Mobile-First Header */}
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
          {/* Mobile: Single row with logo and menu */}
          <div className="px-3 py-2 flex items-center justify-between md:hidden">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                📝 Sentiment
              </span>
            </Link>

            <div className="flex items-center gap-1">
              <Link
                href="/new"
                className="p-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                title="New Note">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </Link>

              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Menu">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile: Search bar on second row */}
          <div className="px-3 pb-2 md:hidden">
            <SearchBar />
          </div>

          {/* Desktop: Original layout */}
          <div className="hidden md:flex container mx-auto px-4 py-3 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                📝 Sentiment
              </span>
            </Link>

            <div className="flex-1 max-w-2xl mx-8">
              <SearchBar />
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/new"
                className="px-3 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New
              </Link>

              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="px-3 py-2 text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2"
                title="Command Palette (Ctrl/Cmd+P)">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-command w-4 h-4"
                  aria-hidden="true">
                  <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"></path>
                </svg>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  title="Menu">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
                    <Link
                      href="/journal"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => setShowMenu(false)}>
                      📅 Daily Journal
                    </Link>
                    <Link
                      href="/graph"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => setShowMenu(false)}>
                      🕸️ Knowledge Graph
                    </Link>
                    <Link
                      href="/tags"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => setShowMenu(false)}>
                      🏷️ Tags Browser
                    </Link>
                    <Link
                      href="/timeline"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => setShowMenu(false)}>
                      ⏰ Timeline
                    </Link>
                    <Link
                      href="/study"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => setShowMenu(false)}>
                      📚 Study Flashcards
                    </Link>
                    <Link
                      href="/searches"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => setShowMenu(false)}>
                      🔍 Saved Searches
                    </Link>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                    <Link
                      href="/vector-search"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
                      onClick={() => setShowMenu(false)}>
                      ✨ Vector Search
                    </Link>
                    <Link
                      href="/plugins"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
                      onClick={() => setShowMenu(false)}>
                      🔌 Plugins
                    </Link>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                    <Link
                      href="/insights"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => setShowMenu(false)}>
                      📊 Insights
                    </Link>
                    <Link
                      href="/sync"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => setShowMenu(false)}>
                      🔄 Sync Settings
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area with Sidebar */}
        <div className="px-3 py-4 md:container md:mx-auto md:px-4 md:py-8">
          {/* Quick Editor - Prominently Featured */}
          <div className="mb-6 md:mb-8">
            <QuickEditor />
          </div>

          {/* Recent Files - Compact */}
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 md:gap-6 md:mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 md:p-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Recently Viewed
              </h3>
              <RecentFiles
                key={`recent-${recentFilesKey}`}
                type="recent"
                limit={5}
              />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 md:p-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                Most Accessed
              </h3>
              <RecentFiles
                key={`frequent-${recentFilesKey}`}
                type="frequent"
                limit={5}
              />
            </div>
          </div>
        </div>

        {/* Collapsible File Browser Sidebar */}
        <CollapsibleSidebar title="Files" defaultOpen={false}>
          <FileUpload />

          <TagFilter
            allTags={allTags}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />

          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {structure.folders.length} folders, {structure.files.length}{" "}
                files
              </span>
            </div>
            <FileList initialStructure={structure} />
          </div>
        </CollapsibleSidebar>
      </div>
    </>
  );
}
