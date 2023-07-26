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
    deps = [],
  } = config;

  const {
    result: _result,
    fetch,
  } = config.get;

  const _where = config.get.where as Data;

  const [state, dispatch] = useReducer<Reducer<NextPageParams, NextPageKey>>(reducer, {
    ...initialState,
    hasNextPage: !_result ? true : !!getNextPageParams(_result)
  });

  const context = useContext<UseAPIStore.Context<Data>>(APIStoreContext as any);

  const getDefaultWhere = () => (
    _where
      ? _where
      : _result
        ? getData
          ? getData(_result as Result)
          : _result as Data
        : []
  )

  const [where, setWhere] = useState<UseAPIStore.WhereClause<Data[] | Data>>(() => getDefaultWhere());


  useEffect(() => {
    dispatch({ type: "reset" });
    setWhere(getDefaultWhere())
    onMount();
  }, deps);


  async function fetchSetAndGet(nextParams?: NextPageParams | null) {
    if (!fetch) throw new Error("You cannot use useInfiniteQuery without passing a fetch function to the hook.");
    const fetchResult = await fetch(nextParams);
    const data = getData(fetchResult);
    const nextPageParams = getNextPageParams(fetchResult);
    const nextPageKey = getNextPageKey(fetchResult);
    if (!nextPageParams || !nextPageKey) dispatch({ type: "hasNextPage", payload: false });
    dispatch({ type: "nextPageParams", payload: { nextPageKey, nextPageParams } });
    const where = _where ?? data;
    setWhere((prev) => {
      if (Array.isArray(prev) && Array.isArray(where)) return [...prev, ...where]
      return where
    })
    context.upsert({ table, data });
    return data;
  }


  async function onMount() {
    try {
      if (_result) {
        const data = getData(_result);
        context.upsert({ table, data });
        const where = _where ?? data;
        setWhere(where);
      }
      if (enabled) {
        dispatch({ type: "isLoading", payload: true });
        await fetchSetAndGet();
        dispatch({ type: "isLoading", payload: false });
      }
    }
    catch (error) {
      dispatch({ type: "error", payload: error })
    }
  }


  async function refetch(nextParams?: NextPageParams) {
    if (!fetch) throw new Error("You cannot call refetch without passing a fetch function to the hook.");
    try {
      dispatch({ type: "isFetching", payload: true });
      const fetchResult = await fetch(nextParams);
      const data = getData(fetchResult);
      const nextPageParams = getNextPageParams(fetchResult);
      const nextPageKey = getNextPageKey(fetchResult);
      if (!nextPageParams || !nextPageKey) dispatch({ type: "hasNextPage", payload: false });
      dispatch({ type: "nextPageParams", payload: { nextPageKey, nextPageParams } });
      const where = _where ?? data;
      setWhere(where);
      context.upsert({ table, data });
      const result = await fetchSetAndGet(nextParams);
      dispatch({ type: "isFetching", payload: false });
      return result;
    }
    catch (error) {
      dispatch({ type: "error", payload: error })
    }
  }


  async function fetchNextPage() {
    if (!state.hasNextPage) return []
    if (!fetch) throw new Error("You cannot call refetch without passing a fetch function to the hook.");
    try {
      dispatch({ type: "isFetching", payload: true });
      const nextParams = state.nextPageParams[state.nextPageParams.length - 1]?.nextPageParams;
      const result = await fetchSetAndGet(nextParams);
      dispatch({ type: "isFetching", payload: false });
      return result;
    }
    catch (error) {
      dispatch({ type: "error", payload: error })
    }
  }

  const result = JSON.stringify(context.get(table, where, fields));

  return useMemo(() => ({
    result: JSON.parse(result) as Data[],
    refetch,
    fetchNextPage,
    ...state,
  }), [state.isFetching, state.error, result])
}