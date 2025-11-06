'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function FileUpload() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.name.endsWith('.md')
    );

    if (files.length === 0) {
      alert('Please drop only .md files');
      return;
    }

    await uploadFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await uploadFiles(files);
  };

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);

    try {
      const uploads = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderPath', '');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Upload failed');
        }

        return response.json();
      });

      await Promise.all(uploads);
      alert(`Successfully uploaded ${files.length} file(s)`);
      router.refresh();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload one or more files. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="mb-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".md"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600 dark:text-slate-400">Uploading files...</p>
          </div>
        ) : (
          <>
            <svg
              className="w-12 h-12 mx-auto mb-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-slate-700 dark:text-slate-300 mb-2 font-medium">
              Drag and drop markdown files here
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              or
            </p>
            <label
              htmlFor="file-upload"
              className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors"
            >
              Browse Files
            </label>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
              Only .md files are supported
            </p>
          </>
        )}
      </div>
    </div>
  );
}
