import { Model } from "./types";

interface State {
  cache: { [table: string]: { [pk: string]: Model.Table.Created } },
}

type Action = {
  type: "upsert",
  payload: { table: string; data: any }
  model: Model.Model
} | {
  type: "loading",
  payload: boolean
}


export const prepareInitialState = (model: Model.Model): State => {
  return {
    cache: Object.keys(model).reduce((r, c) => ({ ...r, [c]: {} }), {} as State["cache"]),
  }
}


export function toModel(params: {
  model: Model.Model<Model.Table.Created>;
  initialTable: string;
  currentCache: any;
  payload: any;
}) {

  const {
    initialTable,
    currentCache,
    payload,
  } = params;

  const model = params.model as Model.Model<Model.Table.Proto>;

  const partialPayloads = Array.isArray(payload) ? payload : [payload];

  let cache = { ...currentCache }

  const parentSchema = model[initialTable];

  if (!parentSchema?.__pk) throw new Error(`No schema found. The table "${initialTable}" does not exist.`);

  for (let i = 0; i < partialPayloads.length; i++) {

    const _payload = partialPayloads[i];
    const _primaryKey = _payload[parentSchema.__pk];
    const _currentCache = cache[initialTable];

    const table = { ..._currentCache ? _currentCache[_primaryKey] : {}, ..._payload };
    const foreigners = Object.entries(parentSchema.__relationship.__alias)

    for (let f = 0; f < foreigners.length; f++) {

      const [foreignerAs, foreignerName] = foreigners[f];
      const child = table[foreignerAs] ?? null;

      if (
        (!child || typeof child !== "object") ||
        (!_payload[foreignerAs] || typeof _payload[foreignerAs] !== "object")
      ) continue;

      const hasManyChildren = parentSchema[(foreignerAs as any)] === "hasMany";

      if (Array.isArray(child) && !hasManyChildren) throw new Error(`"${foreignerAs}" under "${parentSchema.__name}" was as array, we expected an object. Did you mean to use hasMany?`);
      if (!Array.isArray(child) && hasManyChildren) throw new Error(`"${foreignerAs}" under "${parentSchema.__name}" was as object, we expected an array. Did you mean to use hasOne?`);

      const childSchema = model[foreignerName];

      if (!childSchema?.__pk) throw new Error(`No schema found. The table "${foreignerName}" as "${foreignerAs}" does not exist.`);

      table[foreignerAs] = hasManyChildren
        ? child.map((c: any) => c[childSchema.__pk])
        : child[childSchema.__pk]

      cache = toModel({
        model,
        currentCache: cache,
        initialTable: childSchema.__name,
        payload: child,
      });
    }

    const k = parentSchema.__relationship.__alias[parentSchema.__pk] ?? parentSchema.__pk;
    const key = table[k];
    if (!key) throw new Error(`Expected the table "${initialTable}" to have a field "${k}", the fields found were [${Object.keys(table)}]. The payload was not what the model expected.`);
    cache[parentSchema.__name] = { ...cache[parentSchema.__name], [key]: table }
  }

  return cache
}

export default function reducer(state: State, action: Action): State {

  switch (action.type) {
    case "upsert": {
      const payload = action.payload;
      const model = action.model as Model.Model<Model.Table.Proto>;
      return {
        ...state,
        cache: toModel({
          currentCache: state.cache,
          initialTable: payload.table,
          payload: payload.data,
          model
        })
      };
    }

    case "loading": {

      return state;
    }
  }

}