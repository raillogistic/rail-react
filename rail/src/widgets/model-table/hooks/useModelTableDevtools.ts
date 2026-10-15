import { useCallback, useEffect, useRef, useState } from "react";

export type ModelTableDevtoolsTimings = {
  metadataFetchMs: number | null;
  dataFetchMs: number | null;
  tableBuildMs: number | null;
};

function getMonotonicNow(): number {
  if (
    typeof performance !== "undefined" &&
    typeof performance.now === "function"
  ) {
    return performance.now();
  }
  return Date.now();
}

export function formatTimingMs(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }
  if (value <= 0) {
    return "0 ms";
  }
  return `${Math.max(1, Math.ceil(value))} ms`;
}

type UseModelTableDevtoolsInput = {
  enabled: boolean;
  app: string;
  model: string;
  metadataLoading: boolean;
  metadata: unknown;
  metadataError: unknown;
  tableLoading: boolean;
};

export function useModelTableDevtools({
  enabled,
  app,
  model,
  metadataLoading,
  metadata,
  metadataError,
  tableLoading,
}: UseModelTableDevtoolsInput) {
  const [timings, setTimings] = useState<ModelTableDevtoolsTimings>({
    metadataFetchMs: null,
    dataFetchMs: null,
    tableBuildMs: null,
  });
  const metadataFetchStartedAtRef = useRef<number | null>(null);
  const dataFetchStartedAtRef = useRef<number | null>(null);
  const buildFrameRequestRef = useRef<number | null>(null);

  const scheduleBuildMeasure = useCallback(() => {
    if (!enabled) {
      return;
    }

    const buildStartedAt = getMonotonicNow();
    if (
      typeof window === "undefined" ||
      typeof window.requestAnimationFrame !== "function"
    ) {
      setTimings((previous) =>
        previous.tableBuildMs === 0
          ? previous
          : { ...previous, tableBuildMs: 0 },
      );
      return;
    }

    if (buildFrameRequestRef.current !== null) {
      window.cancelAnimationFrame(buildFrameRequestRef.current);
    }

    buildFrameRequestRef.current = window.requestAnimationFrame(() => {
      buildFrameRequestRef.current = null;
      const nextBuildMs = getMonotonicNow() - buildStartedAt;
      setTimings((previous) => ({
        ...previous,
        tableBuildMs: nextBuildMs,
      }));
    });
  }, [enabled]);

  useEffect(() => {
    return () => {
      if (
        typeof window !== "undefined" &&
        buildFrameRequestRef.current !== null &&
        typeof window.cancelAnimationFrame === "function"
      ) {
        window.cancelAnimationFrame(buildFrameRequestRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      enabled ||
      typeof window === "undefined" ||
      buildFrameRequestRef.current === null ||
      typeof window.cancelAnimationFrame !== "function"
    ) {
      return;
    }
    window.cancelAnimationFrame(buildFrameRequestRef.current);
    buildFrameRequestRef.current = null;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    metadataFetchStartedAtRef.current = getMonotonicNow();
    setTimings((previous) => ({
      ...previous,
      metadataFetchMs: null,
    }));
  }, [app, enabled, model]);

  useEffect(() => {
    if (!enabled) {
      metadataFetchStartedAtRef.current = null;
      return;
    }
    if (metadataLoading) {
      if (metadataFetchStartedAtRef.current === null) {
        metadataFetchStartedAtRef.current = getMonotonicNow();
      }
      return;
    }

    if (metadataFetchStartedAtRef.current !== null) {
      const nextMetadataFetchMs =
        getMonotonicNow() - metadataFetchStartedAtRef.current;
      metadataFetchStartedAtRef.current = null;
      setTimings((previous) => ({
        ...previous,
        metadataFetchMs: nextMetadataFetchMs,
      }));
      return;
    }
  }, [enabled, metadata, metadataError, metadataLoading]);

  useEffect(() => {
    if (!enabled) {
      dataFetchStartedAtRef.current = null;
      return;
    }
    if (tableLoading) {
      if (dataFetchStartedAtRef.current === null) {
        dataFetchStartedAtRef.current = getMonotonicNow();
      }
      return;
    }

    if (dataFetchStartedAtRef.current === null) {
      return;
    }

    const nextDataFetchMs = getMonotonicNow() - dataFetchStartedAtRef.current;
    dataFetchStartedAtRef.current = null;
    setTimings((previous) => ({
      ...previous,
      dataFetchMs: nextDataFetchMs,
    }));
    scheduleBuildMeasure();
  }, [enabled, scheduleBuildMeasure, tableLoading]);

  return {
    timings,
    scheduleBuildMeasure,
  };
}
