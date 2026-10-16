"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "./format";

interface Result<T> {
  key: string;
  data?: T;
  error?: unknown;
}

/**
 * Loads data for serializable params. `loading` is derived from whether the
 * latest result matches the current params, so stale responses are ignored.
 * `fetcher` must be stable (define it at module scope).
 */
export function useServiceQuery<P, T>(fetcher: (params: P) => Promise<T>, params: P) {
  const [nonce, setNonce] = useState(0);
  const key = `${JSON.stringify(params)}#${nonce}`;
  const [result, setResult] = useState<Result<T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const p = JSON.parse(key.slice(0, key.lastIndexOf("#"))) as P;
    fetcher(p).then(
      (data) => !cancelled && setResult({ key, data }),
      (error) => !cancelled && setResult({ key, error }),
    );
    return () => {
      cancelled = true;
    };
  }, [fetcher, key]);

  const current = result?.key === key ? result : null;
  return {
    data: current?.data,
    /** Last successful data, kept while a new request is in flight. */
    previousData: result?.data,
    error: current?.error,
    errorMessage: current?.error ? errorMessage(current.error) : null,
    loading: current === null,
    refetch: useCallback(() => setNonce((n) => n + 1), []),
  };
}
