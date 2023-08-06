import { createStore, createRelationalObject, createRelationalObjectIndex, type ORS } from "@jjmyers/object-relationship-store";
import { useStore, useStoreIndex, useStoreSelect, RelationalStoreProvider } from "./store";
import { useMutation } from "./useMutation";
import { useQuery } from "./useQuery";
import { useInfiniteQuery } from "./useInfiniteQuery";
import { type UseAPIStore } from "./types";

export {
  ORS,
  createStore,
  createRelationalObject,
  createRelationalObjectIndex,
  UseAPIStore,
  useStore,
  useStoreSelect,
  useStoreIndex,
  RelationalStoreProvider,
  useMutation,
  useQuery,
  useInfiniteQuery
}