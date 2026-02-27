import { useEffect, useRef, useState } from "react";
import { useApolloClient } from "@apollo/client";
import {
  getPersistedDeployVersion,
  hasPersistedMetadataEntries,
  hydrateMetadataCache,
  setActiveMetadataUserKey,
} from "./persisted-cache";
import { warmupMetadataCache } from "./warmup";

/**
 * Hint describing a model that should be considered during metadata warmup.
 */
export interface MetadataWarmupRouteHint {
  app: string;
  model: string;
  profiles?: Array<"filter" | "table">;
}

/**
 * Options for `useMetadataWarmup`.
 */
export interface UseMetadataWarmupOptions {
  enabled: boolean;
  userKey: string | null;
  profiles?: Array<"filter" | "table">;
  routeHints?: MetadataWarmupRouteHint[];
}

/**
 * Hydrates persisted metadata and starts background warmup for route hints.
 */
export function useMetadataWarmup(options: UseMetadataWarmupOptions) {
  const client = useApolloClient();
  const [hydrated, setHydrated] = useState(false);
  const [warming, setWarming] = useState(false);
  const hasWarmedUp = useRef(false);
  const lastRunKey = useRef<string | null>(null);

  useEffect(() => {
    if (!options.enabled || !options.userKey) {
      hasWarmedUp.current = false;
      lastRunKey.current = null;
      setActiveMetadataUserKey(null);
      setHydrated(false);
      setWarming(false);
      return;
    }

    const routeHints = options.routeHints ?? [];
    const runKey = JSON.stringify({
      userKey: options.userKey,
      routeHints: routeHints.map((hint) => ({
        app: hint.app,
        model: hint.model,
        profiles: hint.profiles ?? [],
      })),
      profiles: options.profiles ?? [],
    });

    if (hasWarmedUp.current && lastRunKey.current === runKey) {
      return;
    }

    let cancelled = false;
    hasWarmedUp.current = true;
    lastRunKey.current = runKey;
    setActiveMetadataUserKey(options.userKey);

    if (!routeHints.length) {
      const hydrateResult = hydrateMetadataCache(client.cache, options.userKey);
      setHydrated(hydrateResult.entries > 0);
      setWarming(false);
      return;
    }

    const storedVersion = getPersistedDeployVersion(options.userKey);
    if (storedVersion || hasPersistedMetadataEntries(options.userKey)) {
      const hydrateResult = hydrateMetadataCache(client.cache, options.userKey, {
        routeHints,
      });
      setHydrated(hydrateResult.entries > 0);
    }

    setWarming(true);
    void warmupMetadataCache(client, {
      userKey: options.userKey,
      profiles: options.profiles,
      routeHints,
    })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          if (!storedVersion) {
            const hydrateResult = hydrateMetadataCache(
              client.cache,
              options.userKey,
              {
                routeHints,
              },
            );
            setHydrated(hydrateResult.entries > 0);
          }
          setWarming(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    client,
    options.enabled,
    options.profiles,
    options.routeHints,
    options.userKey,
  ]);

  return { hydrated, warming };
}
