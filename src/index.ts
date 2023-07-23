import APIStore from "./APIStore";
import { createModel, createTable, operation } from "./model";
import { useInfiniteQuery } from "./useInfiniteQuery";
import { useMutation } from "./useMutation";
import { useQuery } from "./useQuery";
import { UseAPIStore } from "./types";

export {
  type UseAPIStore,
  APIStore,
  createTable,
  createModel,
  operation,
  useMutation,
  useInfiniteQuery,
  useQuery
}