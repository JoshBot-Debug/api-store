import { useEffect, useRef } from "react";


export const fakeFetch = <T>(result: T, delay: number = 500) => new Promise<T>(resolve => setTimeout(() => resolve(result), delay))

export const useRenderCount = (dep?: any[]) => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
  }, dep);

  return renderCount.current;
};