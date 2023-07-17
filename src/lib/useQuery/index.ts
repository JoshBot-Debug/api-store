import { useContext, useEffect, useMemo, useReducer, useState } from "react";
import { APIStoreContext } from "../Provider";
import { initialState, reducer } from "./reducer";

export function useQuery<Data>(config: UseAPIStore.Config<Data>): UseAPIStore.UseQueryReturn<Data> {

  const {
    table,
    enabled = true,
    fields = null,
  } = config;

  const {
    result: _result,
    fetch,
    where: _where
  } = config.get;

  const [state, dispatch] = useReducer(reducer, initialState);

  const context = useContext<UseAPIStore.Context<Data>>(APIStoreContext as any);

  const [where, setWhere] = useState<UseAPIStore.WhereClause<Data> | null>(_where ?? _result ?? null);

  useEffect(() => { onMount(); }, []);

  async function onMount() {
    try {
      if (_result) {
        context.upsert({ table, data: _result });
        setWhere(_where ?? _result);
      }
      if (enabled && fetch) {
        dispatch({ type: "isLoading", payload: true });
        const data = await fetch();
        setWhere(_where ?? data)
        context.upsert({ table, data });
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

  async function refetch(...args: any[]) {
    if (!fetch) throw new Error("You cannot call refetch without passing a fetch function to the hook.");
    try {
      dispatch({ type: "isFetching", payload: true });
      const data = await fetch(...args);
      setWhere(_where ?? data)
      context.upsert({ table, data });
      return data;
    }
    catch (error) {
      dispatch({ type: "error", payload: (error as any).message ?? `Something went wrong... \nERROR: ${JSON.stringify(error)}` })
      throw error;
    }
    finally { dispatch({ type: "isFetching", payload: false }); }
  }

  const result = JSON.stringify(context.get(table, where, fields));

  return useMemo(() => ({
    result: JSON.parse(result),
    refetch,
    ...state,
  }), [state.isFetching, state.error, result])
}