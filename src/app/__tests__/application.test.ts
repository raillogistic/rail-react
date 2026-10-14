/** Shared imports remain independent of host manifests until startup registration. */
import { afterEach, expect, it } from 'vitest';
import application, { configureApplication } from '../../application';
import { __resetManifestRegistryForTests, getDefaultRoute, getProjectManifests } from '../router/manifestRegistry';

afterEach(() => { configureApplication({}); __resetManifestRegistryForTests(); });

it('registers application routes before navigation is first resolved', () => {
  configureApplication({ defaultRoute: '/example', manifests: [{
    projectId: 'example', label: 'Exemple', icon: () => null, defaultRoute: '/example', navigation: [], routes: [{
      id: 'example:index', path: '/example', projectId: 'example', guard: 'protected', element: null,
    }],
  }] });
  __resetManifestRegistryForTests();
  expect(getDefaultRoute()).toBe('/example');
  expect(getProjectManifests().some(manifest => manifest.projectId === 'example')).toBe(true);
  expect(application.defaultRoute).toBe('/example');
});
