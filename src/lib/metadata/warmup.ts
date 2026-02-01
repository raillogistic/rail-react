import { gql, type ApolloClient } from "@apollo/client";
import { FILTER_METADATA_QUERY } from "@/lib/form/filters/queries";
import { GET_MODEL_SCHEMA } from "@/lib/tablev2/queries";
import {
  getRecentModelKeys,
  isEntryStale,
  persistFilterMetadata,
  persistTableMetadata,
  readPersistedModelEntry,
  setActiveMetadataUserKey,
} from "./persisted-cache";

const AVAILABLE_MODELS_QUERY = gql`
  query AvailableModels {
    availableModels {
      app
      model
    }
  }
`;

const DEFAULT_STALE_MS = 1000 * 60 * 60 * 6;
const DEFAULT_PRIORITY_LIMIT = 12;
const DEFAULT_CONCURRENCY = 3;

type AvailableModel = {
  app: string;
  model: string;
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

const fetchMetadataForModel = async (
  client: ApolloClient<unknown>,
  app: string,
  model: string,
  ttlMs: number,
): Promise<void> => {
  const { needsFilter, needsTable } = shouldFetchEntry(app, model, ttlMs);
  if (!needsFilter && !needsTable) {
    return;
  }

  const tasks: Promise<void>[] = [];

  if (needsFilter) {
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

  if (needsTable) {
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

export async function warmupMetadataCache(
  client: ApolloClient<unknown>,
  options: {
    userKey: string;
    staleMs?: number;
    priorityLimit?: number;
    concurrency?: number;
  },
): Promise<void> {
  const { userKey } = options;
  if (!userKey) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return;
  }

  setActiveMetadataUserKey(userKey);

  const { data } = await client.query({
    query: AVAILABLE_MODELS_QUERY,
    fetchPolicy: "network-only",
  });

  const models: AvailableModel[] = data?.availableModels ?? [];
  if (!models.length) return;

  const recentKeys = getRecentModelKeys(userKey);
  const ordered = prioritizeModels(models, recentKeys);

  const priorityLimit = options.priorityLimit ?? DEFAULT_PRIORITY_LIMIT;
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const staleMs = options.staleMs ?? DEFAULT_STALE_MS;

  const priorityBatch = ordered.slice(0, priorityLimit);
  const remainingBatch = ordered.slice(priorityLimit);

  await runWithConcurrency(priorityBatch, concurrency, (model) =>
    fetchMetadataForModel(client, model.app, model.model, staleMs),
  );

  if (remainingBatch.length) {
    scheduleIdle(() => {
      void runWithConcurrency(
        remainingBatch,
        Math.max(1, concurrency - 1),
        (model) =>
          fetchMetadataForModel(client, model.app, model.model, staleMs),
      );
    });
  }
}
