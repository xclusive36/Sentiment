'use client';

import React from 'react';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
}

export interface EmptyStateProps {
  /** Icon or illustration to display */
  icon?: React.ReactNode;
  /** Main heading */
  title: string;
  /** Descriptive text */
  description?: string;
  /** Action buttons */
  actions?: EmptyStateAction[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Empty state component for displaying helpful messages when lists are empty
 * Improves UX by guiding users on what to do next
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<FileText className="w-12 h-12" />}
 *   title="No notes yet"
 *   description="Create your first note to get started"
 *   actions={[
 *     {
 *       label: 'Create Note',
 *       onClick: () => createNote(),
 *       variant: 'primary',
 *       icon: <Plus className="w-4 h-4" />
 *     }
 *   ]}
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  actions,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      {/* Icon */}
      {icon && (
        <div className="mb-4 text-gray-400 dark:text-gray-600">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mb-6">
          {description}
        </p>
      )}

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
                transition-colors duration-200
                ${
                  action.variant === 'primary'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100'
                }
              `}
            >
              {action.icon && <span>{action.icon}</span>}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
