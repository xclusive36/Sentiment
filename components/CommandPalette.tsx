'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { FileStructure } from '@/lib/files';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  structure: FileStructure;
}

interface Command {
  type: 'file' | 'action';
  label: string;
  path?: string;
  action?: () => void;
  icon?: string;
}

export default function CommandPalette({ isOpen, onClose, structure }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Build flat list of all files
  const allFiles = useMemo(() => {
    const files: Array<{ name: string; path: string }> = [];
    
    const processFolder = (folder: any, basePath = '') => {
      const currentPath = basePath ? `${basePath}/${folder.name}` : folder.name;
      
      folder.files.forEach((file: any) => {
        files.push({
          name: file.title,
          path: file.relativePath,
        });
      });
      
      folder.subfolders.forEach((subfolder: any) => {
        processFolder(subfolder, currentPath);
      });
    };
    
    structure.files.forEach((file) => {
      files.push({
        name: file.title,
        path: file.relativePath,
      });
    });
    
    structure.folders.forEach((folder) => {
      processFolder(folder);
    });
    
    return files;
  }, [structure]);

  // Build commands list
  const commands = useMemo(() => {
    const cmds: Command[] = [
      {
        type: 'action',
        label: 'New Note',
        icon: '📝',
        action: () => {
          onClose();
          router.push('/new');
        },
      },
      {
        type: 'action',
        label: 'Daily Journal',
        icon: '📅',
        action: () => {
          onClose();
          router.push('/journal');
        },
      },
      {
        type: 'action',
        label: 'Knowledge Graph',
        icon: '🕸️',
        action: () => {
          onClose();
          router.push('/graph');
        },
      },
      {
        type: 'action',
        label: 'Search Files',
        icon: '🔍',
        action: () => {
          onClose();
          router.push('/searches');
        },
      },
      {
        type: 'action',
        label: 'Tags Browser',
        icon: '🏷️',
        action: () => {
          onClose();
          router.push('/tags');
        },
      },
      {
        type: 'action',
        label: 'Timeline View',
        icon: '⏰',
        action: () => {
          onClose();
          router.push('/timeline');
        },
      },
      {
        type: 'action',
        label: 'Study Flashcards',
        icon: '📚',
        action: () => {
          onClose();
          router.push('/study');
        },
      },
      {
        type: 'action',
        label: 'Insights & Analytics',
        icon: '📊',
        action: () => {
          onClose();
          router.push('/insights');
        },
      },
      {
        type: 'action',
        label: 'Sync Settings',
        icon: '🔄',
        action: () => {
          onClose();
          router.push('/sync');
        },
      },
    ];
    
    // Add all files
    allFiles.forEach((file) => {
      cmds.push({
        type: 'file',
        label: file.name,
        path: file.path,
        icon: '📄',
      });
    });
    
    return cmds;
  }, [allFiles, onClose, router]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    
    const lowerQuery = query.toLowerCase();
    return commands.filter((cmd) =>
      cmd.label.toLowerCase().includes(lowerQuery) ||
      cmd.path?.toLowerCase().includes(lowerQuery)
    );
  }, [commands, query]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          if (selected.type === 'file' && selected.path) {
            router.push(`/file/${encodeURIComponent(selected.path)}`);
            onClose();
          } else if (selected.action) {
            selected.action();
          }
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, router, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Command palette */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files or commands..."
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none"
          />
          <kbd className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No results found
            </div>
          ) : (
            <div className="py-2">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={`${cmd.type}-${cmd.label}-${index}`}
                  onClick={() => {
                    if (cmd.type === 'file' && cmd.path) {
                      router.push(`/file/${encodeURIComponent(cmd.path)}`);
                      onClose();
                    } else if (cmd.action) {
                      cmd.action();
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span className="text-xl">{cmd.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{cmd.label}</div>
                    {cmd.path && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {cmd.path}
                      </div>
                    )}
                  </div>
                  {cmd.type === 'action' && (
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">↵</kbd>
              Select
            </span>
          </div>
          <span>{filteredCommands.length} results</span>
        </div>
      </div>
    </div>
  );
}
