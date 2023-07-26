interface State {
  isLoading: boolean;
  isFetching: boolean;
  error: any | null;
}

type Action = {
  type: "isFetching" | "isLoading" | "reset";
  payload: boolean;
} | {
  type: "error";
  payload: any;
} | {
  type: "reset";
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
      return { ...initialState, error: action.payload, };
    }

    case "reset": {
      return { ...initialState };
    }

    default:
      throw new Error(`Unhandled action ${JSON.stringify(action)}`);

  }

}

export { reducer, initialState }