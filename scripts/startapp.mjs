#!/usr/bin/env node

import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { constants as fsConstants } from "node:fs";

const usage = `
Usage:
  npm run startapp -- <app-name>
  yarn startapp <app-name>

Example:
  npm run startapp -- sample-app
`;

const rawArg = process.argv[2];

if (!rawArg || rawArg === "--help" || rawArg === "-h") {
  console.log(usage.trim());
  process.exit(rawArg ? 0 : 1);
}

const toKebabCase = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");

const toPascalCase = (value) =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const appName = toKebabCase(rawArg);
if (!appName) {
  console.error("Invalid app name. Use letters, numbers, or separators.");
  process.exit(1);
}

const projectId = appName;
const componentPrefix = toPascalCase(appName);
const routeBase = `/${appName}`;
const routes = {
  overview: `${routeBase}/overview`,
  reports: `${routeBase}/reports`,
};

const root = process.cwd();
const projectDir = path.join(root, "src", "projects", appName);
const pagesDir = path.join(projectDir, "pages");
const configDir = path.join(projectDir, "config");

const assertMissing = async (targetPath) => {
  try {
    await access(targetPath, fsConstants.F_OK);
    throw new Error(`Path already exists: ${targetPath}`);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
};

const overviewPageContent = `import type { FC } from "react";

export const ${componentPrefix}OverviewPage: FC = () => {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">${componentPrefix} Overview</h1>
        <p className="text-sm text-muted-foreground">
          This page is scaffolded for the "${projectId}" project.
        </p>
      </header>
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Build your ${projectId} feature modules here.
      </div>
    </section>
  );
};

export default ${componentPrefix}OverviewPage;
`;

const reportsPageContent = `import type { FC } from "react";

export const ${componentPrefix}ReportsPage: FC = () => {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">${componentPrefix} Reports</h1>
        <p className="text-sm text-muted-foreground">
          Secondary view scaffolded for reporting and analytics.
        </p>
      </header>
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Add reporting widgets and data hooks for ${projectId}.
      </div>
    </section>
  );
};

export default ${componentPrefix}ReportsPage;
`;

const routesConfigContent = `export const ROUTES = {
  OVERVIEW: "${routes.overview}",
  REPORTS: "${routes.reports}",
} as const;
`;

const manifestContent = `import { lazy, Suspense, type ReactNode } from "react";
import { FileText, LayoutDashboard } from "lucide-react";
import type { AppManifest } from "@/app/router/contracts";
import {
  defineProjectManifest,
  navGroup,
  protectedRoute,
} from "@/app/router/manifestFactory";
import { ROUTES } from "@/projects/${projectId}/config/routes";

const routeFallback = (
  <div className="rounded-md border p-3 text-sm text-muted-foreground">
    Chargement...
  </div>
);

const withRouteSuspense = (component: ReactNode) => (
  <Suspense fallback={routeFallback}>{component}</Suspense>
);

const ${componentPrefix}OverviewPage = lazy(() =>
  import("./pages/${componentPrefix}OverviewPage").then((module) => ({
    default: module.${componentPrefix}OverviewPage,
  })),
);

const ${componentPrefix}ReportsPage = lazy(() =>
  import("./pages/${componentPrefix}ReportsPage").then((module) => ({
    default: module.${componentPrefix}ReportsPage,
  })),
);

export const ${componentPrefix.toUpperCase()}_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "${projectId}",
  order: 100,
  defaultRoute: ROUTES.OVERVIEW,
  routes: [
    protectedRoute("${projectId}", {
      id: "${projectId}:overview",
      path: ROUTES.OVERVIEW,
      title: "${componentPrefix} Overview",
      description: "Overview for the ${projectId} project",
      icon: LayoutDashboard,
      element: withRouteSuspense(<${componentPrefix}OverviewPage />),
    }),
    protectedRoute("${projectId}", {
      id: "${projectId}:reports",
      path: ROUTES.REPORTS,
      title: "${componentPrefix} Reports",
      description: "Reporting views for the ${projectId} project",
      icon: FileText,
      element: withRouteSuspense(<${componentPrefix}ReportsPage />),
    }),
  ],
  navigation: [
    navGroup("${projectId}", {
      id: "${projectId}",
      label: "${componentPrefix}",
      order: 0,
      entries: [
        {
          id: "${projectId}:overview",
          routeId: "${projectId}:overview",
          title: "Overview",
          path: ROUTES.OVERVIEW,
          guard: "protected",
          icon: LayoutDashboard,
          description: "Main workspace",
        },
        {
          id: "${projectId}:reports",
          routeId: "${projectId}:reports",
          title: "Reports",
          path: ROUTES.REPORTS,
          guard: "protected",
          icon: FileText,
          description: "Reports and analytics",
        },
      ],
    }),
  ],
});

export default ${componentPrefix.toUpperCase()}_MANIFEST;
`;

const manifestReExportContent = `export { default, ${componentPrefix.toUpperCase()}_MANIFEST } from "./manifest.tsx";
`;

const run = async () => {
  await assertMissing(projectDir);
  await Promise.all([
    mkdir(pagesDir, { recursive: true }),
    mkdir(configDir, { recursive: true }),
  ]);

  await Promise.all([
    writeFile(
      path.join(pagesDir, `${componentPrefix}OverviewPage.tsx`),
      overviewPageContent,
      "utf8",
    ),
    writeFile(
      path.join(pagesDir, `${componentPrefix}ReportsPage.tsx`),
      reportsPageContent,
      "utf8",
    ),
    writeFile(path.join(configDir, "routes.ts"), routesConfigContent, "utf8"),
    writeFile(path.join(projectDir, "manifest.tsx"), manifestContent, "utf8"),
    writeFile(path.join(projectDir, "manifest.ts"), manifestReExportContent, "utf8"),
  ]);

  console.log(`Created project scaffold at src/projects/${appName}`);
  console.log("Next step: run `npm run test -- src/app/router --run`");
};

run().catch((error) => {
  console.error(
    `Failed to create app "${rawArg}".`,
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
