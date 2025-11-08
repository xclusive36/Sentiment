'use client';

import React, { useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { createLowlight, common } from 'lowlight';

const lowlight = createLowlight(common);
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Undo,
  Redo,
  Link2,
  Table as TableIcon,
} from 'lucide-react';

export interface WYSIWYGEditorProps {
  /** Initial content as Markdown */
  content?: string;
  /** Callback when content changes (returns Markdown) */
  onChange?: (markdown: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the editor is editable */
  editable?: boolean;
  /** Theme for styling */
  theme?: 'light' | 'dark';
  /** Additional CSS classes */
  className?: string;
}

/**
 * WYSIWYG Markdown editor using TipTap
 * Converts between visual editing and Markdown
 */
export function WYSIWYGEditor({
  content = '',
  onChange,
  placeholder = 'Start typing...',
  editable = true,
  theme = 'light',
  className = '',
}: WYSIWYGEditorProps) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        codeBlock: false, // We'll use CodeBlockLowlight instead
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline cursor-pointer',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-gray-100 dark:bg-gray-800 rounded p-4 my-2',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    [placeholder]
  );

  const editor = useEditor({
    extensions,
    content,
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        // @ts-expect-error - Markdown extension adds this to storage
        const markdown = editor.storage.markdown?.getMarkdown?.() || editor.getHTML();
        onChange(markdown);
      }
    },
  });

  useEffect(() => {
    // @ts-expect-error - Markdown extension adds this to storage
    if (editor && content !== editor.storage.markdown?.getMarkdown?.()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  if (!editor) {
    return null;
  }

  const isDark = theme === 'dark';

  return (
    <div className={`wysiwyg-editor ${className}`}>
      {editable && (
        <>
          {/* Toolbar */}
          <div
            className={`
              sticky top-0 z-10 border-b p-2 flex flex-wrap gap-1
              ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
            `}
          >
            {/* Text formatting */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              title="Bold"
              theme={theme}
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              title="Italic"
              theme={theme}
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive('strike')}
              title="Strikethrough"
              theme={theme}
            >
              <Strikethrough className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              active={editor.isActive('code')}
              title="Code"
              theme={theme}
            >
              <Code className="w-4 h-4" />
            </ToolbarButton>

            <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

            {/* Headings */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive('heading', { level: 1 })}
              title="Heading 1"
              theme={theme}
            >
              <Heading1 className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })}
              title="Heading 2"
              theme={theme}
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive('heading', { level: 3 })}
              title="Heading 3"
              theme={theme}
            >
              <Heading3 className="w-4 h-4" />
            </ToolbarButton>

            <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

            {/* Lists */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              title="Bullet list"
              theme={theme}
            >
              <List className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
              title="Numbered list"
              theme={theme}
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              active={editor.isActive('taskList')}
              title="Task list"
              theme={theme}
            >
              <CheckSquare className="w-4 h-4" />
            </ToolbarButton>

            <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

            {/* Blocks */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive('blockquote')}
              title="Blockquote"
              theme={theme}
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              active={editor.isActive('codeBlock')}
              title="Code block"
              theme={theme}
            >
              <Code className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal rule"
              theme={theme}
            >
              <Minus className="w-4 h-4" />
            </ToolbarButton>

            <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

            {/* Link */}
            <ToolbarButton
              onClick={() => {
                const url = window.prompt('URL:');
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                }
              }}
              active={editor.isActive('link')}
              title="Add link"
              theme={theme}
            >
              <Link2 className="w-4 h-4" />
            </ToolbarButton>

            {/* Table */}
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              }
              title="Insert table"
              theme={theme}
            >
              <TableIcon className="w-4 h-4" />
            </ToolbarButton>

            <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

            {/* Undo/Redo */}
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
              theme={theme}
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
              theme={theme}
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>
          </div>
        </>
      )}

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className={`
          prose max-w-none p-4
          ${isDark ? 'prose-invert' : ''}
          ${!editable ? 'pointer-events-none' : ''}
        `}
      />

      {/* Table controls (when table is active) */}
      {editable && editor.isActive('table') && (
        <div
          className={`
            sticky bottom-0 border-t p-2 flex gap-2
            ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
          `}
        >
          <button
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            className={`px-2 py-1 text-xs rounded ${
              isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            + Column Before
          </button>
          <button
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className={`px-2 py-1 text-xs rounded ${
              isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            + Column After
          </button>
          <button
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className={`px-2 py-1 text-xs rounded ${
              isDark ? 'bg-red-900 hover:bg-red-800' : 'bg-red-100 hover:bg-red-200'
            }`}
          >
            - Column
          </button>
          <div className={`w-px ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
          <button
            onClick={() => editor.chain().focus().addRowBefore().run()}
            className={`px-2 py-1 text-xs rounded ${
              isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            + Row Before
          </button>
          <button
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className={`px-2 py-1 text-xs rounded ${
              isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            + Row After
          </button>
          <button
            onClick={() => editor.chain().focus().deleteRow().run()}
            className={`px-2 py-1 text-xs rounded ${
              isDark ? 'bg-red-900 hover:bg-red-800' : 'bg-red-100 hover:bg-red-200'
            }`}
          >
            - Row
          </button>
          <div className={`w-px ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
          <button
            onClick={() => editor.chain().focus().deleteTable().run()}
            className={`px-2 py-1 text-xs rounded ${
              isDark ? 'bg-red-900 hover:bg-red-800' : 'bg-red-100 hover:bg-red-200'
            }`}
          >
            Delete Table
          </button>
        </div>
      )}
    </div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md';
}

function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
  theme = 'light',
  size = 'md',
}: ToolbarButtonProps) {
  const isDark = theme === 'dark';
  const padding = size === 'sm' ? 'p-1' : 'p-2';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        ${padding} rounded transition-colors
        ${
          active
            ? isDark
              ? 'bg-blue-900 text-blue-100'
              : 'bg-blue-100 text-blue-900'
            : isDark
              ? 'hover:bg-gray-800 text-gray-300'
              : 'hover:bg-gray-100 text-gray-700'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  );
}
