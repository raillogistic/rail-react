import type { AppManifest } from "./contracts";
import { normalizePath } from "./contracts";

type ManifestValidationCode =
  | "duplicate-route-id"
  | "duplicate-route-path"
  | "missing-default-route"
  | "empty-navigation-group"
  | "navigation-route-mismatch";

export interface ManifestValidationIssue {
  code: ManifestValidationCode;
  projectId: string;
  message: string;
}

const buildDuplicateRouteIdIssues = (
  manifest: AppManifest,
): ManifestValidationIssue[] => {
  const seen = new Set<string>();
  const issues: ManifestValidationIssue[] = [];

  for (const route of manifest.routes) {
    if (!seen.has(route.id)) {
      seen.add(route.id);
      continue;
    }

    issues.push({
      code: "duplicate-route-id",
      projectId: manifest.projectId,
      message: `Duplicate route id "${route.id}" in project "${manifest.projectId}".`,
    });
  }

  return issues;
};

const buildDuplicateRoutePathIssues = (
  manifest: AppManifest,
): ManifestValidationIssue[] => {
  const seen = new Set<string>();
  const issues: ManifestValidationIssue[] = [];

  for (const route of manifest.routes) {
    const normalized = normalizePath(route.path);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      continue;
    }

    issues.push({
      code: "duplicate-route-path",
      projectId: manifest.projectId,
      message: `Duplicate route path "${normalized}" in project "${manifest.projectId}".`,
    });
  }

  return issues;
};

const buildMissingDefaultRouteIssues = (
  manifest: AppManifest,
): ManifestValidationIssue[] => {
  const defaultPath = normalizePath(manifest.defaultRoute);
  const hasDefault = manifest.routes.some(
    (route) => normalizePath(route.path) === defaultPath,
  );

  if (hasDefault) {
    return [];
  }

  return [
    {
      code: "missing-default-route",
      projectId: manifest.projectId,
      message: `Default route "${manifest.defaultRoute}" is not declared in project "${manifest.projectId}".`,
    },
  ];
};

const buildEmptyNavigationGroupIssues = (
  manifest: AppManifest,
): ManifestValidationIssue[] =>
  manifest.navigation
    .filter((group) => group.entries.length === 0)
    .map((group) => ({
      code: "empty-navigation-group" as const,
      projectId: manifest.projectId,
      message: `Navigation group "${group.id}" is empty in project "${manifest.projectId}".`,
    }));

const collectNavigationPaths = (manifest: AppManifest): Set<string> => {
  const paths = new Set<string>();

  for (const group of manifest.navigation) {
    for (const entry of group.entries) {
      paths.add(normalizePath(entry.path));
      for (const child of entry.children ?? []) {
        paths.add(normalizePath(child.path));
      }
    }
  }

  return paths;
};

const buildNavigationMismatchIssues = (
  manifest: AppManifest,
): ManifestValidationIssue[] => {
  const routePaths = new Set(
    manifest.routes
      .filter((route) => route.guard === "protected")
      .map((route) => normalizePath(route.path)),
  );
  const navigationPaths = collectNavigationPaths(manifest);

  const issues: ManifestValidationIssue[] = [];
  for (const path of navigationPaths) {
    if (routePaths.has(path)) {
      continue;
    }

    issues.push({
      code: "navigation-route-mismatch",
      projectId: manifest.projectId,
      message: `Navigation path "${path}" has no matching protected route in project "${manifest.projectId}".`,
    });
  }

  return issues;
};

export const validateManifest = (
  manifest: AppManifest,
): ManifestValidationIssue[] => [
  ...buildDuplicateRouteIdIssues(manifest),
  ...buildDuplicateRoutePathIssues(manifest),
  ...buildMissingDefaultRouteIssues(manifest),
  ...buildEmptyNavigationGroupIssues(manifest),
  ...buildNavigationMismatchIssues(manifest),
];

export const validateManifestCollection = (
  manifests: AppManifest[],
): ManifestValidationIssue[] => {
  const routePathOwnership = new Map<string, string>();
  const issues: ManifestValidationIssue[] = [];

  const sorted = [...manifests].sort((a, b) =>
    a.projectId.localeCompare(b.projectId),
  );

  for (const manifest of sorted) {
    for (const route of manifest.routes) {
      const normalizedPath = normalizePath(route.path);
      const owner = routePathOwnership.get(normalizedPath);
      if (!owner) {
        routePathOwnership.set(normalizedPath, manifest.projectId);
        continue;
      }

      issues.push({
        code: "duplicate-route-path",
        projectId: manifest.projectId,
        message: `Route path "${normalizedPath}" is declared by both "${owner}" and "${manifest.projectId}".`,
      });
    }
  }

  return issues;
};

export const assertValidManifestSet = (manifests: AppManifest[]): void => {
  const issues = manifests.flatMap((manifest) => validateManifest(manifest));
  issues.push(...validateManifestCollection(manifests));

  if (issues.length === 0) {
    return;
  }

  const details = issues.map((issue) => `- ${issue.message}`).join("\n");
  throw new Error(`Invalid route manifest configuration:\n${details}`);
};

