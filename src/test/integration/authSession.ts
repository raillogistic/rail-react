export interface WorkerAuthSession {
  token: string;
  createdAt: number;
  loginCount: number;
  requestCount: number;
  reusedRequestCount: number;
}

const workerSessions = new Map<string, WorkerAuthSession>();

const resolveWorkerKey = (workerId?: string): string => {
  if (workerId && workerId.trim()) {
    return workerId.trim();
  }
  const vitestWorker = process.env.VITEST_WORKER_ID;
  if (vitestWorker && vitestWorker.trim()) {
    return `vitest-${vitestWorker.trim()}`;
  }
  return `pid-${process.pid}`;
};

export const getWorkerSession = (workerId?: string): WorkerAuthSession | null => {
  const key = resolveWorkerKey(workerId);
  return workerSessions.get(key) ?? null;
};

export const setWorkerSessionToken = (
  token: string,
  workerId?: string,
  previous?: WorkerAuthSession | null
): WorkerAuthSession => {
  const key = resolveWorkerKey(workerId);
  const next: WorkerAuthSession = {
    token,
    createdAt: Date.now(),
    loginCount: (previous?.loginCount ?? 0) + 1,
    requestCount: previous?.requestCount ?? 0,
    reusedRequestCount: previous?.reusedRequestCount ?? 0,
  };
  workerSessions.set(key, next);
  return next;
};

export const clearWorkerSession = (workerId?: string): void => {
  workerSessions.delete(resolveWorkerKey(workerId));
};

export const trackWorkerRequest = (
  reusedToken: boolean,
  workerId?: string
): WorkerAuthSession | null => {
  const key = resolveWorkerKey(workerId);
  const current = workerSessions.get(key);
  if (!current) {
    return null;
  }
  const updated: WorkerAuthSession = {
    ...current,
    requestCount: current.requestCount + 1,
    reusedRequestCount:
      current.reusedRequestCount + (reusedToken ? 1 : 0),
  };
  workerSessions.set(key, updated);
  return updated;
};

export const getWorkerTokenReuseRate = (workerId?: string): number => {
  const session = getWorkerSession(workerId);
  if (!session || session.requestCount === 0) {
    return 0;
  }
  return session.reusedRequestCount / session.requestCount;
};
