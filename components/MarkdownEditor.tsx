'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownEditorProps {
  initialContent: string;
  relativePath: string;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
}

export default function MarkdownEditor({
  initialContent,
  relativePath,
  onSave,
  onCancel,
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(content);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save file. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
      <div className="border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Edit: {relativePath}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
            <button
              onClick={() => setIsPreview(false)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                !isPreview
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setIsPreview(true)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                isPreview
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              Preview
            </button>
          </div>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-6">
        {isPreview ? (
          <div className="prose prose-slate dark:prose-invert max-w-none min-h-[500px]">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-3xl font-bold mb-4 mt-6">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-bold mb-3 mt-5">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-semibold mb-2 mt-4">{children}</h3>
                ),
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
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[500px] p-4 font-mono text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            placeholder="Write your markdown here..."
          />
        )}
      </div>
    </div>
  );
}
