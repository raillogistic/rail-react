import { describe, expect, it, vi } from "vitest";

import { INTEGRATION_VIEWER_QUERY } from "@/shared/api/graphql/legacy/integrationAuth";

import { loadIntegrationAuthConfig } from "./authConfig";
import { createGraphQLAuthClient } from "./graphqlAuthClient";

describe("graphqlAuth bootstrap", () => {
  it("fails fast when integration auth env vars are missing", () => {
    const restoreUsername = process.env.VITE_TEST_USERNAME;
    const restorePassword = process.env.VITE_TEST_PASSWORD;
    const restoreEndpoint = process.env.VITE_TEST_GRAPHQL_ENDPOINT;
    vi.stubEnv("VITE_TEST_USERNAME", "");
    vi.stubEnv("VITE_TEST_PASSWORD", "");
    vi.stubEnv("VITE_TEST_GRAPHQL_ENDPOINT", "");
    expect(() => loadIntegrationAuthConfig()).toThrow(
      /Integration auth environment is incomplete/
    );
    vi.stubEnv("VITE_TEST_USERNAME", restoreUsername ?? "");
    vi.stubEnv("VITE_TEST_PASSWORD", restorePassword ?? "");
    vi.stubEnv("VITE_TEST_GRAPHQL_ENDPOINT", restoreEndpoint ?? "");
  });

  it(
    "logs in with username/password and resolves viewer on the real endpoint",
    async () => {
      const config = loadIntegrationAuthConfig();
      const client = createGraphQLAuthClient(config, {
        workerId: "bootstrap-worker",
      });

      const token = await client.ensureToken();
      expect(token).toBeTruthy();

      const response = await client.execute<{ viewer: { username: string } }>(
        INTEGRATION_VIEWER_QUERY
      );
      expect(response.errors).toBeUndefined();
      expect(response.data?.viewer?.username).toBe(config.username);
    },
    30_000
  );
});
