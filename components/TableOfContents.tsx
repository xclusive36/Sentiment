'use client';

import { useEffect, useState, useMemo } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  // Parse headings from markdown using useMemo
  const parsedHeadings = useMemo(() => {
    const headings: Heading[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        headings.push({ id, text, level });
      }
    });

    return headings;
  }, [content]);

  useEffect(() => {
    setHeadings(parsedHeadings);
  }, [parsedHeadings]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 sticky top-8">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h7"
          />
        </svg>
        Table of Contents
      </h3>
      <ul className="space-y-2">
        {headings.map(({ id, text, level }) => (
          <li key={id} style={{ paddingLeft: `${(level - 1) * 12}px` }}>
            <a
              href={`#${id}`}
              className={`block text-sm py-1 transition-colors ${
                activeId === id
                  ? 'text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-300'
              }`}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
