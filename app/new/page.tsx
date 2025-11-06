'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MarkdownEditor from '@/components/MarkdownEditor';
import Link from 'next/link';
import type { NoteTemplate } from '@/lib/templates';

export default function NewFilePage() {
  const router = useRouter();
  const [fileName, setFileName] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(null);
  
  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => setTemplates(data.templates || []))
      .catch(console.error);
  }, []);

  const handleSave = async (content: string) => {
    if (!fileName.trim()) {
      alert('Please enter a file name');
      return;
    }

    const relativePath = fileName.endsWith('.md') ? fileName : `${fileName}.md`;

    const response = await fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relativePath, content }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        alert('File already exists. Please choose a different name.');
      } else {
        alert('Failed to create file. Please try again.');
      }
      throw new Error(data.error || 'Failed to create file');
    }

    router.push(`/file/${encodeURIComponent(relativePath)}`);
  };

  if (!showEditor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
              Create New File
            </h1>
            <div className="space-y-4">
              <div>
                <label htmlFor="fileName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  File Name
                </label>
                <input
                  id="fileName"
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="my-document.md"
                  className="w-full px-4 py-3 text-slate-900 dark:text-white bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && fileName.trim()) {
                      setShowEditor(true);
                    }
                  }}
                />
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Enter a name for your markdown file. The .md extension will be added automatically if not provided.
                </p>
              </div>
              
              {templates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Template (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedTemplate(null)}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        !selectedTemplate
                          ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                          : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border-2 border-transparent'
                      }`}
                    >
                      <div className="font-medium text-sm">📝 Blank</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Start from scratch</div>
                    </button>
                    {templates.slice(0, 5).map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`p-3 rounded-lg text-left transition-colors ${
                          selectedTemplate?.id === template.id
                            ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                            : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border-2 border-transparent'
                        }`}
                      >
                        <div className="font-medium text-sm">{template.icon} {template.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{template.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowEditor(true)}
                  disabled={!fileName.trim()}
                  className="px-6 py-3 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getInitialContent = () => {
    const title = fileName.replace('.md', '');
    if (selectedTemplate) {
      const frontmatter = `---\ntitle: ${title}\n---\n\n`;
      return frontmatter + `# ${title}\n\n` + selectedTemplate.bodyTemplate;
    }
    return `---\ntitle: ${title}\n---\n\n# ${title}\n\nStart writing your content here...`;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <MarkdownEditor
          initialContent={getInitialContent()}
          relativePath={fileName.endsWith('.md') ? fileName : `${fileName}.md`}
          onSave={handleSave}
          onCancel={() => setShowEditor(false)}
        />
      </div>
    </div>
  );
}
