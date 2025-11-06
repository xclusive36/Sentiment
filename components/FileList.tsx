'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  pointerWithin,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileData, FolderData, FileStructure } from '@/lib/files';

interface FileListProps {
  initialStructure: FileStructure;
}

interface SortableFileCardProps {
  file: FileData;
  formatFileSize: (bytes: number) => string;
  formatDate: (date: Date) => string;
}

interface SortableFolderProps {
  folder: FolderData;
  formatFileSize: (bytes: number) => string;
  formatDate: (date: Date) => string;
  level: number;
}

function SortableFileCard({ file, formatFileSize, formatDate }: SortableFileCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id, data: { type: 'file', file } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 p-2 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
          aria-label="Drag to reorder"
          suppressHydrationWarning
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </button>
        <Link
          href={`/file/${encodeURIComponent(file.relativePath)}`}
          className="flex-1 block p-6 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                📄 {file.title}
              </h3>
              {/* Show folder path if file is nested */}
              {file.relativePath.includes('/') && (
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  {file.relativePath.split('/').slice(0, -1).join(' / ')}
                </div>
              )}
            </div>
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
              {formatFileSize(file.stats.size)}
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
            {file.excerpt}
          </p>
          {file.tags && file.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {file.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-6 text-sm text-slate-500 dark:text-slate-400">
            <div>
              <span className="font-medium">Modified:</span>{' '}
              {formatDate(file.stats.modified)}
            </div>
            <div>
              <span className="font-medium">Created:</span>{' '}
              {formatDate(file.stats.created)}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

function SortableFolder({ folder, formatFileSize, formatDate, level }: SortableFolderProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { setNodeRef, isOver: isDragOver } = useSortable({ 
    id: folder.id, 
    data: { type: 'folder', folder }
  });

  const allItems = [...folder.files.map(f => f.id), ...folder.subfolders.map(f => f.id)];
  const indent = level * 32; // Increased indentation for better visibility

  // Color coding by depth
  const depthColors = [
    'border-l-4 border-l-blue-400',
    'border-l-4 border-l-green-400',
    'border-l-4 border-l-purple-400',
    'border-l-4 border-l-orange-400',
    'border-l-4 border-l-pink-400',
  ];
  const depthColor = depthColors[level % depthColors.length];

  return (
    <div ref={setNodeRef} style={{ marginLeft: `${indent}px` }} className="mb-2">
      <div 
        className={`flex items-center gap-2 p-3 rounded-lg transition-all ${
          isDragOver ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-400' : `bg-slate-50 dark:bg-slate-700/50 ${depthColor}`
        }`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {folder.name}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          ({folder.files.length + folder.subfolders.length} items)
        </span>
      </div>

      {isOpen && (
        <div className="mt-2 relative">
          {/* Vertical line indicator for hierarchy */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
          <SortableContext items={allItems} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 pl-6">
              {folder.subfolders.map((subfolder) => (
                <SortableFolder
                  key={subfolder.id}
                  folder={subfolder}
                  formatFileSize={formatFileSize}
                  formatDate={formatDate}
                  level={level + 1}
                />
              ))}
              {folder.files.map((file) => (
                <SortableFileCard
                  key={file.id}
                  file={file}
                  formatFileSize={formatFileSize}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      )}
    </div>
  );
}

export default function FileList({ initialStructure }: FileListProps) {
  const [structure, setStructure] = useState<FileStructure>(initialStructure);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const saveOrder = async (files: FileData[], folders: FolderData[], folderPath: string = '') => {
    try {
      await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath,
          files: files.map(f => f.id),
          folders: folders.map(f => f.id),
        }),
      });
    } catch (error) {
      console.error('Failed to save order:', error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // If dropped on a folder, move file into folder
    if (activeData?.type === 'file' && overData?.type === 'folder') {
      const file = activeData.file as FileData;
      const folder = overData.folder as FolderData;
      const fileName = file.relativePath.split('/').pop();
      const newPath = `${folder.path}/${fileName}`;

      try {
        const response = await fetch('/api/move-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldPath: file.relativePath, newPath }),
        });

        if (response.ok) {
          // Refresh the page to show updated structure
          window.location.reload();
        }
      } catch (error) {
        console.error('Failed to move file:', error);
      }
    }

    // Reorder within same level
    if (activeData?.type === 'file' && overData?.type === 'file') {
      setStructure((prev) => {
        const newFiles = [...prev.files];
        const oldIndex = newFiles.findIndex((f) => f.id === active.id);
        const newIndex = newFiles.findIndex((f) => f.id === over.id);
        const reordered = arrayMove(newFiles, oldIndex, newIndex);
        
        // Save order to backend
        saveOrder(reordered, prev.folders);
        
        return {
          ...prev,
          files: reordered,
        };
      });
    }
    
    // Reorder folders
    if (activeData?.type === 'folder' && overData?.type === 'folder') {
      setStructure((prev) => {
        const newFolders = [...prev.folders];
        const oldIndex = newFolders.findIndex((f) => f.id === active.id);
        const newIndex = newFolders.findIndex((f) => f.id === over.id);
        const reordered = arrayMove(newFolders, oldIndex, newIndex);
        
        // Save order to backend
        saveOrder(prev.files, reordered);
        
        return {
          ...prev,
          folders: reordered,
        };
      });
    }
  };


  const allItemIds = [
    ...structure.files.map(f => f.id),
    ...structure.folders.map(f => f.id),
  ];

  if (structure.files.length === 0 && structure.folders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400 mb-4">
          No markdown files found in the markdown directory.
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-500">
          Add .md files to the{' '}
          <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
            markdown/
          </code>{' '}
          folder to get started.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={allItemIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {structure.folders.map((folder) => (
            <SortableFolder
              key={folder.id}
              folder={folder}
              formatFileSize={formatFileSize}
              formatDate={formatDate}
              level={0}
            />
          ))}
          {structure.files.map((file) => (
            <SortableFileCard
              key={file.id}
              file={file}
              formatFileSize={formatFileSize}
              formatDate={formatDate}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
