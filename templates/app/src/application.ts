/** Project-owned branding, routes, and optional Rail extensions. */
import type { RailApplication } from '@/app/application';
import type { AppManifest } from '@/app/router/contracts';

type ManifestModule = { default?: AppManifest; APP_MANIFEST?: AppManifest };
const modules = import.meta.glob<ManifestModule>(['./projects/*/manifest.ts', './apps/routes.local.ts'], { eager: true });

const application: RailApplication = {
  defaultRoute: '/home',
  branding: { productName: 'Mon application', description: 'Votre espace de travail' },
  manifests: Object.values(modules).map(module => module.default ?? module.APP_MANIFEST).filter(Boolean) as AppManifest[],
};
export default application;
