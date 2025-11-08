'use client';

import React, { useMemo } from 'react';
import { Bold, Italic, Link2, Sparkles, Hash, Copy } from 'lucide-react';

export interface SelectionActionBarProps {
  /** Selected text */
  selectedText: string;
  /** Position of the selection */
  selectionRect: DOMRect | null;
  /** Callback when creating a wikilink */
  onCreateLink?: () => void;
  /** Callback for AI assistance */
  onAIAssist?: () => void;
  /** Callback for adding a tag */
  onAddTag?: () => void;
  /** Callback for copying */
  onCopy?: () => void;
  /** Callback for making bold */
  onBold?: () => void;
  /** Callback for making italic */
  onItalic?: () => void;
  /** Theme for styling */
  theme?: 'light' | 'dark';
}

/**
 * Floating action bar that appears when text is selected
 * Provides quick formatting and linking options
 */
export function SelectionActionBar({
  selectedText,
  selectionRect,
  onCreateLink,
  onAIAssist,
  onAddTag,
  onCopy,
  onBold,
  onItalic,
  theme = 'light',
}: SelectionActionBarProps) {
  const position = useMemo(() => {
    if (selectionRect && selectedText) {
      const top = selectionRect.top + window.scrollY - 50;
      const left = selectionRect.left + selectionRect.width / 2;
      return { top, left };
    }
    return null;
  }, [selectionRect, selectedText]);

  if (!position || !selectedText) {
    return null;
  }

  const isDark = theme === 'dark';

  return (
    <div
      className="fixed z-50 transform -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div
        className={`
          flex items-center gap-1 px-2 py-1 rounded-lg shadow-lg border
          ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        `}
      >
        {/* Bold */}
        {onBold && (
          <button
            onClick={onBold}
            className={`
              p-2 rounded hover:bg-opacity-10 transition-colors
              ${isDark ? 'hover:bg-white' : 'hover:bg-black'}
            `}
            title="Bold"
          >
            <Bold className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
          </button>
        )}

        {/* Italic */}
        {onItalic && (
          <button
            onClick={onItalic}
            className={`
              p-2 rounded hover:bg-opacity-10 transition-colors
              ${isDark ? 'hover:bg-white' : 'hover:bg-black'}
            `}
            title="Italic"
          >
            <Italic className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
          </button>
        )}

        {/* Divider */}
        {(onBold || onItalic) && (onCreateLink || onAIAssist || onAddTag || onCopy) && (
          <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
        )}

        {/* Create Link */}
        {onCreateLink && (
          <button
            onClick={onCreateLink}
            className={`
              p-2 rounded hover:bg-opacity-10 transition-colors
              ${isDark ? 'hover:bg-white' : 'hover:bg-black'}
            `}
            title="Create link [[...]]"
          >
            <Link2 className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
          </button>
        )}

        {/* AI Assist */}
        {onAIAssist && (
          <button
            onClick={onAIAssist}
            className={`
              p-2 rounded hover:bg-opacity-10 transition-colors
              ${isDark ? 'hover:bg-white' : 'hover:bg-black'}
            `}
            title="AI assist"
          >
            <Sparkles className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
          </button>
        )}

        {/* Add Tag */}
        {onAddTag && (
          <button
            onClick={onAddTag}
            className={`
              p-2 rounded hover:bg-opacity-10 transition-colors
              ${isDark ? 'hover:bg-white' : 'hover:bg-black'}
            `}
            title="Add tag #..."
          >
            <Hash className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
          </button>
        )}

        {/* Copy */}
        {onCopy && (
          <button
            onClick={onCopy}
            className={`
              p-2 rounded hover:bg-opacity-10 transition-colors
              ${isDark ? 'hover:bg-white' : 'hover:bg-black'}
            `}
            title="Copy"
          >
            <Copy className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
          </button>
        )}
      </div>

      {/* Arrow pointing down */}
      <div
        className={`
          absolute left-1/2 transform -translate-x-1/2 w-3 h-3 rotate-45
          ${isDark ? 'bg-gray-800 border-r border-b border-gray-700' : 'bg-white border-r border-b border-gray-200'}
        `}
        style={{ top: '100%', marginTop: '-6px' }}
      />
    </div>
  );
}
