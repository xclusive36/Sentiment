/**
 * Global application state using Zustand
 * Provides centralized state management for the PKM application
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EditorState {
  /** Currently open file */
  currentFile: string | null;
  /** Editor content */
  content: string;
  /** Whether the content has unsaved changes */
  isDirty: boolean;
  /** Editor mode: 'wysiwyg' or 'markdown' */
  mode: 'wysiwyg' | 'markdown';
}

export interface UIState {
  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;
  /** Theme */
  theme: 'light' | 'dark' | 'system';
  /** Font size */
  fontSize: 'small' | 'medium' | 'large';
  /** Command palette open */
  commandPaletteOpen: boolean;
}

export interface SearchState {
  /** Current search query */
  query: string;
  /** Search results */
  results: string[];
  /** Vector search enabled */
  vectorSearchEnabled: boolean;
}

export interface PluginState {
  /** Enabled plugins */
  enabledPlugins: Set<string>;
  /** Plugin settings */
  pluginSettings: Record<string, Record<string, unknown>>;
}

interface AppState {
  // Editor state
  editor: EditorState;
  setCurrentFile: (file: string | null) => void;
  setContent: (content: string) => void;
  setIsDirty: (dirty: boolean) => void;
  setEditorMode: (mode: 'wysiwyg' | 'markdown') => void;

  // UI state
  ui: UIState;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  toggleCommandPalette: () => void;

  // Search state
  search: SearchState;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: string[]) => void;
  toggleVectorSearch: () => void;

  // Plugin state
  plugins: PluginState;
  enablePlugin: (pluginId: string) => void;
  disablePlugin: (pluginId: string) => void;
  setPluginSetting: (pluginId: string, key: string, value: unknown) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial editor state
      editor: {
        currentFile: null,
        content: '',
        isDirty: false,
        mode: 'markdown',
      },

      setCurrentFile: (file) =>
        set((state) => ({
          editor: { ...state.editor, currentFile: file },
        })),

      setContent: (content) =>
        set((state) => ({
          editor: { ...state.editor, content, isDirty: true },
        })),

      setIsDirty: (dirty) =>
        set((state) => ({
          editor: { ...state.editor, isDirty: dirty },
        })),

      setEditorMode: (mode) =>
        set((state) => ({
          editor: { ...state.editor, mode },
        })),

      // Initial UI state
      ui: {
        sidebarCollapsed: false,
        theme: 'system',
        fontSize: 'medium',
        commandPaletteOpen: false,
      },

      toggleSidebar: () =>
        set((state) => ({
          ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed },
        })),

      setTheme: (theme) =>
        set((state) => ({
          ui: { ...state.ui, theme },
        })),

      setFontSize: (fontSize) =>
        set((state) => ({
          ui: { ...state.ui, fontSize },
        })),

      toggleCommandPalette: () =>
        set((state) => ({
          ui: { ...state.ui, commandPaletteOpen: !state.ui.commandPaletteOpen },
        })),

      // Initial search state
      search: {
        query: '',
        results: [],
        vectorSearchEnabled: false,
      },

      setSearchQuery: (query) =>
        set((state) => ({
          search: { ...state.search, query },
        })),

      setSearchResults: (results) =>
        set((state) => ({
          search: { ...state.search, results },
        })),

      toggleVectorSearch: () =>
        set((state) => ({
          search: { ...state.search, vectorSearchEnabled: !state.search.vectorSearchEnabled },
        })),

      // Initial plugin state
      plugins: {
        enabledPlugins: new Set(),
        pluginSettings: {},
      },

      enablePlugin: (pluginId) =>
        set((state) => {
          const newEnabledPlugins = new Set(state.plugins.enabledPlugins);
          newEnabledPlugins.add(pluginId);
          return {
            plugins: { ...state.plugins, enabledPlugins: newEnabledPlugins },
          };
        }),

      disablePlugin: (pluginId) =>
        set((state) => {
          const newEnabledPlugins = new Set(state.plugins.enabledPlugins);
          newEnabledPlugins.delete(pluginId);
          return {
            plugins: { ...state.plugins, enabledPlugins: newEnabledPlugins },
          };
        }),

      setPluginSetting: (pluginId, key, value) =>
        set((state) => ({
          plugins: {
            ...state.plugins,
            pluginSettings: {
              ...state.plugins.pluginSettings,
              [pluginId]: {
                ...state.plugins.pluginSettings[pluginId],
                [key]: value,
              },
            },
          },
        })),
    }),
    {
      name: 'sentiment-storage',
      partialize: (state) => ({
        ui: state.ui,
        search: { vectorSearchEnabled: state.search.vectorSearchEnabled },
        plugins: {
          enabledPlugins: Array.from(state.plugins.enabledPlugins),
          pluginSettings: state.plugins.pluginSettings,
        },
      }),
    }
  )
);

// Selectors for optimized re-renders
export const useEditorState = () => useStore((state) => state.editor);
export const useUIState = () => useStore((state) => state.ui);
export const useSearchState = () => useStore((state) => state.search);
export const usePluginState = () => useStore((state) => state.plugins);
