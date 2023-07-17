namespace UseAPIStore {

  type ForeignKey = string | number;

  type WhereClause<T> = {
    [P in keyof T]?: T[P] extends object
    ? T[P] extends Array<any>
    ? WhereClause<T[P]>
    : WhereClause<T[P]> | ForeignKey
    : WhereClause<T[P]> | ForeignKey;
  };

  interface Context<Data> {
    cache: {};
    upsert: (params: { table: string; data: Data | Data[]; }) => void;
    get: (table: string, where: WhereClause<Data> | null, fields: Record<string, string[]> | null) => Data | null;
  }

  interface Config<Data> {
    table: string;
    get: {
      result?: Data;
      fetch?: (...args: any[]) => Promise<Data>;
      where?: WhereClause<Data>;
    },
    fields?: Record<string, string[]>;
    enabled?: boolean;
  }

  type Op = "eq"

  interface UseQueryReturn<Data> {
    result: Data | null;
    isFetching: boolean;
    error: string | null;
    refetch: (...args: any[]) => Promise<Data>;
  }
}

namespace Model {
  
  interface Model<T = Table.Created> {
    [name: Table.Proto["__name"]]: T;
  }

  interface Prototype<T = Table.Created> {
    get: (
      table: string,
      normalizedData: Record<string, Record<string, any>>,
      where: Record<string, any> | Record<string, any>[],
      fields: Record<string, string[]> | null
    ) => T | null;
  }

  type Proto<T = Table.Created> = Model<T> & Prototype<T>;

  namespace Table {

    type Primitive = "string" | "number" | "boolean" | "bigint";

    type Model = Record<string, Primitive>

    type Created = {
      [field: symbol]: Primitive | "hasOne" | "hasMany";
      hasOne: (model: Created, as?: string) => Created;
      hasMany: (model: Created, as?: string) => Created;
    }

    interface Proto extends Created {
      __pk: string;
      __name: string;
      __isTable?: boolean;
      __relationship: {
        __alias: Record<string, string>
      } & Record<string, Relationship.Has>;
    }

    namespace Relationship {

      interface Has {
        __isForeign: boolean;
      }

      interface Proto extends Has {
        __isTable: boolean;
        __name: string;
        __pk: string;
      }

    }
  }
}
