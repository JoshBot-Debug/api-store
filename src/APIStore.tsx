import React, { createContext, PropsWithChildren, useEffect, useMemo, useReducer } from "react";
import reducer, { prepareInitialState } from "./reducer";
import { Model, UseAPIStore } from "./types";

type Context = UseAPIStore.Context<{}>;

const defaultContext: Context = {
  cache: {},
  upsert: () => { },
  get: () => null,
}

export const APIStoreContext = createContext<Context>(defaultContext)

interface APIStoreProps extends PropsWithChildren {
  model: Model.Model;
  debug?: boolean;
}

export default function APIStore(props: APIStoreProps) {

  const { children, debug } = props;

  const model = props.model as Model.Proto<Model.Table.Created>;

  const initialState = prepareInitialState(model);

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (!debug) return;
    console.log(state.cache)
  }, [state])

  const upsert: Context["upsert"] = (payload) => dispatch({ type: "upsert", payload, model });

  const get: Context["get"] = (table, where, fields) => {
    if (!where) return null;
    // TODO need to find out where the value is mutating and remove this.
    return model.get(table, state.cache, where, fields);
  }

  const value = useMemo<Context>(() => ({
    cache: state.cache,
    upsert,
    get,
  }), [state.cache])

  return <APIStoreContext.Provider value={value}>{children}</APIStoreContext.Provider>
}