import { Reducer, useEffect, useMemo, useReducer } from "react";
import { withOptions } from "@jjmyers/object-relationship-store";
import { UseAPIStore } from "../types";
import { useStore, useStoreIndex } from "../store";
import reducer, { Action, State, initialState } from "./reducer";

export function useInfiniteQuery<
  I extends string,
  N extends string,
  O extends Record<string, any>,
  R extends Record<string, any>,
  NextPageParams
>(
  config: UseAPIStore.UseInfiniteQueryConfig<I, N, O, R, NextPageParams>,
  deps: any[] = []
): UseAPIStore.UseInfiniteQueryReturn<O, R, NextPageParams> {
  const {
    index,
    select,
    enabled = true,
    getNextPageParams,
    fetch,
    getData,
  } = config;

  const store = useStore();
  const state = useStoreIndex(index, select, deps);

  const [local, dispatch] = useReducer<Reducer<State<NextPageParams>, Action>>(
    reducer,
    { ...initialState, isLoading: enabled }
  );

  useEffect(() => {
    if (enabled) refresh();
  }, [index, config.enabled, ...deps]);

  async function refresh(nextPageParams?: NextPageParams) {
    dispatch({ type: "startRefreshing" });
    const result = await fetchNextPage(nextPageParams);
    if (result?.data) {
      store.destroy(index);
      store.mutate(withOptions(result.data, { __indexes__: [index] }));
    }
    dispatch({ type: "endRefreshing" });
    return result;
  }

  async function fetchNextPage(nextPageParams?: NextPageParams) {
    if (!fetch)
      throw new Error(
        "You cannot call refetch without passing a fetch function to the hook."
      );

    try {
      dispatch({ type: "startRequest" });

      const result = await fetch(
        nextPageParams !== undefined ? nextPageParams : local.nextPageParams
      );
      const nextParams = getNextPageParams(result);
      const data = getData ? getData(result) : (result as unknown as O[]);

      dispatch({ type: "handleNextPage", payload: nextParams });
      if (data) store.mutate(withOptions(data, { __indexes__: [index] }));

      return { result, data };
    } catch (error) {
      dispatch({ type: "error", payload: error });
    } finally {
      dispatch({ type: "endRequest" });
    }
    return null;
  }

  if (config.throwError && local.error !== null) throw local.error;

  return useMemo(
    () => ({
      state,
      refresh,
      fetchNextPage,
      ...local,
    }),
    [local, state, index]
  );
}
