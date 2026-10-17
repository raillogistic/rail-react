/** Verify that the installed app is discovered with this frontend's page selection. */
import { expect, it } from "vitest";
import application from "@/application";
import sharedProjectOptions from "../shared_project_options";
import { configureApplication } from "@rail/application";
import { __resetManifestRegistryForTests, getProjectManifests } from "@/app/router/manifestRegistry";
import { createAppManifest } from "../../projects/partners/manifest";

it("registers installed Partners pages with the shared access requirements", () => {
  configureApplication(application);
  __resetManifestRegistryForTests();
  const installed = getProjectManifests().find(manifest => manifest.projectId === "partners");
  const expected = createAppManifest(sharedProjectOptions.partners);
  expect(installed).toBeDefined();
  expect(installed?.defaultRoute).toBe(expected.defaultRoute);
  const routeContracts = (manifest: typeof expected) => manifest.routes.map(({ id, path, guard, access }) => ({ id, path, guard, access }));
  expect(installed && routeContracts(installed)).toEqual(routeContracts(expected));
  expect(installed?.navigation).toEqual(expected.navigation);
});
