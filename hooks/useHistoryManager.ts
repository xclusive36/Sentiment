import { useRef, useCallback } from 'react';
import { HistoryManager, EditorState, HistoryManagerConfig } from '@/lib/history-manager';

export interface UseHistoryManagerResult {
  push: (content: string, cursorPosition: number) => void;
  pushImmediate: (content: string, cursorPosition: number) => void;
  undo: () => EditorState | null;
  redo: () => EditorState | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
  getCurrentState: () => EditorState | null;
}

/**
 * React hook for history management (undo/redo)
 * 
 * @param config - History manager configuration
 * @returns History manager interface
 * 
 * @example
 * ```tsx
 * const { push, undo, redo, canUndo, canRedo } = useHistoryManager({
 *   maxSize: 100,
 *   debounceMs: 500,
 * });
 * 
 * // Push state when content changes
 * useEffect(() => {
 *   push(content, cursorPosition);
 * }, [content]);
 * 
 * // Undo/Redo
 * const handleUndo = () => {
 *   const prevState = undo();
 *   if (prevState) {
 *     setContent(prevState.content);
 *     setCursor(prevState.cursorPosition);
 *   }
 * };
 * ```
 */
export function useHistoryManager(config?: HistoryManagerConfig): UseHistoryManagerResult {
  const managerRef = useRef<HistoryManager | null>(null);

  // Initialize manager on first render
  if (managerRef.current == null) {
    managerRef.current = new HistoryManager(config);
  }

  const push = useCallback((content: string, cursorPosition: number) => {
    managerRef.current?.push(content, cursorPosition);
  }, []);

  const pushImmediate = useCallback((content: string, cursorPosition: number) => {
    managerRef.current?.pushImmediate(content, cursorPosition);
  }, []);

  const undo = useCallback(() => {
    return managerRef.current?.undo() || null;
  }, []);

  const redo = useCallback(() => {
    return managerRef.current?.redo() || null;
  }, []);

  const canUndo = useCallback(() => {
    return managerRef.current?.canUndo() || false;
  }, []);

  const canRedo = useCallback(() => {
    return managerRef.current?.canRedo() || false;
  }, []);

  const clear = useCallback(() => {
    managerRef.current?.clear();
  }, []);

  const getCurrentState = useCallback(() => {
    return managerRef.current?.getCurrentState() || null;
  }, []);

  return {
    push,
    pushImmediate,
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
    getCurrentState,
  };
}
