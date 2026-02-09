import { gql, type ApolloClient } from "@apollo/client";
import { FILTER_METADATA_QUERY } from "@/lib/form/filters/queries";
import { GET_MODEL_SCHEMA } from "@/lib/table/queries";
import {
  clearPersistedMetadataStore,
  getPersistedDeployVersion,
  getRecentModelKeys,
  hasPersistedMetadataEntries,
  isEntryStale,
  persistFilterMetadata,
  persistTableMetadata,
  readPersistedModelEntry,
  setActiveMetadataUserKey,
  setPersistedDeployVersion,
} from "./persisted-cache";

const AVAILABLE_MODELS_QUERY = gql`
  query AvailableModels {
    availableModels {
      app
      model
    }
  }
`;

const METADATA_DEPLOY_VERSION_QUERY = gql`
  query MetadataDeployVersion {
    metadataDeployVersion
  }
`;

const DEFAULT_STALE_MS = 1000 * 60 * 60 * 6;
const DEFAULT_PRIORITY_LIMIT = 12;
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_PROFILES: MetadataProfileSlice[] = ["filter", "table"];

type MetadataProfileSlice = "filter" | "table";

type WarmupModelHint = {
  app: string;
  model: string;
  profiles?: MetadataProfileSlice[];
};

type AvailableModel = {
  app: string;
  model: string;
};

type WarmupTarget = AvailableModel & {
  profiles: MetadataProfileSlice[];
};

const buildModelKey = (app: string, model: string) => `${app}.${model}`;

const scheduleIdle = (task: () => void) => {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).requestIdleCallback(task, { timeout: 2000 });
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

const shouldFetchEntry = (
  app: string,
  model: string,
  ttlMs: number,
): { needsFilter: boolean; needsTable: boolean } => {
  const entry = readPersistedModelEntry(app, model);
  const needsFilter = isEntryStale(entry?.filter, ttlMs);
  const needsTable = isEntryStale(entry?.table, ttlMs);
  return { needsFilter, needsTable };
};

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
  ttlMs: number,
  profiles: MetadataProfileSlice[],
): Promise<void> => {
  const { needsFilter, needsTable } = shouldFetchEntry(app, model, ttlMs);
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

const prioritizeModels = (
  models: AvailableModel[],
  recentKeys: string[],
): AvailableModel[] => {
  const recentIndex = new Map(
    recentKeys.map((key, index) => [key, recentKeys.length - index]),
  );

  return [...models].sort((a, b) => {
    const aKey = buildModelKey(a.app, a.model);
    const bKey = buildModelKey(b.app, b.model);
    const aScore = recentIndex.get(aKey) ?? 0;
    const bScore = recentIndex.get(bKey) ?? 0;
    if (aScore !== bScore) {
      return bScore - aScore;
    }
    return aKey.localeCompare(bKey);
  });
};

const buildWarmupTargets = (
  models: AvailableModel[],
  recentKeys: string[],
  globalProfiles: MetadataProfileSlice[],
  routeHints?: WarmupModelHint[],
): WarmupTarget[] => {
  const availableByKey = new Map(
    models.map((entry) => [buildModelKey(entry.app, entry.model), entry]),
  );

  const hintMap = new Map<string, MetadataProfileSlice[]>();
  for (const hint of routeHints ?? []) {
    const key = buildModelKey(hint.app, hint.model);
    if (!availableByKey.has(key)) continue;
    hintMap.set(key, normalizeProfiles(hint.profiles));
  }

  const prioritized = prioritizeModels(models, recentKeys);
  const orderedKeys = [
    ...Array.from(hintMap.keys()),
    ...prioritized.map((entry) => buildModelKey(entry.app, entry.model)),
  ];

  const seen = new Set<string>();
  const targets: WarmupTarget[] = [];
  for (const key of orderedKeys) {
    if (seen.has(key)) continue;
    seen.add(key);

    const model = availableByKey.get(key);
    if (!model) continue;
    targets.push({
      ...model,
      profiles: hintMap.get(key) ?? globalProfiles,
    });
  }

  return targets;
};

export async function warmupMetadataCache(
  client: ApolloClient<unknown>,
  options: {
    userKey: string;
    staleMs?: number;
    priorityLimit?: number;
    concurrency?: number;
    profiles?: MetadataProfileSlice[];
    routeHints?: WarmupModelHint[];
  },
): Promise<void> {
  const { userKey } = options;
  if (!userKey) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return;
  }

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

  const { data } = await client.query({
    query: AVAILABLE_MODELS_QUERY,
    fetchPolicy: "network-only",
  });

  const models: AvailableModel[] = data?.availableModels ?? [];
  if (!models.length) return;

  const recentKeys = getRecentModelKeys(userKey);
  const priorityLimit = options.priorityLimit ?? DEFAULT_PRIORITY_LIMIT;
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const staleMs = options.staleMs ?? DEFAULT_STALE_MS;
  const profiles = normalizeProfiles(options.profiles);
  const targets = buildWarmupTargets(
    models,
    recentKeys,
    profiles,
    options.routeHints,
  );

  const priorityBatch = targets.slice(0, priorityLimit);
  const remainingBatch = targets.slice(priorityLimit);

  await runWithConcurrency(priorityBatch, concurrency, (target) =>
    fetchMetadataForModel(
      client,
      target.app,
      target.model,
      staleMs,
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
            staleMs,
            target.profiles,
          ),
      );
    });
  }

  if (deployVersion) {
    setPersistedDeployVersion(userKey, deployVersion);
  }
}
