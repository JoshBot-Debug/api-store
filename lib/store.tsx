import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";
import { type ORS } from "@jjmyers/object-relationship-store";
import { UseAPIStore } from "./types";

const StoreContext = createContext<ORS.Store<any, any, any> | null>(null);

export const useStore = <
  N extends string,
  I extends string,
  O extends string
>() => useContext(StoreContext) as ORS.Store<N, I, O>;

export const useStoreSelect = <
  N extends string = string,
  O extends Record<string, any> = Record<string, any>
>(
  selector: ORS.SelectOptions<N, O>,
  deps: any[] = []
) => {
  const store = useContext(StoreContext);

  if (!store)
    throw new Error(
      "Expected to have a store. Did you forget to wrap the application in a <RelationalStoreProvider/> component?"
    );

  return useSyncExternalStore(
    store.subscribe,
    useCallback(() => store.select(selector), deps),
    () => store.select(selector)
  );
};

export const useStoreIndex = <
  N extends string = string,
  I extends string = string,
  O extends Record<string, any> = Record<string, any>
>(
  index: `${I}-${string}`,
  selector?: Partial<
    Record<
      N,
      ORS.Replace<ORS.SelectOptions<N, O>, "where", (object: any) => boolean>
    >
  >,
  deps: any[] = []
) => {
  const store = useContext(StoreContext);

  if (!store)
    throw new Error(
      "Expected to have a store. Did you forget to wrap the application in a <RelationalStoreProvider/> component?"
    );

  return useSyncExternalStore(
    store.subscribe,
    useCallback(
      () => store.selectIndex<I, N, O>(index, selector as any),
      [index, ...deps]
    ),
    () => store.selectIndex<I, N, O>(index, selector as any)
  );
};

export function RelationalStoreProvider<
  N extends string = string,
  I extends string = string,
  O extends string = string
>(props: UseAPIStore.RelationalStoreProps<N, I, O>) {
  const { store, children } = props;

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}
