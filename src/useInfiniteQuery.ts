import { useEffect, useMemo, useState } from "react";
import { UseAPIStore } from "./types";
import { useStore, useStoreIndex } from "./store";
import { withOptions } from ".";

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
  const state = useStoreIndex(index, select);
  const [error, setError] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [nextPageParams, setNextPageParams] = useState<NextPageParams | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);

  useEffect(() => {
    if (!enabled || !fetch) return;
    setIsLoading(true);
    setNextPageParams(null);
    setHasNextPage(true);
    setIsFetching(false);
    setError(null);
    refetch()
      .finally(() => setIsLoading(false))
  }, [config.enabled, ...deps]);

  async function refetch(...args: any[]) {
    if (!hasNextPage) return null;
    if (!fetch) throw new Error("You cannot call refetch without passing a fetch function to the hook.");
    try {
      setIsFetching(true);
      const arg = args.length > 0 ? args : [nextPageParams];
      const result = await fetch(...arg);
      const nextParams = getNextPageParams(result);
      const data = getData ? getData(result) : result as unknown as O[];
      if (nextParams) { setNextPageParams(nextParams); }
      else {
        setNextPageParams(null);
        setHasNextPage(false);
      }
      store.upsert(withOptions(data, { __indexes__: [index] }));
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

  async function fetchNextPage(...args: any[]) {
    return await refetch(...args);
  }


  return useMemo(() => ({
    state,
    refetch,
    fetchNextPage,
    nextPageParams,
    isLoading,
    hasNextPage,
    isFetching,
    error,
  }), [isLoading, hasNextPage, nextPageParams, isFetching, error, state])
}