/**
 * Word Count Plugin
 * Displays word count, character count, and reading time
 */

import { Plugin, type PluginManifest } from '@/lib/plugin-system';

export class WordCountPlugin extends Plugin {
  private statusElement: HTMLElement | null = null;

  constructor() {
    const manifest: PluginManifest = {
      id: 'word-count',
      name: 'Word Count',
      version: '1.0.0',
      description: 'Display word count, character count, and estimated reading time',
      author: 'Sentiment',
      icon: '📊',
    };
    super(manifest);
  }

  async onLoad(): Promise<void> {
    // Register command to show word count
    this.context.registerCommand({
      id: 'show-stats',
      name: 'Show Document Statistics',
      description: 'Display word count, character count, and reading time',
      icon: '📊',
      callback: () => this.showStats(),
    });

    // Listen for content changes (typed)
    this.context.on('editor:change', (content) => {
      this.updateStats(content);
    });

    console.log('Word Count plugin loaded');
  }

  async onUnload(): Promise<void> {
    if (this.statusElement) {
      this.statusElement.remove();
      this.statusElement = null;
    }
    console.log('Word Count plugin unloaded');
  }

  private updateStats(content: string): void {
    const stats = this.calculateStats(content);
    // Update UI (would integrate with status bar)
    console.log('Document stats:', stats);
  }

  private showStats(): void {
    // This would show a modal with detailed stats
    this.context.showNotification('Stats feature coming soon!', 'info');
  }

  private calculateStats(text: string): {
    words: number;
    characters: number;
    charactersNoSpaces: number;
    readingTime: number;
  } {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const readingTime = Math.ceil(words / 200); // 200 words per minute

    return {
      words,
      characters,
      charactersNoSpaces,
      readingTime,
    };
  }
}
