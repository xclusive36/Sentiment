'use client';

import { useState, ReactNode } from 'react';

interface CollapsibleSidebarProps {
  children: ReactNode;
  title?: string;
  defaultOpen?: boolean;
  position?: 'left' | 'right';
}

export default function CollapsibleSidebar({ 
  children, 
  title = 'Files',
  defaultOpen = true,
  position = 'left'
}: CollapsibleSidebarProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed ${position === 'left' ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 z-30 bg-slate-800 dark:bg-slate-700 text-white p-2 ${position === 'left' ? 'rounded-r-lg' : 'rounded-l-lg'} shadow-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors`}
        title={`Show ${title}`}
      >
        <svg 
          className={`w-5 h-5 ${position === 'right' ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    );
  }

  return (
    <div className={`fixed ${position === 'left' ? 'left-0' : 'right-0'} top-0 bottom-0 z-30 w-80 bg-white dark:bg-slate-800 border-${position === 'left' ? 'r' : 'l'} border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col`}>
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          title={`Hide ${title}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </div>
  );
}
