import { Model } from "./types";

function has(model: Model.Table.Created): Model.Table.Relationship.Has {
  const {
    __isTable,
    __name,
    __pk
  } = model as Model.Table.Proto;

  const relationship = { __isForeign: true }

  Object.setPrototypeOf(relationship, {
    __isTable,
    __name,
    __pk
  })

  return relationship
}

export function createTable(name: string, model: Model.Table.Model, options?: { pk?: string }): Model.Table.Created {

  const table = model

  Object.setPrototypeOf(table, {
    __isTable: true,
    __name: name,
    __pk: options?.pk ?? "id",
    __relationship: { __alias: {} },

    hasOne(table: Model.Table.Created, as?: string) {
      const t = table as Model.Table.Proto
      if (!t.__isTable) throw new Error("Object is not an instance of createTable");

      const self = this as unknown as Model.Table.Proto;
      const name: any = as ?? t.__name;

      const existing = Object.entries(self.__relationship.__alias).find(([alias, table]) => table === t.__name);

      if (
        existing &&
        (
          (self.__relationship[existing[0]] as Model.Table.Relationship.Proto).__pk === t.__pk &&
          t.__pk === self.__name
        )
      ) throw new Error(`"${t.__name}" reference already exists in "${self.__name}" as "${existing[0]}" with the primary key (pk) "${t.__pk}". "${self.__name}" table failed to create a hasOne relationship with "${name}" because it has the same primary key "${t.__pk}" as "${existing[0]}". The primary key for "${existing[0]}" and "${name}" are not unique.`);

      self[name] = "hasOne"
      self.__relationship[name] = has(table);
      self.__relationship.__alias[name] = t.__name;

      return this;
    },

    hasMany(table: Model.Table.Created, as?: string) {
      const t = table as Model.Table.Proto
      if (!t.__isTable) throw new Error("Object is not an instance of createTable");

      const self = this as unknown as Model.Table.Proto;
      const name: any = as ?? t.__name;

      const existing = Object.entries(self.__relationship.__alias).find(([alias, table]) => table === t.__name)
      if (
        existing &&
        (
          (self.__relationship[existing[0]] as Model.Table.Relationship.Proto).__pk === t.__pk &&
          t.__pk === self.__name
        )
      ) throw new Error(`"${t.__name}" reference already exists in "${self.__name}" as "${existing[0]}" with the primary key (pk) "${t.__pk}". "${self.__name}" table failed to create a hasOne relationship with "${name}" because it has the same primary key "${t.__pk}" as "${existing[0]}". The primary key for "${existing[0]}" and "${name}" are not unique.`);

      self[name] = "hasMany"
      self.__relationship[name] = has(table);
      self.__relationship.__alias[name] = t.__name;

      return this;
    },
  });

  return table as unknown as Model.Table.Created
}

export function createModel(tables: Model.Table.Created[]) {

  const model = (tables as Model.Table.Proto[])
    .reduce((r, t) => {
      if (!t.__isTable) throw new Error("Object is not an instance of createTable");
      const k = t.__relationship.__alias[t.__pk] ?? t.__pk;
      if (!(t as any)[k]) throw new Error(`The table "${t.__name}" does not have a primary key (pk) "${t.__pk}", pk should be listed here ${JSON.stringify(t)}`);
      return { ...r, [t.__name]: t }
    }, {} as Model.Model)

  const cleanWhereClause = (self: Model.Model, next: any, table: string) => {
    if (Array.isArray(next)) {
      next = next.map(n => cleanWhereClause(self, n, table))
      return next
    }
    const schema = self[table] as Model.Table.Proto;
    const relations = Object.keys(schema.__relationship).filter(r => r !== "__alias");
    const keys = Object.keys(next);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key !== schema.__pk && !relations.includes(key)) {
        delete next[key];
        continue;
      }
      if (key === schema.__pk) continue;
      next[key] = cleanWhereClause(self, next[key], schema.__relationship.__alias[key])
    }
    return next
  }

  Object.setPrototypeOf(model, <Model.Proto>{
    filterUnique(table, data) {
      const schema = this[table] as Model.Table.Proto;
      return data
        .reduce((result, current: any) => {
          const pk = current[schema.__pk];
          if (pk === undefined) throw new Error("If you want to filter out unique records, you must pass a primary key.")
          if (result.pks.includes(pk)) return result;
          const clean = cleanWhereClause(this, { ...current }, table)
          return {
            pks: [...result.pks, pk],
            clauses: [...result.clauses, clean]
          }
        }, { pks: [], clauses: [] } as { pks: any[]; clauses: any[] })
        .clauses
    },
    get(table, normalizedData, where, fields, isRecursive = false) {

      if (Array.isArray(where)) {
        const result = [];
        for (let i = 0; i < where.length; i++) {
          const record = this.get(table, normalizedData, where[i], fields, isRecursive);
          if(!record) return []
          result.push(record)
        }
        return result;
      }

      const schema = this[table] as Model.Table.Proto;
      const records = normalizedData[table];

      let result: Record<string, any> | null = null;

      let clauses = Object.entries(where);

      const hasPk = clauses.find(([k]) => k === schema.__pk);

      if (hasPk) {
        const relations = Object.keys(schema.__relationship).filter(r => r !== "__alias");
        const filteredData = clauses.filter(([key]) => key === schema.__pk || relations.includes(key));
        clauses = filteredData.sort((a, b) => {
          if (a[0] === schema.__pk) {
            return -1;
          } else if (b[0] === schema.__pk) {
            return 1;
          } else {
            return 0;
          }
        });

        if(!isRecursive) {
          const [pk, value] = clauses[0];

          const isPkForeigner = !!schema.__relationship[pk]?.__isForeign;
          if(isPkForeigner) {
            const fkTableName = (schema.__relationship[schema.__pk] as Model.Table.Relationship.Proto).__name;
            const fkSchema = this[fkTableName] as Model.Table.Proto;
            
            if(!normalizedData[fkSchema.__name][value]) {
              if(typeof value === "object") {
                if(!normalizedData[fkSchema.__name][value[fkSchema.__pk]]) return null;
              }
              if(typeof value !== "object") return null;
            }
          }
          
          if(!isPkForeigner && !records[value]) return null;
        }
      }

      for (let ci = 0; ci < clauses.length; ci++) {
        const [cKey, cValue] = clauses[ci];

        const isForeigner = schema.__relationship[cKey]?.__isForeign;

        const selectedFields = fields && fields[schema.__name] ? fields[schema.__name] : null;

        // If this field is a foreigner
        if (isForeigner) {

          if (selectedFields && (fields && !fields[cKey])) continue;

          const next = this.get(
            (schema.__relationship[cKey] as Model.Table.Relationship.Proto).__name,
            normalizedData,
            cValue,
            fields,
            true
          );

          if (next) {
            if (!result) result = {};
            result[cKey] = next;
          }
        }


        // If this is the primary key
        if (schema.__pk === cKey) {

          // If the primary key is a foreign key
          if (schema.__relationship[schema.__pk]?.__isForeign) {
            if (!normalizedData[schema.__name][cValue]) {
              const fkTableName = (schema.__relationship[schema.__pk] as Model.Table.Relationship.Proto).__name;
              const fkSchema = this[fkTableName] as Model.Table.Proto;
              const data = normalizedData[table][where[schema.__relationship.__alias[fkTableName]][fkSchema.__pk]];
              result = {
                ...data,
                ...result,
              };
              continue;
            };
          }

          if (!records[cValue]) continue;

          // If there are no specified fields to select, the full record is the result
          if (!selectedFields) {
            result = { ...(result ?? {}), ...records[cValue] };
            continue;
          }

          const row = records[cValue];
          result = { ...(result ?? {}) };

          for (let i = 0; i < selectedFields.length; i++) {
            const field = selectedFields[i];
            const value = row[field];
            if (value !== undefined) result[field] = value;
          }

        }


        // If no primary key was give, search by value.
        // Always returns an array or results
        if (!hasPk) {
          const entries = Object.values(records);
          const results = [];
          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (entry[cKey] === cValue) results.push(entry);
          }
          return results
        }
      }

      return result
    },
  })

  return model
}