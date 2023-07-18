import { useContext, useMemo, useReducer } from "react";
import { APIStoreContext } from "../APIStore";
import { initialState, reducer } from "./reducer";
import { UseAPIStore } from "../types";

export function useMutation<Data, Args extends Array<any>>(config: UseAPIStore.UseMutationConfig<Data, Args>): UseAPIStore.UseMutationReturn<Data, Args> {

  const {
    table,
    mutate,
  } = config;

  const [state, dispatch] = useReducer(reducer, initialState);

  const context = useContext<UseAPIStore.Context<Data>>(APIStoreContext as any);

  async function makeMutation(...args: Args) {
    try {
      dispatch({ type: "isLoading", payload: true });
      const data = await mutate(...args);
      context.upsert({ table, data });
      return data;
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