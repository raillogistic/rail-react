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
  const lastUserKey = useRef<string | null>(null);

  useEffect(() => {
    if (!options.enabled || !options.userKey) {
      hasWarmedUp.current = false;
      lastUserKey.current = null;
      setActiveMetadataUserKey(null);
      setHydrated(false);
      setWarming(false);
      return;
    }

    const routeHints = options.routeHints ?? [];
    if (!routeHints.length) {
      hasWarmedUp.current = false;
      lastUserKey.current = null;
      setActiveMetadataUserKey(null);
      setHydrated(false);
      setWarming(false);
      return;
    }

    if (hasWarmedUp.current && lastUserKey.current === options.userKey) {
      return;
    }

    let cancelled = false;
    hasWarmedUp.current = true;
    lastUserKey.current = options.userKey;
    setActiveMetadataUserKey(options.userKey);
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
