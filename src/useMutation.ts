import { useMemo, useState } from "react";
import { UseAPIStore } from "./types";
import { useStore } from "./store";

export function useMutation<
  R extends Record<string, any>,
  A extends Array<any>
>(
  config: UseAPIStore.UseMutationConfig<R, A>,
  deps: any[] = []
): UseAPIStore.UseMutationReturn<R, A> {
  const { mutate } = config;

  const store = useStore();
  const [error, setError] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function makeMutation(...args: A) {
    setIsLoading(true);
    setError(null);
    let result = null;
    try {
      result = await mutate(...args);
    } catch (error) {
      setError(String(error));
    } finally {
      setIsLoading(false);
    }
    if (result) store.mutate(result);
    return result;
  }

  if (config.throwError && error !== null) throw error;

  return useMemo(
    () => ({
      error,
      isLoading,
      mutate: makeMutation,
    }),
    [isLoading, error, ...deps]
  );
}
