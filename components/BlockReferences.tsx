'use client';

import { useState } from 'react';
import { BlockReference } from '@/lib/block-references';

interface BlockReferencesProps {
  blocks: BlockReference[];
  fileSlug: string;
}

export default function BlockReferences({ blocks, fileSlug }: BlockReferencesProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyBlockReference = (blockId: string) => {
    const reference = `![[${fileSlug}#${blockId}]]`;
    navigator.clipboard.writeText(reference);
    setCopiedId(blockId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyBlockId = (blockId: string) => {
    const reference = `^${blockId}`;
    navigator.clipboard.writeText(reference);
    setCopiedId(`id-${blockId}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (blocks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Block References
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No block references found. Add <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">^block-id</code> at the end of a paragraph to create one.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Block References
      </h2>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
        Click to copy transclusion syntax
      </p>
      <div className="space-y-3">
        {blocks.map((block) => (
          <div
            key={block.blockId}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <code className="text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                  ^{block.blockId}
                </code>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  Line {block.lineNumber}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => copyBlockReference(block.blockId)}
                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  title="Copy transclusion syntax"
                >
                  {copiedId === block.blockId ? (
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => copyBlockId(block.blockId)}
                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                  title="Copy block ID marker"
                >
                  {copiedId === `id-${block.blockId}` ? (
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
              {block.content}
            </div>
          </div>
        ))}
      </div>

      {/* Help */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-800 dark:text-blue-200">
        <p className="font-semibold mb-1">Usage:</p>
        <ul className="space-y-1 ml-4 list-disc">
          <li>First button copies: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">![[{fileSlug}#block-id]]</code></li>
          <li>Second button copies: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">^block-id</code> to mark blocks</li>
          <li>Paste transclusion syntax in any file to embed the block</li>
        </ul>
      </div>
    </div>
  );
}
