'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { FileAccessStats } from '@/lib/stats';

interface RecentFilesProps {
  type: 'recent' | 'frequent';
  limit?: number;
}

export default function RecentFiles({ type, limit = 5 }: RecentFilesProps) {
  const [files, setFiles] = useState<FileAccessStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetch(`/api/stats?type=${type}&limit=${limit}`)
      .then(res => res.json())
      .then(data => {
        setFiles(data.files || []);
        setIsLoading(false);
      })
      .catch(() => {
        setFiles([]);
        setIsLoading(false);
      });
  }, [type, limit]);
  
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
        ))}
      </div>
    );
  }
  
  if (files.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 italic">
        No files yet. Start exploring to see {type === 'recent' ? 'recently viewed' : 'frequently accessed'} files here.
      </p>
    );
  }
  
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };
  
  const getFileName = (path: string) => {
    return path.split('/').pop()?.replace('.md', '') || path;
  };
  
  const getFileFolder = (path: string) => {
    const parts = path.split('/');
    if (parts.length > 1) {
      return parts.slice(0, -1).join('/');
    }
    return null;
  };
  
  return (
    <div className="space-y-2">
      {files.map((file) => {
        const fileName = getFileName(file.path);
        const folder = getFileFolder(file.path);
        
        return (
          <Link
            key={file.path}
            href={`/file/${encodeURIComponent(file.path.replace('.md', ''))}`}
            className="block p-3 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                    {fileName}
                  </span>
                  {type === 'frequent' && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      {file.accessCount}x
                    </span>
                  )}
                </div>
                {folder && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {folder}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-3">
                {type === 'recent' && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {formatTimeAgo(file.lastAccessed)}
                  </span>
                )}
                <svg 
                  className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" 
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
            </div>
          </Link>
        );
      })}
    </div>
  );
}
