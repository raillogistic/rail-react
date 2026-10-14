/** Compatibility accessor; local manifests are supplied by application configuration. */
import application from '@rail/application';
import type { AppManifest } from './contracts';
export const getLocalManifestExtension = (): AppManifest | null =>
  application.manifests?.find(manifest => manifest.projectId === 'local') ?? null;
