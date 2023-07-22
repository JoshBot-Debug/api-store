export declare namespace UseAPIStore {

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

  interface UseInfiniteQueryConfig<Result, Data, NextPageParams, NextPageKey extends string> {
    table: string;
    get: {
      result?: Result;
      fetch?: (nextParams?: NextPageParams | null) => Promise<Result>;
      where?: WhereClause<InferData<Result, Data>> | WhereClause<InferData<Result, Data>>[];
    };
    getData: (result: Result) => Data[];
    getNextPageParams: (result: Result) => NextPageParams | null | undefined;
    getNextPageKey: (result: Result) => NextPageKey | null | undefined;
    fields?: Record<string, string[]>;
    enabled?: boolean;
  }

  interface UseInfiniteQueryReturn<Data, NextPageParams, NextPageKey> {
    result: Data[];
    isFetching: boolean;
    isLoading: boolean;
    error: string | null;
    refetch: (nextParams?: NextPageParams) => Promise<Data[]>;
    fetchNextPage: () => Promise<Data[] | any[]>;
    hasNextPage: boolean;
    nextPageParams: { nextPageKey?: NextPageKey | null, nextPageParams?: NextPageParams | null }[];
  }

  type InferData<Result, Data> = Data extends undefined ? Result : Data;

  interface UseQueryConfig<Result, Data = undefined> {
    table: string;
    get: {
      result?: InferData<Data, Result>;
      fetch?: (...args: any[]) => Promise<InferData<Data, Result>>;
      where?: WhereClause<InferData<Result, Data>> | WhereClause<InferData<Result, Data>>[];
    };
    getData?: (result: Result) => Data;
    fields?: Record<string, string[]>;
    enabled?: boolean;
  }

  interface UseQueryReturn<Data> {
    result: Data | null;
    isFetching: boolean;
    error: string | null;
    refetch: (...args: any[]) => Promise<Data>;
  }


  interface UseMutationConfig<Data, Args extends Array<any>> {
    table: string;
    mutate: (...args: Args) => Promise<Data>;
  }

  interface UseMutationReturn<Data, Args extends Array<any>> {
    isLoading: boolean;
    error: string | null;
    mutate: (...args: Args) => Promise<Data>;
  }
}

export declare namespace Model {

  interface Model<T = Table.Created> {
    [name: Table.Proto["__name"]]: T;
  }

  interface Prototype<T = Table.Created> {
    get: (
      table: string,
      normalizedData: Record<string, Record<string, any>>,
      where: Record<string, any> | Record<string, any>[],
      fields: Record<string, string[]> | null,
    ) => T | null;
    filterUnique: <Data>(table: string, data: Data[]) => Data[]
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

  interface Operation {

    /**
     * Can be performed on any field, including primary keys.
     * The default value is "*"
     * @param on A function that is called on the value we need to perform a check against
     * @returns A boolean, true to join, false to not
     * @default *
     */
    join: (on?: ((value: any) => boolean) | "*") => string;

  }

  interface OperationProto {
    __isJoin: true,
    __on: ((value: any) => boolean) | "*"
  }

  interface Where<Keys extends string> extends Record<string, any> {
    __conditions: Keys[];
    __joins: Keys[];
    __relations: Keys[];
    __hasPrimaryKey: Record<Keys, boolean>;
  }
}
