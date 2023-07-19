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

  Object.setPrototypeOf(model, <Model.Proto>{
    get(table, normalizedData, where, fields) {

      if (Array.isArray(where)) return where.map(_where => this.get(table, normalizedData, _where, fields));

      const schema = this[table] as Model.Table.Proto;
      const records = normalizedData[table];

      let result: Record<string, any> | null = null;

      const clauses = Object.entries(where);

      const hasPk = clauses.find(([k]) => k === schema.__pk);

      for (let ci = 0; ci < clauses.length; ci++) {
        const [cKey, cValue] = clauses[ci];

        const isForeigner = schema.__relationship[cKey]?.__isForeign;

        const selectedFields = fields && fields[schema.__name] ? fields[schema.__name] : null;

        // If this field is a foreigner
        if (isForeigner) {

          if(selectedFields && (fields && !fields[cKey])) continue;

          const next = this.get(
            (schema.__relationship[cKey] as Model.Table.Relationship.Proto).__name,
            normalizedData,
            cValue,
            fields
          );

          if (next) {
            if (!result) result = {};

            // Was this
            // result[cKey] = {
            //   ...(result[cKey] ?? {}),
            //   ...next
            // };
            
            // THis fixes the converting array to object problem
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
            if(value !== undefined) result[field] = value;
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