import { useEffect, useRef, useState } from "react";
import { useApolloClient } from "@apollo/client";
import {
  getPersistedDeployVersion,
  hasPersistedMetadataEntries,
  hydrateMetadataCache,
  setActiveMetadataUserKey,
} from "./persisted-cache";
import { warmupMetadataCache } from "./warmup";

export function useMetadataWarmup(options: {
  enabled: boolean;
  userKey: string | null;
  profiles?: Array<"filter" | "table">;
  routeHints?: Array<{
    app: string;
    model: string;
    profiles?: Array<"filter" | "table">;
  }>;
}) {
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

    if (hasWarmedUp.current && lastUserKey.current === options.userKey) {
      return;
    }

    let cancelled = false;
    hasWarmedUp.current = true;
    lastUserKey.current = options.userKey;
    setActiveMetadataUserKey(options.userKey);
    const storedVersion = getPersistedDeployVersion(options.userKey);
    if (storedVersion || hasPersistedMetadataEntries(options.userKey)) {
      hydrateMetadataCache(client.cache, options.userKey);
      setHydrated(true);
    }

    setWarming(true);
    void warmupMetadataCache(client, {
      userKey: options.userKey,
      profiles: options.profiles,
      routeHints: options.routeHints,
    })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          if (!storedVersion) {
            hydrateMetadataCache(client.cache, options.userKey);
            setHydrated(true);
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
