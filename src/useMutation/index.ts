import { useContext, useMemo, useReducer } from "react";
import { APIStoreContext } from "../APIStore";
import { initialState, reducer } from "./reducer";
import { UseAPIStore } from "../types";

export function useMutation<Result, Data, Args extends Array<any>>(
  config: UseAPIStore.UseMutationConfig<Result, Data, Args>
): UseAPIStore.UseMutationReturn<Result, Args> {

  /**
   * TODO
   * 
   * Instead of passing a single table,
   * pass a selector object that takes in 
   * table name as key and a function called on the result of mutate
   * as value, if table is set, use table,
   * if selector is set, use selector
   * selector given more preference
   */
  const {
    table,
    extractor,
    mutate,
  } = config;

  const [state, dispatch] = useReducer(reducer, initialState);

  const context = useContext<UseAPIStore.Context<Data>>(APIStoreContext as any);

  async function makeMutation(...args: Args) {
    if (!table && !extractor) throw new Error("You must provide a table or an extractor. If both are provided, extractor will be used.");
    try {
      dispatch({ type: "isLoading", payload: true });
      const result = await mutate(...args);

      if (table && !extractor) context.upsert({ table, data: result as Data });

      if (extractor) {
        const tables = Object.keys(extractor);
        const payload = tables.map(table => ({ table, data: extractor[table](result) }))
        context.upsert(payload);
      }

      return result;
    }
    catch (error) {
      dispatch({ type: "error", payload: (error as any).message ?? `Something went wrong... \nERROR: ${JSON.stringify(error)}` })
      throw error;
    }
    finally { dispatch({ type: "isLoading", payload: false }); }
  }

  return useMemo(() => ({
    mutate: makeMutation,
    ...state,
  }), [state.isLoading, state.error])
}