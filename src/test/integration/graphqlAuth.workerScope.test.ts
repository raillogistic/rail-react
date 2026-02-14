import { describe, expect, it } from "vitest";

import { getWorkerSession } from "./authSession";
import { loadIntegrationAuthConfig } from "./authConfig";
import { createGraphQLAuthClient } from "./graphqlAuthClient";

describe("graphqlAuth worker scope", () => {
  it(
    "keeps token cache isolated per worker id",
    async () => {
      const config = loadIntegrationAuthConfig();
      const clientA = createGraphQLAuthClient(config, { workerId: "worker-A" });
      const clientB = createGraphQLAuthClient(config, { workerId: "worker-B" });

      const tokenA = await clientA.ensureToken();
      const tokenB = await clientB.ensureToken();

      expect(tokenA).toBeTruthy();
      expect(tokenB).toBeTruthy();
      expect(getWorkerSession("worker-A")?.token).toBe(tokenA);
      expect(getWorkerSession("worker-B")?.token).toBe(tokenB);

      clientA.resetSession();
      expect(getWorkerSession("worker-A")).toBeNull();
      expect(getWorkerSession("worker-B")?.token).toBe(tokenB);
    },
    30_000
  );
});
