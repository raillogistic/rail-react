import { describe, expect, it } from "vitest";

import { loadIntegrationAuthConfig } from "../integration/authConfig";

describe("authConfig", () => {
  it("loads integration credentials and endpoint from provided env source", () => {
    const config = loadIntegrationAuthConfig({
      VITE_TEST_USERNAME: "integration-user",
      VITE_TEST_PASSWORD: "integration-pass",
      VITE_TEST_GRAPHQL_ENDPOINT: "http://localhost:8000/graphql-test/",
    });

    expect(config).toEqual({
      username: "integration-user",
      password: "integration-pass",
      endpoint: "http://localhost:8000/graphql-test/",
    });
  });

  it("throws when required integration auth env vars are missing", () => {
    expect(() => loadIntegrationAuthConfig({})).toThrow(
      /Integration auth environment is incomplete/
    );
  });
});
