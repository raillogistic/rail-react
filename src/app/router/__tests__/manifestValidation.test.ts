import { describe, expect, it } from "vitest";
import type { AppManifest } from "../contracts";
import {
  assertValidManifestSet,
  validateManifest,
} from "../manifestValidation";

const createManifest = (overrides?: Partial<AppManifest>): AppManifest => ({
  projectId: "core",
  defaultRoute: "/dashboard",
  routes: [
    {
      id: "dashboard",
      path: "/dashboard",
      guard: "protected",
      projectId: "core",
    },
    {
      id: "login",
      path: "/login",
      guard: "public",
      projectId: "core",
    },
  ],
  navigation: [
    {
      id: "main",
      label: "Main",
      projectId: "core",
      entries: [
        {
          id: "dashboard",
          title: "Dashboard",
          path: "/dashboard",
          guard: "protected",
          routeId: "dashboard",
        },
      ],
    },
  ],
  ...overrides,
});

describe("manifestValidation", () => {
  it("detects duplicate route ids", () => {
    const manifest = createManifest({
      routes: [
        {
          id: "dashboard",
          path: "/dashboard",
          guard: "protected",
          projectId: "core",
        },
        {
          id: "dashboard",
          path: "/dashboard-2",
          guard: "protected",
          projectId: "core",
        },
      ],
    });

    const issues = validateManifest(manifest);
    expect(issues.some((issue) => issue.code === "duplicate-route-id")).toBe(
      true,
    );
  });

  it("detects missing default route", () => {
    const manifest = createManifest({
      defaultRoute: "/missing",
    });

    const issues = validateManifest(manifest);
    expect(issues.some((issue) => issue.code === "missing-default-route")).toBe(
      true,
    );
  });

  it("detects navigation entries without matching protected routes", () => {
    const manifest = createManifest({
      navigation: [
        {
          id: "main",
          label: "Main",
          projectId: "core",
          entries: [
            {
              id: "missing",
              title: "Missing",
              path: "/missing",
              guard: "protected",
            },
          ],
        },
      ],
    });

    const issues = validateManifest(manifest);
    expect(
      issues.some((issue) => issue.code === "navigation-route-mismatch"),
    ).toBe(true);
  });

  it("accepts a valid multi-project manifest set", () => {
    const first = createManifest();
    const second = createManifest({
      projectId: "starter",
      defaultRoute: "/starter/overview",
      routes: [
        {
          id: "starter:overview",
          path: "/starter/overview",
          guard: "protected",
          projectId: "starter",
        },
        {
          id: "starter:login",
          path: "/starter/login",
          guard: "public",
          projectId: "starter",
        },
      ],
      navigation: [
        {
          id: "starter",
          label: "Starter",
          projectId: "starter",
          entries: [
            {
              id: "starter:overview",
              title: "Overview",
              path: "/starter/overview",
              guard: "protected",
              routeId: "starter:overview",
            },
          ],
        },
      ],
    });

    expect(() => assertValidManifestSet([first, second])).not.toThrow();
  });

  it("throws when two manifests declare the same path", () => {
    const first = createManifest({
      projectId: "core",
      routes: [
        {
          id: "dashboard",
          path: "/dashboard",
          guard: "protected",
          projectId: "core",
        },
      ],
      navigation: [],
    });
    const second = createManifest({
      projectId: "billing",
      defaultRoute: "/dashboard",
      routes: [
        {
          id: "billing-dashboard",
          path: "/dashboard",
          guard: "protected",
          projectId: "billing",
        },
      ],
      navigation: [],
    });

    expect(() => assertValidManifestSet([first, second])).toThrow(
      /Route path "\/dashboard" is declared by both/,
    );
  });
});
