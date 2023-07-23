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



  function cleanWhere(self: Model.Model, where: Record<string, any>, table: string): Model.Where<string> {
    const result = { ...where };
    const schema = self[table] as Model.Table.Proto;
    const clauses = Object.entries(result);

    Object.setPrototypeOf(result, {
      __conditions: [],
      __joins: [],
      __relations: [],
      __hasPrimaryKey: {}
    })

    for (let i = 0; i < clauses.length; i++) {
      const [key, value] = clauses[i];



      // If this is the primary key, don't remove it
      if (key === schema.__pk) {


        // This is a join on a primary key,
        // the record will have a primary key here
        // User {id: 10, username: "john", profile: 10 // pk }
        // Where {id: 10, profile: { id: operation.join() }}
        if ((value as Model.OperationProto)?.__isJoin) {
          (result as Model.Where<string>).__hasPrimaryKey[table] = true;
          continue;
        }

        // If the value is an object, then it is a related field
        // that contains the primary key
        // Check it to see if it has the primary key.
        // If it does, then has primary key is true and
        // We also need to set this key as a relation so don't continue
        if (typeof value === "object") {
          const relationTableName = schema.__relationship.__alias[schema.__pk];
          const relation = (schema.__relationship[relationTableName] as Model.Table.Relationship.Proto);

          // If we have the primary key
          if (value[relation.__pk]) {
            (result as Model.Where<string>).__hasPrimaryKey[table] = true;
          }
        }

        if (typeof value !== "object") {
          (result as Model.Where<string>).__hasPrimaryKey[table] = true;
          continue;
        }
      }


      // If this value is a join, continue
      if ((value as Model.OperationProto)?.__isJoin) {

        // This is a join, it should be performed last
        (result as Model.Where<string>).__joins.push(key);
        continue;
      }


      // If this is a related object, traverse inside
      if (schema.__relationship[key]) {

        // The related where value is not an object, then continue. Otherwise recursively apply cleanWhere
        if (typeof result[key] !== "object") {

          // If this related field is not an object, treat it like a condition
          (result as Model.Where<string>).__conditions.push(key);
          continue;
        }

        (result as Model.Where<string>).__relations.push(key);

        result[key] = cleanWhere(self, result[key], schema.__relationship.__alias[key]);
        continue;
      }

      // If there is no primary key, this field is a condition to look for
      if (!result[schema.__pk]) {
        (result as Model.Where<string>).__conditions.push(key);
        continue;
      }

      delete result[key];
    }

    return result as Model.Where<string>;
  }


  function find(record: Record<string, any>, fKey: string[], fValue: any[]) {
    return Object.entries(record)
      .filter(([key, row]) => fKey.every((k, i) => row[k] === fValue[i]))
      .map(([_, row]) => ({ ...row }));
  }


  function findByJoin(self: Model.Proto, table: string, normalizedData: any, record: Record<string, any>, fKey: string[], fValue: any[], fields: Record<string, string[]> | null) {

    const schema = self[table] as Model.Table.Proto;

    // Always a single object.
    let result: Record<string, any> | null = null;

    // For each join operation key
    for (let i = 0; i < fKey.length; i++) {
      const cKey = fKey[i];
      const relation = (schema.__relationship[cKey] as Model.Table.Relationship.Proto);
      const operation = (fValue[i] as Model.OperationProto).__on;

      // If this key is a related key to the table
      if (relation) {
        const relationshipType = (schema as any)[cKey];
        const data = normalizedData[relation.__name]

        if (relationshipType === "hasOne") {
          const value = data[record[cKey]];
          // If the value is valid add it to results
          if (operation === "*" || operation(value, record)) {
            if (!result) result = {};
            result[cKey] = value
          }
        }

        if (relationshipType === "hasMany") {
          const values = [];

          for (let i = 0; i < record[cKey].length; i++) {
            const primaryKey = record[cKey][i];
            const row = data[primaryKey];
            if (row) values.push(row);
          }

          // If the value is valid add it to results
          if (operation === "*" || operation(values, record)) {
            if (!result) result = {};
            result[cKey] = values
          }
        }
      }

      // If the value is valid add it to results
      if (!relation && (operation === "*" || operation(record[cKey], record))) {

        if (!result) result = {};
        result[cKey] = record[cKey]
      }

      // Filter the fields based on fields selected.
      if (result && fields && result[cKey]) keepSelectedFields(cKey, result[cKey], fields)
    }


    return result;
  }


  function filterSelectedFields(record: Record<string, any>, select: string[]) {
    for (const key in record) {
      if (!Object.prototype.hasOwnProperty.call(record, key)) continue;
      if (select.includes(key)) continue;
      delete record[key];
    }
  }


  function keepSelectedFields(table: string, result: Record<string, any>, fields: Record<string, string[]>) {
    if (Array.isArray(result)) {
      for (let i = 0; i < result.length; i++) fields[table] && filterSelectedFields(result[i], fields[table])
    }

    if (!Array.isArray(result) && typeof result === "object") {
      fields[table] && filterSelectedFields(result, fields[table])
    }
  }


  function filterUnique(self: Model.Proto, table: string, where: Record<string, any>[]) {
    const schema = self[table] as Model.Table.Proto;
    return where
      .reduce((result, current) => {
        const pk = current[schema.__pk];
        if (pk === undefined) throw new Error("If you want to filter out unique records, you must pass a primary key.")
        if (result.pks.includes(pk)) return result;
        return {
          pks: [...result.pks, pk],
          clauses: [...result.clauses, current]
        }
      }, { pks: [], clauses: [] } as { pks: any[]; clauses: Record<string, any>[] })
      .clauses as Record<string, any>[]
  }


  function applyParentRef(where: Record<string, any>, field: string, value: any) {
    Object.setPrototypeOf(where, {
      __parentField: field,
      __parentValue: value,
    })
  }


  function applyObjectRelations(
    schema: Model.Table.Proto,
    iteration: number,
    clauseKeys: string[],
    clauseValues: any[],
    record: Record<string, any>,
    get: (ckTable: string, ckValue: any) => any,
    fields: Record<string, string[]> | null,
  ) {
    const ckKey = clauseKeys[iteration];
    const ckRelation = (schema.__relationship[ckKey] as Model.Table.Relationship.Proto);
    const ckValue = clauseValues[iteration];
    const relationshipType = (schema as any)[ckKey];

    if (relationshipType === "hasOne") {
      applyParentRef(ckValue, ckKey, record[ckKey]);
      record[ckKey] = get(ckRelation.__name, ckValue)
    }

    if (relationshipType === "hasMany") {
      record[ckKey] = Object
      .values(ckValue)
      .map((ckWhere: any) => {
        applyParentRef(ckWhere, ckKey, record[ckKey]);
        return get(ckRelation.__name, ckWhere)
      })
    }
  }


  Object.setPrototypeOf(model, <Model.Proto>{
    get(table, normalizedData, where, fields) {

      // If our where clause is an array, map over it and get the values
      if (Array.isArray(where)) {
        return filterUnique(this, table, where)
          .flatMap(_where => this.get(table, normalizedData, _where, fields))
      }

      const schema = this[table] as Model.Table.Proto;

      let result: any = null;

      // The selected table
      // Deep copy the object
      const record = normalizedData[table];

      // If there is no record, exit.
      if (!record || Object.keys(record).length === 0) return null;

      // Cleans the where clause
      const clauses = cleanWhere(this, where, table);


      /**
       * If there is a primary key,
       * Search the records for the primary key.
       * If it does not exist, return null
       * Otherwise set the result as the matching value.
       * Lastly, delete the primary key from the where clause and continue.
       */
      if (clauses.__hasPrimaryKey[table]) {
        const primaryKeyValue = clauses[schema.__pk];

        let match = null

        const isJoin = (primaryKeyValue as Model.OperationProto).__isJoin;

        // Join operation on a primary key
        if (isJoin) match = record[(where as Model.ParentRef).__parentValue];

        // If this is the object instead of the primary key value
        // Then it is a relation that contains the primary key
        if (!isJoin && typeof primaryKeyValue === "object") {

          // If the primary key is an object, then it is a relation
          // So this relationship must exist
          const relationTableName = schema.__relationship.__alias[schema.__pk];
          const relation = (schema.__relationship[relationTableName] as Model.Table.Relationship.Proto);
          const relationWhere = { [schema.__pk]: primaryKeyValue[relation.__pk] }

          match = this.get(table, normalizedData, relationWhere, fields)
        }

        // If this is the primary key value
        if (typeof primaryKeyValue !== "object") {
          match = record[primaryKeyValue];
          delete clauses[schema.__pk];
        }

        if (!match) return null;

        // Set result to a new object here to 
        // prevent normalizedData, state.cache from mutating...
        // May need to track this and fix it at the root.
        result = { ...match };
      }


      // If there are conditions
      // Then there was no primary key
      // Find all the records that match the conditions
      // return them in an array
      if (clauses.__conditions.length > 0) {
        const clauseKeys = clauses.__conditions;
        const clauseValues = clauses.__conditions.map(c => clauses[c])
        result = find(record, clauseKeys, clauseValues);
      }


      // There are several possiblilties here
      // 1. Result can be one object or an array
      // 2. The relation is an object, we will recursively call ourself.
      // 4. It may be a join operation, "*" or an "on()" function
      if (clauses.__relations.length > 0) {
        if (!result) result = {};
        const clauseKeys = clauses.__relations;
        const clauseValues = clauses.__relations.map(c => clauses[c])


        // If result is an array
        // The where clause did not contain a primary key, instead it contained conditions.
        // Loop over the results, get all the matching related fields.
        // You probably don't ever want to do this, but it is possible.
        if (Array.isArray(result)) {
          for (let r = 0; r < result.length; r++) {
            for (let ck = 0; ck < clauseKeys.length; ck++) {
              applyObjectRelations(
                schema,
                ck,
                clauseKeys,
                clauseValues,
                result[r],
                (ckTable, ckValue) => this.get(ckTable, normalizedData, ckValue, fields),
                fields,
              )
            }
          }
        }

        // If results is not an array, do the same
        for (let ck = 0; ck < clauseKeys.length; ck++) {
          applyObjectRelations(
            schema,
            ck,
            clauseKeys,
            clauseValues,
            result,
            (ckTable, ckValue) => this.get(ckTable, normalizedData, ckValue, fields),
            fields,
          )
        }

      }


      // If it is a join, there are 3 possiblities
      // 1. Result can be one object or an array
      // 3. "on()" join
      // 4. The join could be performed on a related table as well.
      // 5. Result could be an object, an array or it could not exist.
      if (clauses.__joins.length > 0) {
        const clauseKeys = clauses.__joins;
        const clauseValues = clauses.__joins.map(c => clauses[c] as Model.OperationProto)

        // If there is a result and it is not an array
        // Then find by join for one.
        if (result && !Array.isArray(result)) {

          const findResults = findByJoin(this, table, normalizedData, result, clauseKeys, clauseValues, fields);
          if (!findResults) return null;

          // console.log(this.get(table, normalizedData, ))

          for (let i = 0; i < clauseKeys.length; i++) {
            const cKey = clauseKeys[i];
            const cValue = clauseValues[i];

            // If there is no match and it is not a *, then remove the record
            if (!(cKey in findResults) && cValue.__on !== "*") continue;
            result[cKey] = findResults[cKey];
          }
        }


        // If there is a result and it is an array
        if (result && Array.isArray(result)) {

          const validatedResults = [];

          for (let r = 0; r < result.length; r++) {
            const _result = result[r];
            const findResults = findByJoin(this, table, normalizedData, _result, clauseKeys, clauseValues, fields);

            if (!findResults) continue;

            let current = null;
            for (let i = 0; i < clauseKeys.length; i++) {
              const cKey = clauseKeys[i];
              const cValue = clauseValues[i];

              // If there is no match and it is not a *, then remove the record
              if (!(cKey in findResults) && cValue.__on !== "*") {
                current = null;
                break;
              }

              result[r][cKey] = findResults[cKey];
              current = result[r]
            }

            if (current) validatedResults.push(current)
          }

          return validatedResults
        }


        // If there is no result,
        // then we will return an array of object that match
        if (!result) {

          result = Object
            .values(record)
            .flatMap((res: any) => {

              const findResults = findByJoin(this, table, normalizedData, res, clauseKeys, clauseValues, fields);
              if (!findResults) return []

              for (let i = 0; i < clauseKeys.length; i++) {
                const cKey = clauseKeys[i];
                const cValue = clauseValues[i];

                // If there is no match and it is not a *, then remove the record
                if (!(cKey in findResults) && cValue.__on !== "*") return [];

                res[cKey] = findResults[cKey];
              }

              return res
            })
        }
      }


      // If the we have specified the fields we want to retrieve
      if (fields) keepSelectedFields( where?.__parentField ?? table, result, fields)

      return result
    },
  })

  return model
}

export const operation: Model.Operation = {

  join(on) {
    const obj: any = { operation: "join" }
    Object.setPrototypeOf(obj, {
      __isJoin: true,
      __on: on ?? "*"
    })
    return obj
  }

}