export const normalizeSessionIdClaim = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
};

export const selectSessionIdFromTokenPayload = (
  payload: Record<string, unknown> | null | undefined,
): string | null => {
  if (!payload) {
    return null;
  }

  const candidates = [
    payload.session_id,
    payload.sessionId,
    payload.sid,
    payload.jti,
  ];

  for (const candidate of candidates) {
    const resolved = normalizeSessionIdClaim(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return null;
};

export const createFallbackSessionId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `client-session-${crypto.randomUUID()}`;
  }

  return `client-session-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};
