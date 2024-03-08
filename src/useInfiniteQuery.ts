import { useEffect, useMemo, useState } from "react";
import { UseAPIStore } from "./types";
import { useStore, useStoreIndex } from "./store";
import { withOptions } from "@jjmyers/object-relationship-store";

export function useInfiniteQuery<
  I extends string,
  N extends string,
  O extends Record<string, any>,
  R extends Record<string, any>,
  NextPageParams,
>(config: UseAPIStore.UseInfiniteQueryConfig<I, N, O, R, NextPageParams>, deps: any[] = []): UseAPIStore.UseInfiniteQueryReturn<O, R, NextPageParams> {

  const {
    index,
    select,
    enabled = true,
    getNextPageParams,
    fetch,
    getData
  } = config;

  const store = useStore();
  const state = useStoreIndex(index, select, deps);
  const [error, setError] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isFetching, setIsFetching] = useState(false);
  const [nextPageParams, setNextPageParams] = useState<NextPageParams | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);

  useEffect(() => {
    if (!enabled || !fetch) return;
    refresh(false);
  }, [config.enabled, ...deps]);

  
  async function refresh(clearIndex: boolean = true) {
    if (!enabled || !fetch) return null;
    setIsLoading(true);
    setNextPageParams(null);
    setHasNextPage(true);
    setIsFetching(false);
    setError(null);
    const result = await makeRequest(null, !!clearIndex);
    setIsLoading(false);
    return result;
  }

  async function makeRequest(args: any[] | null, clearIndex?: boolean) {
    if (!hasNextPage) return null;
    if (!fetch) throw new Error("You cannot call refetch without passing a fetch function to the hook.");
    try {
      setIsFetching(true);
      const arg = !args ? [] : args.length > 0 ? args : [nextPageParams];
      const result = await fetch(...arg);
      const nextParams = getNextPageParams(result);
      const data = getData ? getData(result) : result as unknown as O[];
      if (nextParams) { setNextPageParams(nextParams); }
      else {
        setNextPageParams(null);
        setHasNextPage(false);
      }
      if (clearIndex) store.destroy(index);
      store.mutate(withOptions(data, { __indexes__: [index] }));
      return { result, data };
    }
    catch (error) {
      setError(error);
      setNextPageParams(null);
      setHasNextPage(false);
    }
    finally { setIsFetching(false); }
    return null;
  }

  if (config.throwError) throw new Error(error);

  return useMemo(() => ({
    state,
    refresh,
    fetchNextPage: makeRequest,
    nextPageParams,
    isLoading,
    hasNextPage,
    isFetching,
    error,
  }), [isLoading, hasNextPage, nextPageParams, isFetching, error, state])
}