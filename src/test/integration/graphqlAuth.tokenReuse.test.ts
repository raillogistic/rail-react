import { describe, expect, it } from "vitest";

import { INTEGRATION_VIEWER_QUERY } from "@/graphql/integrationAuth";

import { clearWorkerSession, getWorkerTokenReuseRate } from "./authSession";
import { loadIntegrationAuthConfig } from "./authConfig";
import { createGraphQLAuthClient } from "./graphqlAuthClient";

describe("graphqlAuth token reuse", () => {
  it(
    "reuses token for at least 95% of authenticated requests in a worker",
    async () => {
      const config = loadIntegrationAuthConfig();
      const workerId = "token-reuse-worker";
      clearWorkerSession(workerId);
      const client = createGraphQLAuthClient(config, { workerId });

      for (let index = 0; index < 20; index += 1) {
        const response = await client.execute<{ viewer: { username: string } }>(
          INTEGRATION_VIEWER_QUERY
        );
        expect(response.errors).toBeUndefined();
        expect(response.data?.viewer?.username).toBe(config.username);
      }

      const reuseRate = getWorkerTokenReuseRate(workerId);
      expect(reuseRate).toBeGreaterThanOrEqual(0.95);
    },
    60_000
  );
});
