import { useMemo, useState } from "react";
import { UseAPIStore } from "./types";
import { useStore } from "./store";

export function useMutation<
  R extends Record<string, any>,
  A extends Array<any>
>(
  config: UseAPIStore.UseMutationConfig<R, A>,
  deps: any[] = [],
): UseAPIStore.UseMutationReturn<R, A> {

  const {
    mutate
  } = config;

  const store = useStore();
  const [error, setError] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function makeMutation(...args: A) {
    try {
      setIsLoading(true);
      let result = null;
      try { result = await mutate(...args); }
      catch (error) { setError(String(error)); }
      store.upsert(result);
      return result;
    }
    finally { setIsLoading(false); }

    return null;
  }

  return useMemo(() => ({
    error,
    isLoading,
    mutate: makeMutation,
  }), [isLoading, error, ...deps])
}