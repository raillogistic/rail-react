export type MetadataProfile = "table" | "form" | "filter";

export interface MetadataRequestSample {
  app: string;
  model: string;
  profile: MetadataProfile;
  durationMs: number;
  payloadBytes: number;
  cacheHit: boolean;
  timestamp: number;
}

interface ProfileTelemetryState {
  requests: number;
  cacheHits: number;
  payloadBytes: number;
  avgDurationMs: number;
}

interface MetadataTelemetryState {
  totalRequests: number;
  totalCacheHits: number;
  totalPayloadBytes: number;
  profiles: Record<MetadataProfile, ProfileTelemetryState>;
  lastSample: MetadataRequestSample | null;
}

const buildInitialProfileState = (): ProfileTelemetryState => ({
  requests: 0,
  cacheHits: 0,
  payloadBytes: 0,
  avgDurationMs: 0,
});

const state: MetadataTelemetryState = {
  totalRequests: 0,
  totalCacheHits: 0,
  totalPayloadBytes: 0,
  profiles: {
    table: buildInitialProfileState(),
    form: buildInitialProfileState(),
    filter: buildInitialProfileState(),
  },
  lastSample: null,
};

export function recordMetadataRequest(sample: MetadataRequestSample): void {
  const profileState = state.profiles[sample.profile];
  profileState.requests += 1;
  profileState.cacheHits += sample.cacheHit ? 1 : 0;
  profileState.payloadBytes += sample.payloadBytes;
  profileState.avgDurationMs =
    profileState.requests === 1
      ? sample.durationMs
      : (profileState.avgDurationMs * (profileState.requests - 1) +
          sample.durationMs) /
        profileState.requests;

  state.totalRequests += 1;
  state.totalCacheHits += sample.cacheHit ? 1 : 0;
  state.totalPayloadBytes += sample.payloadBytes;
  state.lastSample = sample;
}

/**
 * Returns a snapshot copy of the current metadata telemetry counters.
 */
export function getMetadataTelemetrySnapshot(): MetadataTelemetryState {
  return {
    totalRequests: state.totalRequests,
    totalCacheHits: state.totalCacheHits,
    totalPayloadBytes: state.totalPayloadBytes,
    profiles: {
      table: { ...state.profiles.table },
      form: { ...state.profiles.form },
      filter: { ...state.profiles.filter },
    },
    lastSample: state.lastSample ? { ...state.lastSample } : null,
  };
}

/**
 * Resets all telemetry counters to their initial state.
 */
export function resetMetadataTelemetry(): void {
  state.totalRequests = 0;
  state.totalCacheHits = 0;
  state.totalPayloadBytes = 0;
  state.profiles.table = buildInitialProfileState();
  state.profiles.form = buildInitialProfileState();
  state.profiles.filter = buildInitialProfileState();
  state.lastSample = null;
}
