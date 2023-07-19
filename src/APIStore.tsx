import React, { createContext, PropsWithChildren, useMemo, useReducer } from "react";
import reducer, { prepareInitialState } from "./reducer";
import { Model, UseAPIStore } from "./types";

type Context = UseAPIStore.Context<{}>;

const defaultContext: Context = {
  cache: {},
  upsert: () => { },
  get: () => null,
  filterUnique: () => [],
}

export const APIStoreContext = createContext<Context>(defaultContext)

interface APIStoreProps extends PropsWithChildren {
  model: Model.Model
}

export default function APIStore(props: APIStoreProps) {

  const { children } = props;

  const model = props.model as Model.Proto<Model.Table.Created>;

  const initialState = prepareInitialState(model);

  const [state, dispatch] = useReducer(reducer, initialState);

  const upsert: Context["upsert"] = (payload) => dispatch({ type: "upsert", payload, model });

  const get: Context["get"] = (table, where, fields) => {
    if (!where) return null;
    return model.get(table, state.cache, where, fields);
  }

  const filterUnique: Context["filterUnique"] = (table, data) => {
    return model.filterUnique(table, data);
  }

  const value = useMemo<Context>(() => ({
    cache: state.cache,
    upsert,
    get,
    filterUnique,
  }), [state.cache])

  return <APIStoreContext.Provider value={value}>{children}</APIStoreContext.Provider>
}