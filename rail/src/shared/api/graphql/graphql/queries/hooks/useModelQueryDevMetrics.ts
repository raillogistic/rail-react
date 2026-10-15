import { useEffect, useMemo, useRef, useState } from "react";
import type { UseModelQueryDevMetrics } from "../types";

/**
 * Input shape for development metric timing calculations.
 */
interface UseModelQueryDevMetricsOptions {
  /**
   * Current metadata loading state.
   */
  metadataLoading: boolean;
  /**
   * Current query loading state from Apollo.
   */
  dataLoading: boolean;
  /**
   * Indicates whether query execution is currently skipped.
   */
  skipQuery: boolean;
  /**
   * Stable key representing the active data request.
   */
  requestKey: string;
  /**
   * Stable key representing the active metadata request.
   */
  metadataKey: string;
}

/**
 * Tracks metadata and data fetch durations in milliseconds for dev inspection.
 */
export function useModelQueryDevMetrics(
  options: UseModelQueryDevMetricsOptions,
): UseModelQueryDevMetrics {
  const [metadataFetchMs, setMetadataFetchMs] = useState<number | null>(null);
  const [dataFetchMs, setDataFetchMs] = useState<number | null>(null);
  const metadataStartRef = useRef<number | null>(null);
  const dataStartRef = useRef<number | null>(null);

  useEffect(() => {
    metadataStartRef.current = null;
    setMetadataFetchMs(null);
  }, [options.metadataKey]);

  useEffect(() => {
    if (options.metadataLoading) {
      if (metadataStartRef.current === null) {
        metadataStartRef.current = Date.now();
      }
      return;
    }

    if (metadataFetchMs !== null) {
      return;
    }

    if (metadataStartRef.current === null) {
      setMetadataFetchMs(0);
      return;
    }

    setMetadataFetchMs(Date.now() - metadataStartRef.current);
    metadataStartRef.current = null;
  }, [metadataFetchMs, options.metadataLoading]);

  useEffect(() => {
    dataStartRef.current = null;
    setDataFetchMs(null);
  }, [options.requestKey]);

  useEffect(() => {
    if (options.skipQuery) {
      if (dataFetchMs === null) {
        setDataFetchMs(0);
      }
      return;
    }

    if (options.dataLoading) {
      if (dataStartRef.current === null) {
        dataStartRef.current = Date.now();
      }
      return;
    }

    if (dataFetchMs !== null) {
      return;
    }

    if (dataStartRef.current === null) {
      setDataFetchMs(0);
      return;
    }

    setDataFetchMs(Date.now() - dataStartRef.current);
    dataStartRef.current = null;
  }, [dataFetchMs, options.dataLoading, options.skipQuery]);

  return useMemo(
    () => ({
      metadataFetchMs,
      dataFetchMs,
    }),
    [dataFetchMs, metadataFetchMs],
  );
}
