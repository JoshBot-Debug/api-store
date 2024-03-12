import { Reducer, useEffect, useMemo, useReducer } from "react";
import { UseAPIStore } from "./types";
import { useStore, useStoreIndex } from "./store";
import { withOptions } from "@jjmyers/object-relationship-store";

interface State<NextPageParams> {
  error: string | null;
  isLoading: boolean;
  isFetching: boolean;
  hasNextPage: boolean;
  nextPageParams: NextPageParams | null;
}

interface Action {
  type:
    | "refresh"
    | "isLoading"
    | "startRequest"
    | "handleNextPage"
    | "endRequest"
    | "error";
  payload?: any;
}

const initialState: State<any> = {
  error: null,
  isLoading: false,
  isFetching: false,
  nextPageParams: null,
  hasNextPage: true,
};

function reducer<NextPageParams>(
  state: State<NextPageParams>,
  action: Action
): State<NextPageParams> {
  switch (action.type) {
    case "refresh":
      return initialState;

    case "isLoading":
      return { ...state, isLoading: action.payload };

    case "startRequest":
      return { ...state, error: null, isFetching: true };

    case "handleNextPage":
      return {
        ...state,
        nextPageParams: action.payload ?? null,
        hasNextPage: !!action.payload,
      };

    case "endRequest":
      return { ...state, isFetching: false };

    case "error":
      return {
        ...state,
        error: action.payload,
        nextPageParams: null,
        hasNextPage: false,
        isFetching: false,
        isLoading: false,
      };

    default:
      throw new Error("Unhandled action.");
  }
}

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
    dispatch({ type: "refresh" });
    refresh();
  }, [index, config.enabled, ...deps]);

  async function refresh() {
    dispatch({ type: "isLoading", payload: true });
    const result = await fetchNextPage();
    if (result?.data) {
      store.destroy(index);
      store.mutate(withOptions(result.data, { __indexes__: [index] }));
    }
    dispatch({ type: "isLoading", payload: false });
    return result;
  }

  async function fetchNextPage(...args: any[]) {
    if (!fetch)
      throw new Error(
        "You cannot call refetch without passing a fetch function to the hook."
      );

    try {
      dispatch({ type: "startRequest" });

      const result = await fetch(
        ...(args.length > 0 ? args : [local.nextPageParams])
      );
      const nextParams = getNextPageParams(result);
      const data = getData ? getData(result) : (result as unknown as O[]);

      dispatch({ type: "handleNextPage", payload: nextParams });

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
    [local, state]
  );
}
