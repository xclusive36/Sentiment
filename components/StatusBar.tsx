'use client';

import { FileText, Clock, Hash, Link2, LucideIcon } from 'lucide-react';

interface StatusBarProps {
  wordCount?: number;
  readingTime?: number;
  linkCount?: number;
  tagCount?: number;
  currentNoteName?: string;
  theme?: 'light' | 'dark';
  onStatsClick?: () => void;
}

interface StatItemProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  theme: 'light' | 'dark';
  onStatsClick?: () => void;
}

function StatItem({ icon: Icon, value, label, theme, onStatsClick }: StatItemProps) {
  return (
    <div
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors cursor-pointer hover:bg-opacity-80 sm:gap-2 sm:px-3 sm:text-sm"
      style={{
        backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
        color: theme === 'dark' ? '#d1d5db' : '#4b5563',
      }}
      onClick={onStatsClick}
      title={`${value} ${label}`}
    >
      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
      <span className="font-medium whitespace-nowrap">
        <span className="hidden sm:inline">{label}: </span>
        {value}
      </span>
    </div>
  );
}

export default function StatusBar({
  wordCount = 0,
  readingTime = 0,
  linkCount = 0,
  tagCount = 0,
  currentNoteName,
  theme = 'light',
  onStatsClick,
}: StatusBarProps) {
  return (
    <div
      className="flex flex-col gap-2 border-t px-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4"
      style={{
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
      }}
    >
      {/* Left: Document Info */}
      <div className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
        {currentNoteName && (
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="font-medium truncate">{currentNoteName}</span>
          </div>
        )}
      </div>

      {/* Right: Stats */}
      <div className="flex items-center gap-1 overflow-x-auto sm:gap-2">
        <StatItem icon={FileText} value={wordCount} label="words" theme={theme} onStatsClick={onStatsClick} />
        <StatItem icon={Clock} value={readingTime} label="min" theme={theme} onStatsClick={onStatsClick} />
        <StatItem icon={Link2} value={linkCount} label="links" theme={theme} onStatsClick={onStatsClick} />
        <StatItem icon={Hash} value={tagCount} label="tags" theme={theme} onStatsClick={onStatsClick} />
      </div>
    </div>
  );
}
