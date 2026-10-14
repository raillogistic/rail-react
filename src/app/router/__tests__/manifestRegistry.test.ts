/** Generic manifest registration must work without any purchasing application. */
import { describe, expect, it, vi } from 'vitest';
vi.mock('@rail/application', () => ({ default: { manifests: [{
  projectId: 'fixture', defaultRoute: '/fixture', routes: [{
    id: 'fixture:index', path: '/fixture', title: 'Exemple', projectId: 'fixture', guard: 'protected', element: null,
  }], navigation: [],
}] } }));
import { getAllRoutes, getProjectManifests, isProtectedRoute } from '../manifestRegistry';

describe('shared manifest registry', () => {
  it('combines generic core routes with supplied application manifests', () => {
    expect(getProjectManifests().map(manifest => manifest.projectId)).toEqual(expect.arrayContaining(['core', 'fixture']));
    expect(getAllRoutes().some(route => route.id === 'fixture:index')).toBe(true);
    expect(isProtectedRoute('/login')).toBe(false);
    expect(isProtectedRoute('/fixture')).toBe(true);
    expect(isProtectedRoute('/unregistered')).toBe(true);
  });
});
