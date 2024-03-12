export interface State<NextPageParams> {
  error: string | null;
  isLoading: boolean;
  isFetching: boolean;
  hasNextPage: boolean;
  nextPageParams: NextPageParams | null;
}

export interface Action {
  type:
    | "refresh"
    | "startLoading"
    | "endLoading"
    | "startRequest"
    | "handleNextPage"
    | "endRequest"
    | "error";
  payload?: any;
}

export const initialState: State<any> = {
  error: null,
  isLoading: false,
  isFetching: false,
  nextPageParams: null,
  hasNextPage: true,
};

export default function reducer<NextPageParams>(
  state: State<NextPageParams>,
  action: Action
): State<NextPageParams> {
  switch (action.type) {
    case "refresh":
      return initialState;

    case "startLoading":
      return {
        ...state,
        isLoading: true,
        nextPageParams: action.payload ?? null,
      };

    case "endLoading":
      return { ...state, isLoading: false };

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
