import { useState, useCallback } from 'react';

export interface UseLoadingStateReturn {
  /** Whether the operation is currently loading */
  isLoading: boolean;
  /** Error message if operation failed */
  error: string | null;
  /** Start loading state */
  startLoading: () => void;
  /** Set error and stop loading */
  setError: (error: string | Error) => void;
  /** Stop loading successfully */
  stopLoading: () => void;
  /** Reset loading state and error */
  reset: () => void;
  /** Execute an async operation with automatic loading state management */
  execute: <T>(operation: () => Promise<T>) => Promise<T>;
}

/**
 * Hook for managing loading states and errors in async operations
 * Simplifies loading indicator management and error handling
 * 
 * @example
 * ```tsx
 * const { isLoading, error, execute } = useLoadingState();
 * 
 * const handleSave = async () => {
 *   await execute(async () => {
 *     await saveData();
 *   });
 * };
 * 
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error} />;
 * ```
 */
export function useLoadingState(): UseLoadingStateReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setErrorState(null);
  }, []);

  const setError = useCallback((err: string | Error) => {
    setIsLoading(false);
    setErrorState(err instanceof Error ? err.message : err);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setErrorState(null);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setErrorState(null);
  }, []);

  const execute = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    startLoading();
    try {
      const result = await operation();
      stopLoading();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Operation failed'));
      throw err;
    }
  }, [startLoading, stopLoading, setError]);

  return {
    isLoading,
    error,
    startLoading,
    setError,
    stopLoading,
    reset,
    execute,
  };
}
