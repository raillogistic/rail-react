import { resolveProjectManifests } from '@raillogistic/shared-apps/runtime';
import sharedProjectOptions from './application/shared_project_options';
/** Project-owned branding, routes, and optional Rail extensions. */
import type { RailApplication } from '@/app/application';
import type { AppManifest } from '@/app/router/contracts';

type ManifestModule = { default?: AppManifest; APP_MANIFEST?: AppManifest };
const modules = import.meta.glob<ManifestModule>(['./projects/**/manifest.ts', './apps/routes.local.ts'], { eager: true });

const application: RailApplication = {
  defaultRoute: '/home',
  branding: {
    productName: 'Plateforme de commandes',
    productNameLong: 'Plateforme de commandes',
    description: 'Votre espace de gestion des commandes',
  },
  manifests: resolveProjectManifests(modules, sharedProjectOptions),
};
export default application;
