import { ORS } from "@jjmyers/object-relationship-store";

export declare namespace UseAPIStore {

  interface RelationalStoreProps<
    N extends string = string,
    I extends string = string,
    O extends string = string,
  > extends React.PropsWithChildren {
    store: ORS.Store<N, I, O>
  }

  interface UseQueryConfig<
    N extends string,
    O extends Record<string, any>,
    R extends Record<string, any>,
  > {
    select: ORS.SelectOptions<N, O>;
    fetch?: (...args: any[]) => Promise<R>;
    getData?: (result: R) => O;
    enabled?: boolean;
  }

  interface UseQueryReturn<
    O extends Record<string, any>,
    R extends Record<string, any>,
  > {
    state: O | O[] | null;
    result: R | null;
    isFetching: boolean;
    error: any | null;
    refetch: (...args: any[]) => Promise<{ result: R; data: O } | null>;
  }


  interface UseInfiniteQueryConfig<
    I extends string,
    N extends string,
    O extends Record<string, any>,
    R extends Record<string, any>,
    NextPageParams,
  > {
    index: `${I}-${string}`,
    select?: Partial<Record<N, ORS.Replace<ORS.SelectOptions<N, O>, "where", (object: any) => boolean>>>;
    fetch?: (nextParams?: NextPageParams | null) => Promise<R>;
    getNextPageParams: (result: R) => NextPageParams | null | undefined;
    getData?: (result: R) => O[];
    enabled?: boolean;
  }

  interface UseInfiniteQueryReturn<
    O extends Record<string, any>,
    R extends Record<string, any>,
    NextPageParams,
  > {
    state: O[] | null;
    isFetching: boolean;
    isLoading: boolean;
    nextPageParams: NextPageParams | null;
    hasNextPage: boolean;
    error: any | null;
    refetch: (...args: any[]) => Promise<{ result: R; data: O[] } | null>;
    fetchNextPage: (...args: any[]) => Promise<{ result: R; data: O[] } | null>;
  }


  type UseMutationConfig<
    R extends Record<string, any>,
    A extends Array<any>,
  > = {
    mutate: (...args: A) => Promise<R>;
    options?: ORS.UpsertOptions<string>;
  }

  interface UseMutationReturn<
    R extends Record<string, any>,
    A extends Array<any>,
  > {
    isLoading: boolean;
    error: any | null;
    mutate: (...args: A) => Promise<R | null>;
  }
}