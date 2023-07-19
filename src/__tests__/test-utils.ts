import { useEffect, useRef } from "react";


export const fakeFetch = <T>(result: T, delay: number = 100) => new Promise<T>(resolve => setTimeout(() => resolve(result), delay))

export const useRenderCount = (dep?: any[]) => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
  }, dep);

  return renderCount.current;
};

type PaginationResponse<T> = {
  data: T[];
  nextParams: { createdAt: string; } | null
}

/**
 * Simulates pagination
 * If no nextParams.createdAt isp passed, it will return the first page
 * nextParams.createdAt is the index
 */
export const fakePaginatingFetch = <T>(result: T[], nextParams: PaginationResponse<T>["nextParams"], pageCount: number = 2, delay: number = 100) => {
  return new Promise<PaginationResponse<T>>(resolve => {
    const pages: {[createdAt: string]: PaginationResponse<T>} = {};
    for (let i = 0; i < result.length; i += pageCount) {
      const createdAt = `2023-06-20T17:02:23.${i + 1}00Z`;
      pages[createdAt] = {
        data: result.slice(i, i + pageCount),
        nextParams: result.length - 1 === i ? null : {
          createdAt: `2023-06-20T17:02:23.${pageCount + 1}00Z`
        }
      };
    }
    const p = nextParams?.createdAt ? nextParams.createdAt : Object.keys(pages)[0]
    setTimeout(() => resolve(pages[p]), delay)
  })
}