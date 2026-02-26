import { describe, expect, it } from "vitest";
import {
  defineProjectManifest,
  navGroup,
  protectedRoute,
} from "../manifestFactory";

describe("manifestFactory", () => {
  it("creates protected routes bound to a project id", () => {
    const route = protectedRoute("starter", {
      id: "starter:overview",
      path: "/starter/overview",
    });

    expect(route.guard).toBe("protected");
    expect(route.projectId).toBe("starter");
  });

  it("creates navigation groups bound to a project id", () => {
    const group = navGroup("starter", {
      id: "starter",
      label: "Starter",
      entries: [],
    });

    expect(group.projectId).toBe("starter");
    expect(group.id).toBe("starter");
  });

  it("returns the same manifest shape", () => {
    const manifest = defineProjectManifest({
      projectId: "starter",
      defaultRoute: "/starter/overview",
      routes: [
        {
          id: "starter:overview",
          path: "/starter/overview",
          guard: "protected",
          projectId: "starter",
        },
      ],
      navigation: [],
    });

    expect(manifest.projectId).toBe("starter");
    expect(manifest.defaultRoute).toBe("/starter/overview");
  });
});
