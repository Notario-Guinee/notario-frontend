// Hook utilitaire pour les actions asynchrones
// Gère automatiquement loading, error, et les toasts Sonner
// Usage :
//   const { run, loading, error } = useAsyncAction()
//   await run(async () => { ... })  → affiche toast.error automatiquement si ça throw

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseAsyncActionReturn {
  run: <T>(action: () => Promise<T>) => Promise<T | undefined>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export function useAsyncAction(options?: {
  successMessage?: string;
  errorMessage?: string;
}): UseAsyncActionReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async <T>(action: () => Promise<T>): Promise<T | undefined> => {
      setLoading(true);
      setError(null);
      try {
        const result = await action();
        if (options?.successMessage) {
          toast.success(options.successMessage);
        }
        return result;
      } catch (err) {
        const message =
          options?.errorMessage ??
          (err instanceof Error ? err.message : String(err));
        setError(message);
        toast.error(message);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [options?.successMessage, options?.errorMessage]
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { run, loading, error, reset };
}
