import { gql, type ApolloClient } from "@apollo/client";
import { FILTER_METADATA_QUERY, TABLE_MODEL_METADATA_QUERY as GET_MODEL_SCHEMA } from "./queries";

import {
  clearPersistedMetadataStore,
  getPersistedDeployVersion,
  hasPersistedMetadataEntries,
  persistFilterMetadata,
  persistTableMetadata,
  setActiveMetadataUserKey,
  setPersistedDeployVersion,
} from "./persisted-cache";

const METADATA_DEPLOY_VERSION_QUERY = gql`
  query MetadataDeployVersion {
    metadataDeployVersion
  }
`;

const DEFAULT_PRIORITY_LIMIT = 12;
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_PROFILES: MetadataProfileSlice[] = ["filter", "table"];

type MetadataProfileSlice = "filter" | "table";

type WarmupModelHint = {
  app: string;
  model: string;
  profiles?: MetadataProfileSlice[];
};

type WarmupTarget = AvailableModel & {
  profiles: MetadataProfileSlice[];
};

const buildModelKey = (app: string, model: string) => `${app}.${model}`;

type AvailableModel = {
  app: string;
  model: string;
};

type IdleSchedulerWindow = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
};

/**
 * Schedules a task during browser idle time, with a setTimeout fallback.
 */
const scheduleIdle = (task: () => void): void => {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    (window as IdleSchedulerWindow).requestIdleCallback?.(
      () => task(),
      { timeout: 2000 },
    );
  } else {
    setTimeout(task, 0);
  }
};

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0;
  const runners = new Array(Math.max(1, limit)).fill(0).map(async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      try {
        await worker(items[currentIndex]);
      } catch {
        // ignore failures per item
      }
    }
  });

  await Promise.all(runners);
}

const normalizeProfiles = (
  profiles: MetadataProfileSlice[] | undefined,
): MetadataProfileSlice[] => {
  const candidate = profiles?.filter((entry): entry is MetadataProfileSlice =>
    entry === "filter" || entry === "table",
  );
  if (!candidate || candidate.length === 0) {
    return [...DEFAULT_PROFILES];
  }
  return Array.from(new Set(candidate));
};

const fetchMetadataForModel = async (
  client: ApolloClient<unknown>,
  app: string,
  model: string,
  profiles: MetadataProfileSlice[],
): Promise<void> => {
  // Read currently cached values from Apollo cache to avoid unnecessary refetches.
  const cachedFilterData = client.cache.readQuery<{
    modelSchema?: unknown;
    filterSchema?: unknown;
  }>({
    query: FILTER_METADATA_QUERY,
    variables: { app, model },
  });
  const cachedTableData = client.cache.readQuery<{
    modelSchema?: unknown;
  }>({
    query: GET_MODEL_SCHEMA,
    variables: { app, model },
  });
  const needsFilter = !cachedFilterData?.modelSchema || !cachedFilterData?.filterSchema;
  const needsTable = !cachedTableData?.modelSchema;
  const wantsFilter = profiles.includes("filter");
  const wantsTable = profiles.includes("table");
  if ((!needsFilter || !wantsFilter) && (!needsTable || !wantsTable)) {
    return;
  }

  const tasks: Promise<void>[] = [];

  if (needsFilter && wantsFilter) {
    tasks.push(
      client
        .query({
          query: FILTER_METADATA_QUERY,
          variables: { app, model },
          fetchPolicy: "network-only",
        })
        .then((result) => {
          if (result.data?.modelSchema && result.data?.filterSchema) {
            persistFilterMetadata(app, model, {
              modelSchema: result.data.modelSchema,
              filterSchema: result.data.filterSchema,
            });
          }
        }),
    );
  }

  if (needsTable && wantsTable) {
    tasks.push(
      client
        .query({
          query: GET_MODEL_SCHEMA,
          variables: { app, model },
          fetchPolicy: "network-only",
        })
        .then((result) => {
          if (result.data?.modelSchema) {
            persistTableMetadata(app, model, {
              modelSchema: result.data.modelSchema,
            });
          }
        }),
    );
  }

  await Promise.all(tasks);
};

const buildHintTargets = (
  routeHints: WarmupModelHint[] | undefined,
  globalProfiles: MetadataProfileSlice[],
): WarmupTarget[] => {
  const seen = new Set<string>();
  const targets: WarmupTarget[] = [];

  for (const hint of routeHints ?? []) {
    const app = String(hint.app ?? "").trim();
    const model = String(hint.model ?? "").trim();
    if (!app || !model) continue;

    const key = buildModelKey(app, model);
    if (seen.has(key)) continue;
    seen.add(key);

    targets.push({
      app,
      model,
      profiles: normalizeProfiles(hint.profiles ?? globalProfiles),
    });
  }

  return targets;
};

/**
 * Options used to warm metadata for a signed-in user.
 */
export interface WarmupMetadataCacheOptions {
  userKey: string;
  priorityLimit?: number;
  concurrency?: number;
  profiles?: MetadataProfileSlice[];
  routeHints?: WarmupModelHint[];
}

/**
 * Warms filter/table metadata for hinted models and persists it for reuse.
 */
export async function warmupMetadataCache(
  client: ApolloClient<unknown>,
  options: WarmupMetadataCacheOptions,
): Promise<void> {
  const { userKey } = options;
  if (!userKey) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return;
  }

  const profiles = normalizeProfiles(options.profiles);
  // Route-hint-only warmup to avoid loading metadata for every model.
  const targets = buildHintTargets(options.routeHints, profiles);
  if (!targets.length) return;

  setActiveMetadataUserKey(userKey);

  let deployVersion: string | null = null;
  try {
    const versionResult = await client.query({
      query: METADATA_DEPLOY_VERSION_QUERY,
      fetchPolicy: "network-only",
    });
    deployVersion = versionResult.data?.metadataDeployVersion ?? null;
  } catch {
    deployVersion = null;
  }

  if (deployVersion) {
    const storedVersion = getPersistedDeployVersion(userKey);
    if (storedVersion && storedVersion !== deployVersion) {
      clearPersistedMetadataStore(userKey);
    }
    if (
      storedVersion &&
      storedVersion === deployVersion &&
      hasPersistedMetadataEntries(userKey)
    ) {
      return;
    }
  }

  const priorityLimit = options.priorityLimit ?? DEFAULT_PRIORITY_LIMIT;
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;

  const priorityBatch = targets.slice(0, priorityLimit);
  const remainingBatch = targets.slice(priorityLimit);

  await runWithConcurrency(priorityBatch, concurrency, (target) =>
    fetchMetadataForModel(
      client,
      target.app,
      target.model,
      target.profiles,
    ),
  );

  if (remainingBatch.length) {
    scheduleIdle(() => {
      void runWithConcurrency(
        remainingBatch,
        Math.max(1, concurrency - 1),
        (target) =>
          fetchMetadataForModel(
            client,
            target.app,
            target.model,
            target.profiles,
          ),
      );
    });
  }

  if (deployVersion) {
    setPersistedDeployVersion(userKey, deployVersion);
  }
}
