type LocalAppRoutesModule = {
  APP_NAVIGATION_LINKS?: unknown;
  APP_DEFAULT_ROUTE?: unknown;
};

const localModules = import.meta.glob<LocalAppRoutesModule>("./routes.local.ts", {
  eager: true,
});

const localModule = Object.values(localModules)[0];

export const getAppNavigationLinks = (): unknown[] => {
  const links = localModule?.APP_NAVIGATION_LINKS;
  return Array.isArray(links) ? links : [];
};

export const getAppDefaultRoute = (): string | undefined => {
  const route = localModule?.APP_DEFAULT_ROUTE;
  return typeof route === "string" ? route : undefined;
};

