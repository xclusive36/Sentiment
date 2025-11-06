'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MarkdownEditor from '@/components/MarkdownEditor';

export default function EditFilePage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [decodedPath, setDecodedPath] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Unwrap params Promise
  useEffect(() => {
    params.then(p => {
      setDecodedPath(decodeURIComponent(p.slug));
    });
  }, [params]);

  useEffect(() => {
    if (!decodedPath) return;
    
    // Fetch file content
    fetch(`/api/files/content?path=${encodeURIComponent(decodedPath)}`)
      .then(res => res.json())
      .then(data => {
        setContent(data.content || '');
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading file:', error);
        setIsLoading(false);
      });
  }, [decodedPath]);

  const handleSave = async (newContent: string) => {
    const response = await fetch('/api/files', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relativePath: decodedPath, content: newContent }),
    });

    if (!response.ok) {
      throw new Error('Failed to save file');
    }

    router.push(`/file/${encodeURIComponent(decodedPath)}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <MarkdownEditor
          initialContent={content}
          relativePath={decodedPath}
          onSave={handleSave}
          onCancel={() => router.push(`/file/${encodeURIComponent(decodedPath)}`)}
        />
      </div>
    </div>
  );
}
