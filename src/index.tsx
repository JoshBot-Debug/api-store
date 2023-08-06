import React, { createContext, useCallback, useContext, useSyncExternalStore } from 'react';
import { createStore, createRelationalObject, createRelationalObjectIndex, type ORS } from "@jjmyers/object-relationship-store"

const StoreContext = createContext<ORS.Store<any, any, any> | null>(null);

const useStore = () => useContext(StoreContext);

const useStoreSelect = <
  N extends string = string,
  O extends Record<string, any> = Record<string, any>
>(
  selector: ORS.SelectOptions<N, O>
) => {

  const store = useContext(StoreContext)

  if (!store) throw new Error("Expected to have a store. Did you forget to wrap the application in a <RelationalStoreProvider/> component?")

  return useSyncExternalStore(
    store.subscribe,
    useCallback(() => store.select(selector), [store, selector])
  )
}

const useStoreIndex = <
  N extends string = string,
  I extends string = string,
  T extends Record<string, any> = Record<string, any>,
>(
  index: I,
  selector: Record<string, ORS.Replace<ORS.SelectOptions<N, T>, "where", (object: any) => boolean>>
) => {

  const store = useContext(StoreContext)

  if (!store) throw new Error("Expected to have a store. Did you forget to wrap the application in a <RelationalStoreProvider/> component?")

  return useSyncExternalStore(
    store.subscribe,
    useCallback(() => store.selectIndex(index, selector), [store, selector])
  )
}

interface RelationalStoreProps<
  N extends string = string,
  I extends string = string,
  O extends string = string,
> extends React.PropsWithChildren {
  store: ORS.Store<N, I, O>
}

function RelationalStoreProvider<
  N extends string = string,
  I extends string = string,
  O extends string = string,
>(props: RelationalStoreProps<N, I, O>) {

  const {
    store,
    children,
  } = props;

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export {
  ORS,
  createStore,
  createRelationalObject,
  createRelationalObjectIndex,
  useStore,
  useStoreSelect,
  useStoreIndex,
  RelationalStoreProvider,
}