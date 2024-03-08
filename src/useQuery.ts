import { useEffect, useMemo, useState } from "react";
import { UseAPIStore } from "./types";
import { useStore, useStoreSelect } from "./store";

export function useQuery<
  N extends string,
  O extends Record<string, any>,
  R extends Record<string, any>
>(config: UseAPIStore.UseQueryConfig<N, O, R>, deps: any[] = []): UseAPIStore.UseQueryReturn<O, R> {

  const {
    select,
    enabled = true,
    fetch,
    getData,
  } = config;

  const store = useStore();
  const state = useStoreSelect(select);
  const [result, setResult] = useState<R | null>(null);
  const [error, setError] = useState<any | null>(null);
  const [isFetching, setIsFetching] = useState(enabled);

  useEffect(() => {
    if (!enabled || !fetch) return;
    setIsFetching(false);
    setError(null);
    setResult(null);
    refetch();
  }, [config.enabled, ...deps]);

  async function refetch(...args: any[]) {
    if (!fetch) throw new Error("You cannot call refetch without passing a fetch function to the hook.");
    try {
      setIsFetching(true);
      const result = await fetch(...args);
      const data = getData ? getData(result) : result as unknown as O;
      store.mutate(data);
      setResult(result);
      return { result, data };
    }
    catch (error) {
      setError(error);
      setResult(null);
    }
    finally { setIsFetching(false); }
    return null;
  }

  if (config.throwError && error !== null) throw new Error(error);

  return useMemo(() => ({
    state,
    result,
    refetch,
    isFetching,
    error,
  }), [isFetching, error, state, result])
}