interface State<NextPageParams, NextPageKey> {
  hasNextPage: boolean;
  isLoading: boolean;
  isFetching: boolean;
  nextPageParams: { nextPageKey?: NextPageKey | null, nextPageParams?: NextPageParams | null }[];
  error: any | null;
}

type Action<NextPageParams, NextPageKey> = {
  type: "isFetching" | "isLoading" | "hasNextPage";
  payload: boolean;
} | {
  type: "error";
  payload: any;
} | {
  type: "nextPageParams";
  payload: { nextPageKey?: NextPageKey | null, nextPageParams?: NextPageParams | null }
}

const initialState: State<any, any> = {
  hasNextPage: true,
  isLoading: false,
  isFetching: false,
  nextPageParams: [],
  error: null,
}

function reducer<NextPageParams, NextPageKey>(state: State<NextPageParams, NextPageKey>, action: Action<NextPageParams, NextPageKey>): State<NextPageParams, NextPageKey> {

  switch (action.type) {

    case "isFetching": {
      return { ...state, isFetching: action.payload, error: null };
    }

    case "isLoading": {
      return { ...state, isFetching: action.payload, isLoading: action.payload, error: null };
    }

    case "hasNextPage": {
      return { ...state, hasNextPage: action.payload };
    }

    case "nextPageParams": {
      const next = [...state.nextPageParams];
      const { nextPageKey, nextPageParams } = action.payload;
      const existingIndex = next.findIndex(n => n.nextPageKey === nextPageKey);
      if (existingIndex === -1) return { ...state, nextPageParams: [...state.nextPageParams, { nextPageKey, nextPageParams }] };
      next[existingIndex] = { nextPageKey, nextPageParams };
      return { ...state, nextPageParams: next };
    }


    case "error": {
      return { ...initialState, error: action.payload };
    }

    default:
      throw new Error(`Unhandled action ${JSON.stringify(action)}`);

  }

}

type Reducer<NextPageParams, NextPageKey> = typeof reducer<NextPageParams, NextPageKey>

export { reducer, initialState, type Reducer }