'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import TableOfContents from '@/components/TableOfContents';
import Breadcrumbs from '@/components/Breadcrumbs';
import Backlinks from '@/components/Backlinks';
import type { Backlink } from '@/lib/wikilinks';

interface FileData {
  title: string;
  content: string;
  relativePath: string;
  tags: string[];
  backlinks: Backlink[];
  stats: { size: number; created: Date; modified: Date };
}

export default function FilePage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [decodedPath, setDecodedPath] = useState<string>('');
  const [file, setFile] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Unwrap params Promise
  useEffect(() => {
    params.then(p => {
      setDecodedPath(decodeURIComponent(p.slug));
    });
  }, [params]);

  // Process wiki links in content
  const processedContent = useMemo(() => {
    if (!file) return '';
    // Convert [[wiki links]] to markdown links
    return file.content.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
      const [target, displayText] = linkText.includes('|')
        ? linkText.split('|').map((s: string) => s.trim())
        : [linkText.trim(), linkText.trim()];
      
      const targetFileName = target.endsWith('.md') ? target : `${target}.md`;
      const currentDir = decodedPath.split('/').slice(0, -1).join('/');
      const targetPath = currentDir ? `${currentDir}/${targetFileName}` : targetFileName;
      
      return `[${displayText}](/file/${encodeURIComponent(targetPath)})`;
    });
  }, [file, decodedPath]);

  useEffect(() => {
    if (!decodedPath) return;
    
    fetch(`/api/files/content?path=${encodeURIComponent(decodedPath)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setFile(null);
        } else {
          setFile(data);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setFile(null);
        setIsLoading(false);
      });
  }, [decodedPath]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(decodedPath)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      router.push('/');
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file. Please try again.');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">File not found</div>
      </div>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Generate heading IDs
  const generateHeadingId = (text: string, index: number) => {
    return `heading-${index}-${text.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  };

  let headingIndex = 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Breadcrumbs path={decodedPath} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {file.title}
              </h1>
              <div className="flex gap-2">
                <Link
                  href={`/file/${encodeURIComponent(decodedPath)}/edit`}
                  className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
                <a
                  href={`/api/export?path=${encodeURIComponent(decodedPath)}&format=html`}
                  download
                  className="px-4 py-2 text-sm font-medium bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export HTML
                </a>
              </div>
            </div>
            
            {file.tags && file.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {file.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span>{formatFileSize(file.stats.size)}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Modified: {formatDate(file.stats.modified)}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>Created: {formatDate(file.stats.created)}</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            <article className="max-w-none">
              <div className="markdown-content text-slate-800 dark:text-slate-200">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => {
                      const id = generateHeadingId(children as string, headingIndex++);
                      return <h1 id={id} className="text-3xl font-bold mb-4 mt-6">{children}</h1>;
                    },
                    h2: ({ children }) => {
                      const id = generateHeadingId(children as string, headingIndex++);
                      return <h2 id={id} className="text-2xl font-bold mb-3 mt-5">{children}</h2>;
                    },
                    h3: ({ children }) => {
                      const id = generateHeadingId(children as string, headingIndex++);
                      return <h3 id={id} className="text-xl font-semibold mb-2 mt-4">{children}</h3>;
                    },
                    p: ({ children }) => <p className="mb-4 leading-7">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                    li: ({ children }) => <li className="leading-7">{children}</li>,
                    code: ({ children }) => (
                      <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-sm font-mono">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto mb-4">
                        {children}
                      </pre>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4">
                        {children}
                      </blockquote>
                    ),
                    a: ({ children, href }) => (
                      <a href={href} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {processedContent}
                </ReactMarkdown>
              </div>
            </article>
            
            <Backlinks backlinks={file.backlinks || []} />
          </div>
        </div>
        <div className="hidden lg:block">
          <TableOfContents content={file.content} />
        </div>
      </div>
      </div>
    </div>
  );
}
