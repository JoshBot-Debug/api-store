import { useContext, useEffect, useMemo, useReducer, useState } from "react";
import { APIStoreContext } from "../APIStore";
import { initialState, reducer } from "./reducer";
import { UseAPIStore } from "../types";

export function useQuery<Result, Data>(config: UseAPIStore.UseQueryConfig<Result, Data>, deps: any[]): UseAPIStore.UseQueryReturn<Data> {

  const {
    table,
    enabled = true,
    fields = null,
    getData,
  } = config;

  const {
    result: _result,
    fetch,
  } = config.get;

  const _where = config.get.where as Data;

  const [state, dispatch] = useReducer(reducer, initialState);

  const context = useContext<UseAPIStore.Context<Data>>(APIStoreContext as any);


  const getDefaultWhere = () => (
    _where
      ? _where
      : _result
        ? getData
          ? getData(_result as Result)
          : _result as Data
        : null
  )

  const [where, setWhere] = useState<UseAPIStore.WhereClause<Data> | null>(() => getDefaultWhere());

  useEffect(() => {
    dispatch({ type: "reset" });
    setWhere(getDefaultWhere());
    onMount();
  }, deps);

  async function onMount() {
    try {
      if (_result) {
        const data = getData ? getData(_result as Result) : _result as Data
        context.upsert({ table, data });
        const where = _where ?? data;
        setWhere(where);
      }
      if (enabled && fetch) {
        dispatch({ type: "isLoading", payload: true });
        const fetchResult = await fetch();
        const data = getData ? getData(fetchResult as Result) : fetchResult as Data;
        const where = _where ?? data;
        setWhere(where);
        context.upsert({ table, data });
        dispatch({ type: "isLoading", payload: false });
      }
    }
    catch (error: any) {
      dispatch({ type: "error", payload: error });
    }
  }

  async function refetch(...args: any[]) {
    if (!fetch) throw new Error("You cannot call refetch without passing a fetch function to the hook.");
    try {
      dispatch({ type: "isFetching", payload: true });
      const fetchResult = await fetch(...args);
      const data = getData ? getData(fetchResult as Result) : fetchResult as Data
      const where = _where ?? data;
      setWhere(where);
      context.upsert({ table, data });
      dispatch({ type: "isFetching", payload: false });
      return data;
    }
    catch (error) {
      dispatch({ type: "error", payload: error });
    }
  }

  const result = JSON.stringify(context.get(table, where, fields));

  return useMemo(() => ({
    result: JSON.parse(result),
    refetch,
    ...state,
  }), [state.isFetching, state.error, result])
}


function setupWhere() {

}