import { describe, expect, it } from "vitest";

import { INTEGRATION_VIEWER_QUERY } from "@/shared/api/graphql/legacy/integrationAuth";

import {
  clearWorkerSession,
  getWorkerSession,
  setWorkerSessionToken,
} from "./authSession";
import { loadIntegrationAuthConfig } from "./authConfig";
import { createGraphQLAuthClient } from "./graphqlAuthClient";

describe("graphqlAuth retry", () => {
  it(
    "performs one re-login retry after auth failure and then succeeds",
    async () => {
      const config = loadIntegrationAuthConfig();
      const workerId = "single-retry-worker";
      clearWorkerSession(workerId);
      setWorkerSessionToken("invalid-token", workerId);

      const client = createGraphQLAuthClient(config, { workerId });
      const response = await client.execute<{ viewer: { username: string } }>(
        INTEGRATION_VIEWER_QUERY
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.viewer?.username).toBe(config.username);
      const session = getWorkerSession(workerId);
      expect(session?.loginCount).toBeGreaterThanOrEqual(2);
    },
    30_000
  );
});
