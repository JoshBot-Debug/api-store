interface State {
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
}

type Action = {
  type: "isFetching" | "isLoading";
  payload: boolean;
} | {
  type: "error";
  payload: string;
}

const initialState: State = {
  isLoading: false,
  isFetching: false,
  error: null,
}

function reducer(state: State, action: Action): State {

  switch (action.type) {

    case "isFetching": {
      return { ...state, isFetching: action.payload, error: null };
    }

    case "isLoading": {
      return { ...state, isFetching: action.payload, isLoading: action.payload, error: null };
    }

    case "error": {
      return { ...initialState, error: action.payload };
    }

    default:
      throw new Error(`Unhandled action ${JSON.stringify(action)}`);

  }

}

export { reducer, initialState }