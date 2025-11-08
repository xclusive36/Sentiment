'use client';

import { Save, FilePlus, Eye, Edit3, Columns, LucideIcon } from 'lucide-react';

interface ToolbarAreaProps {
  onSave?: () => void;
  onNewNote?: () => void;
  viewMode?: 'edit' | 'preview' | 'split';
  onViewModeChange?: (mode: 'edit' | 'preview' | 'split') => void;
  isSaving?: boolean;
  canSave?: boolean;
  theme?: 'light' | 'dark';
  isLeftSidebarCollapsed?: boolean;
}

interface ViewModeButtonProps {
  mode: 'edit' | 'preview' | 'split';
  icon: LucideIcon;
  label: string;
  viewMode: 'edit' | 'preview' | 'split';
  onViewModeChange?: (mode: 'edit' | 'preview' | 'split') => void;
  buttonClass: string;
  primaryClass: string;
  theme: 'light' | 'dark';
}

function ViewModeButton({
  mode,
  icon: Icon,
  label,
  viewMode,
  onViewModeChange,
  buttonClass,
  primaryClass,
  theme,
}: ViewModeButtonProps) {
  const isActive = viewMode === mode;
  return (
    <button
      onClick={() => onViewModeChange?.(mode)}
      className={`${buttonClass} ${
        isActive
          ? primaryClass
          : theme === 'dark'
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            : 'bg-white hover:bg-gray-50 text-gray-600'
      }`}
      aria-label={label}
      title={label}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default function ToolbarArea({
  onSave,
  onNewNote,
  viewMode = 'edit',
  onViewModeChange,
  isSaving = false,
  canSave = true,
  theme = 'light',
  isLeftSidebarCollapsed = false,
}: ToolbarAreaProps) {
  const buttonClass = `flex items-center gap-1 px-2 py-1.5 text-xs rounded-md transition-colors font-medium sm:gap-2 sm:px-4 sm:py-2 sm:text-sm`;
  const primaryClass =
    theme === 'dark'
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white';
  const secondaryClass =
    theme === 'dark'
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700';
  const disabledClass = 'opacity-50 cursor-not-allowed';

  return (
    <div
      className="sticky top-0 z-20 border-b"
      style={{
        backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
        transition: 'padding-left 0.3s ease',
        paddingLeft: isLeftSidebarCollapsed ? '48px' : '0',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-2 sm:gap-4 sm:px-4">
        {/* Left: Quick Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={onSave}
            disabled={!canSave || isSaving}
            className={`${buttonClass} ${primaryClass} ${!canSave || isSaving ? disabledClass : ''}`}
            aria-label="Save"
          >
            <Save className="w-4 h-4" />
            <span className="text-xs sm:text-sm">{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
          <button
            onClick={onNewNote}
            className={`${buttonClass} ${secondaryClass}`}
            aria-label="New Note"
          >
            <FilePlus className="w-4 h-4" />
            <span className="hidden text-xs sm:text-sm md:inline">New</span>
          </button>
        </div>

        {/* Right: View Mode Switcher */}
        <div className="flex items-center gap-1">
          <ViewModeButton
            mode="edit"
            icon={Edit3}
            label="Edit"
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            buttonClass={buttonClass}
            primaryClass={primaryClass}
            theme={theme}
          />
          <ViewModeButton
            mode="preview"
            icon={Eye}
            label="Preview"
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            buttonClass={buttonClass}
            primaryClass={primaryClass}
            theme={theme}
          />
          <ViewModeButton
            mode="split"
            icon={Columns}
            label="Split"
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            buttonClass={buttonClass}
            primaryClass={primaryClass}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
}
