import { describe, expect, it, vi } from "vitest";

import { loadIntegrationAuthConfig } from "./authConfig";
import { createGraphQLAuthClient } from "./graphqlAuthClient";

describe("graphqlAuth real-endpoint guard", () => {
  it("rejects mocked fetch usage for integration clients", () => {
    const config = loadIntegrationAuthConfig();
    const mockedFetch = vi.fn();
    expect(() =>
      createGraphQLAuthClient(config, {
        fetchImpl: mockedFetch as unknown as typeof fetch,
      })
    ).toThrow(/real endpoint without mocked fetch/);
  });

  it("accepts a non-placeholder real endpoint configuration", () => {
    const config = loadIntegrationAuthConfig();
    expect(() => createGraphQLAuthClient(config)).not.toThrow();
  });
});
