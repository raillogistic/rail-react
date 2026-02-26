import type { AppManifest } from "./contracts";

type LocalManifestModule = {
  APP_MANIFEST?: AppManifest;
};

const localModules = import.meta.glob<LocalManifestModule>(
  "@/apps/routes.local.ts",
  {
    eager: true,
  },
);

const getFirstLocalModule = (): LocalManifestModule | undefined =>
  Object.values(localModules)[0];

export const getLocalManifestExtension = (): AppManifest | null => {
  const module = getFirstLocalModule();
  return module?.APP_MANIFEST ?? null;
};
