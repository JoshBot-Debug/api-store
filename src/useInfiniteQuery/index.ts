import { useContext, useEffect, useMemo, useReducer, useState } from "react";
import { APIStoreContext } from "../APIStore";
import { Reducer, initialState, reducer } from "./reducer";
import { UseAPIStore } from "../types";

export function useInfiniteQuery<
  Result,
  Data,
  NextPageParams,
  NextPageKey extends string
>(config: UseAPIStore.UseInfiniteQueryConfig<Result, Data, NextPageParams, NextPageKey>): UseAPIStore.UseInfiniteQueryReturn<Data, NextPageParams, NextPageKey> {

  const {
    table,
    enabled = true,
    fields = null,
    getData,
    getNextPageParams,
    getNextPageKey,
  } = config;

  const {
    result: _result,
    fetch,
  } = config.get;

  const [state, dispatch] = useReducer<Reducer<NextPageParams, NextPageKey>>(reducer, {
    ...initialState,
    hasNextPage: !_result ? true : !!getNextPageParams(_result)
  });

  const context = useContext<UseAPIStore.Context<Data>>(APIStoreContext as any);

  const [where, setWhere] = useState<UseAPIStore.WhereClause<Data[]>>(_result ? getData(_result) : []);

  useEffect(() => { onMount(); }, []);

  async function fetchSetAndGet(nextParams?: NextPageParams) {
    if (!fetch) throw new Error("You cannot call refetch without passing a fetch function to the hook.");
    if (!state.hasNextPage) return [];
    const fetchResult = await fetch(nextParams);
    const data = getData(fetchResult);
    const nextPageParams = getNextPageParams(fetchResult);
    const nextPageKey = getNextPageKey(fetchResult);
    if (!nextPageParams || !nextPageKey) dispatch({ type: "hasNextPage", payload: false });
    dispatch({ type: "nextPageParams", payload: { nextPageKey, nextPageParams } });
    setWhere(prev => context.filterUnique(table, (!prev ? data : [...prev, ...data])))
    context.upsert({ table, data });
    return data;
  }

  async function onMount() {
    try {
      if (_result) {
        const data = getData(_result);
        context.upsert({ table, data });
        setWhere(context.filterUnique(table, data));
      }
      if (enabled) {
        await fetchSetAndGet();
      }
    }
    catch (error) {
      dispatch({ type: "error", payload: (error as any).message ?? `Something went wrong... \nERROR: ${JSON.stringify(error)}` })
      throw error;
    }
    finally {
      dispatch({ type: "isLoading", payload: false });
    }
  }

  async function refetch(nextParams?: NextPageParams) {
    if (!fetch) throw new Error("You cannot call refetch without passing a fetch function to the hook.");
    try {
      dispatch({ type: "isFetching", payload: true });
      return await fetchSetAndGet(nextParams);
    }
    catch (error) {
      dispatch({ type: "error", payload: (error as any).message ?? `Something went wrong... \nERROR: ${JSON.stringify(error)}` })
      throw error;
    }
    finally { dispatch({ type: "isFetching", payload: false }); }
  }

  async function fetchNextPage() {
    if (!state.hasNextPage) return []
    if (!fetch) throw new Error("You cannot call refetch without passing a fetch function to the hook.");
    try {
      dispatch({ type: "isFetching", payload: true });
      const nextParams = state.nextPageParams[state.nextPageParams.length - 1]?.nextPageParams;
      if (!nextParams) {
        dispatch({ type: "hasNextPage", payload: false });
        return [];
      }
      return await fetchSetAndGet(nextParams);
    }
    catch (error) {
      dispatch({ type: "error", payload: (error as any).message ?? `Something went wrong... \nERROR: ${JSON.stringify(error)}` })
      throw error;
    }
    finally { dispatch({ type: "isFetching", payload: false }); }
  }

  const result = JSON.stringify(context.get(table, where, fields));

  return useMemo(() => ({
    result: JSON.parse(result) as Data[],
    refetch,
    fetchNextPage,
    ...state,
  }), [state.isFetching, state.error, result])
}