/** Verify host and shared app registration, including cross-project identity collisions. */
import { expect, it } from 'vitest';
import application from '@/application';
import { configureApplication } from '@rail/application';
import { __resetManifestRegistryForTests, getProjectManifests } from '@/app/router/manifestRegistry';

it('registers shared apps without project or route identity collisions', () => {
  configureApplication(application);
  __resetManifestRegistryForTests();
  const manifests = getProjectManifests();
  expect(new Set(manifests.map(manifest => manifest.projectId)).size).toBe(manifests.length);
  const routes = manifests.flatMap(manifest => manifest.routes);
  expect(new Set(routes.map(route => route.id)).size).toBe(routes.length);
});
