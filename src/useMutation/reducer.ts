interface State {
  isLoading: boolean;
  error: string | null;
}

type Action = {
  type: "isLoading";
  payload: boolean;
} | {
  type: "error";
  payload: string;
}

const initialState: State = {
  isLoading: false,
  error: null,
}

function reducer(state: State, action: Action): State {

  switch (action.type) {

    case "isLoading": {
      return { ...state, isLoading: action.payload, error: null };
    }

    case "error": {
      return { ...initialState, error: action.payload };
    }

    default:
      throw new Error(`Unhandled action ${JSON.stringify(action)}`);

  }

}

export { reducer, initialState }