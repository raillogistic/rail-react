import { beforeEach, describe, expect, it, vi } from "vitest";

import { INTEGRATION_VIEWER_QUERY } from "@/graphql/integrationAuth";

import {
  clearWorkerSession,
  getWorkerSession,
  setWorkerSessionToken,
} from "../integration/authSession";
import { createGraphQLAuthClient } from "../integration/graphqlAuthClient";

const config = {
  username: "integration-user",
  password: "integration-pass",
  endpoint: "http://localhost:8000/graphql-test/",
};

const asResponse = (status: number, payload: unknown): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("graphqlAuthClient", () => {
  beforeEach(() => {
    clearWorkerSession("unit-worker");
    clearWorkerSession("unit-retry-worker");
    clearWorkerSession("unit-fail-worker");
  });

  it("reuses worker-cached token across requests", async () => {
    const fetchImpl = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(
        asResponse(200, { data: { login: { ok: true, token: "token-a" } } })
      )
      .mockResolvedValueOnce(
        asResponse(200, { data: { viewer: { id: "1", username: "integration-user" } } })
      )
      .mockResolvedValueOnce(
        asResponse(200, { data: { viewer: { id: "1", username: "integration-user" } } })
      );

    const client = createGraphQLAuthClient(config, {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      workerId: "unit-worker",
      allowMockFetch: true,
    });

    const first = await client.execute(INTEGRATION_VIEWER_QUERY);
    const second = await client.execute(INTEGRATION_VIEWER_QUERY);

    expect(first.errors).toBeUndefined();
    expect(second.errors).toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(getWorkerSession("unit-worker")?.requestCount).toBe(2);
    expect(getWorkerSession("unit-worker")?.reusedRequestCount).toBe(1);
  });

  it("retries once after auth failure and succeeds", async () => {
    setWorkerSessionToken("expired-token", "unit-retry-worker");
    const fetchImpl = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(
        asResponse(200, { errors: [{ message: "Authentication required" }] })
      )
      .mockResolvedValueOnce(
        asResponse(200, { data: { login: { ok: true, token: "fresh-token" } } })
      )
      .mockResolvedValueOnce(
        asResponse(200, { data: { viewer: { id: "1", username: "integration-user" } } })
      );

    const client = createGraphQLAuthClient(config, {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      workerId: "unit-retry-worker",
      allowMockFetch: true,
    });

    const result = await client.execute(INTEGRATION_VIEWER_QUERY);

    expect(result.errors).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    // Existing expired session counts as first login; refresh login increments to 2.
    expect(getWorkerSession("unit-retry-worker")?.loginCount).toBe(2);
  });

  it("clears session when single retry also fails with auth error", async () => {
    setWorkerSessionToken("expired-token", "unit-fail-worker");
    const fetchImpl = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(
        asResponse(200, { errors: [{ message: "Authentication required" }] })
      )
      .mockResolvedValueOnce(
        asResponse(200, { data: { login: { ok: true, token: "fresh-token" } } })
      )
      .mockResolvedValueOnce(
        asResponse(200, { errors: [{ message: "Authentication required" }] })
      );

    const client = createGraphQLAuthClient(config, {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      workerId: "unit-fail-worker",
      allowMockFetch: true,
    });

    await expect(client.execute(INTEGRATION_VIEWER_QUERY)).rejects.toThrow(
      /failed after single retry/
    );
    expect(getWorkerSession("unit-fail-worker")).toBeNull();
  });
});
