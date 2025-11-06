'use client';

import { useState } from 'react';

interface TagFilterProps {
  allTags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export default function TagFilter({ allTags, selectedTags, onTagsChange }: TagFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const clearAll = () => {
    onTagsChange([]);
  };

  if (allTags.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <span className="text-slate-700 dark:text-slate-300 font-medium">
          Filter by Tags
          {selectedTags.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
              {selectedTags.length}
            </span>
          )}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Available Tags ({allTags.length})
            </h3>
            {selectedTags.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
