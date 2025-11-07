'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcutsProps {
  onCommandPalette: () => void;
}

export default function KeyboardShortcuts({ onCommandPalette }: KeyboardShortcutsProps) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const modifier = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + P: Command Palette
      if (modifier && e.key === 'p') {
        e.preventDefault();
        onCommandPalette();
        return;
      }

      // Cmd/Ctrl + E: New Note
      if (modifier && e.key === 'e') {
        e.preventDefault();
        router.push('/new');
        return;
      }

      // Cmd/Ctrl + K: Search
      if (modifier && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // Cmd/Ctrl + G: Graph View
      if (modifier && e.key === 'g') {
        e.preventDefault();
        router.push('/graph');
        return;
      }

      // Cmd/Ctrl + J: Daily Journal
      if (modifier && e.key === 'j') {
        e.preventDefault();
        router.push('/journal');
        return;
      }

      // Escape: Clear focus
      if (e.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router, onCommandPalette]);

  return null; // This component doesn't render anything
}
