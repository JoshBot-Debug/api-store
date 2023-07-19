import APIStore from "./APIStore";
import { createModel, createTable } from "./model";
import { useInfiniteQuery } from "./useInfiniteQuery";
import { useMutation } from "./useMutation";
import { useQuery } from "./useQuery";
import { UseAPIStore } from "./types";

export {
  type UseAPIStore,
  APIStore,
  createTable,
  createModel,
  useMutation,
  useInfiniteQuery,
  useQuery
}