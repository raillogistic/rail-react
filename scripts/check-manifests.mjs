import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const projectsRoot = path.join(repoRoot, "src", "projects");
const pathsFile = path.join(repoRoot, "src", "shared", "routing", "paths.ts");

const routeConstantEntries = [
  ...fs
    .readFileSync(pathsFile, "utf8")
    .matchAll(/([A-Z0-9_]+):\s*["'`]([^"'`]+)["'`]/g),
];
const routeConstants = Object.fromEntries(
  routeConstantEntries.map((match) => [match[1], match[2]]),
);

const parseRouteConstantsFromFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const entries = [
    ...fs
      .readFileSync(filePath, "utf8")
      .matchAll(/([A-Z0-9_]+):\s*["'`]([^"'`]+)["'`]/g),
  ];

  return Object.fromEntries(entries.map((match) => [match[1], match[2]]));
};

const manifestFiles = fs
  .readdirSync(projectsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(projectsRoot, entry.name, "manifest.tsx"))
  .filter((filePath) => fs.existsSync(filePath));

if (manifestFiles.length === 0) {
  console.log("No project manifests found.");
  process.exit(0);
}

const allRoutePaths = new Map();
const errors = [];

const resolvePathExpression = (rawExpression, scopedRouteConstants = routeConstants) => {
  const expression = rawExpression.trim();

  const literalMatch = expression.match(/^["'`]([^"'`]+)["'`]$/);
  if (literalMatch) {
    return literalMatch[1];
  }

  const routeConstantMatch = expression.match(/^ROUTES\.([A-Z0-9_]+)$/);
  if (routeConstantMatch) {
    return scopedRouteConstants[routeConstantMatch[1]] ?? null;
  }

  return null;
};

const readSection = (source, startPattern, endPattern) => {
  const startMatch = source.match(startPattern);
  if (!startMatch) {
    return "";
  }
  const startIndex = startMatch.index + startMatch[0].length;
  const rest = source.slice(startIndex);
  const endMatch = rest.match(endPattern);
  if (!endMatch) {
    return rest;
  }
  return rest.slice(0, endMatch.index);
};

const stripComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

for (const manifestFile of manifestFiles) {
  const source = stripComments(fs.readFileSync(manifestFile, "utf8"));
  const projectName = path.basename(path.dirname(manifestFile));
  const projectRouteConstants = parseRouteConstantsFromFile(
    path.join(path.dirname(manifestFile), "config", "routes.ts"),
  );
  const scopedRouteConstants = {
    ...routeConstants,
    ...projectRouteConstants,
  };

  const defaultRouteExpressionMatch = source.match(/defaultRoute:\s*([^,\n]+)/);
  const defaultRoute = defaultRouteExpressionMatch
    ? resolvePathExpression(defaultRouteExpressionMatch[1], scopedRouteConstants)
    : null;
  if (!defaultRoute) {
    errors.push(`${projectName}: missing defaultRoute.`);
    continue;
  }
  const routesBlock = readSection(source, /routes:\s*\[/, /\],\s*navigation:/s);
  const navigationBlock = readSection(source, /navigation:\s*\[/, /\],\s*};?/s);

  const routeIds = [...routesBlock.matchAll(/id:\s*["'`]([^"'`]+)["'`]/g)].map(
    (match) => match[1],
  );
  const routePaths = [...routesBlock.matchAll(/path:\s*([^,\n]+)/g)]
    .map((match) => resolvePathExpression(match[1], scopedRouteConstants))
    .filter((routePath) => !!routePath);
  const navPaths = [...navigationBlock.matchAll(/path:\s*([^,\n]+)/g)]
    .map((match) => resolvePathExpression(match[1], scopedRouteConstants))
    .filter((routePath) => !!routePath)
    .filter((routePath) => routePath !== "/");

  const duplicateRouteIds = routeIds.filter(
    (id, index) => routeIds.indexOf(id) !== index,
  );
  const duplicateRoutePaths = routePaths.filter(
    (routePath, index) => routePaths.indexOf(routePath) !== index,
  );

  if (duplicateRouteIds.length > 0) {
    errors.push(
      `${projectName}: duplicate route ids (${[...new Set(duplicateRouteIds)].join(
        ", ",
      )}).`,
    );
  }

  if (duplicateRoutePaths.length > 0) {
    errors.push(
      `${projectName}: duplicate route paths (${[
        ...new Set(duplicateRoutePaths),
      ].join(", ")}).`,
    );
  }

  if (!routePaths.includes(defaultRoute)) {
    errors.push(
      `${projectName}: defaultRoute "${defaultRoute}" is not in routes list.`,
    );
  }

  for (const navPath of navPaths) {
    if (!routePaths.includes(navPath)) {
      errors.push(
        `${projectName}: navigation path "${navPath}" is missing from routes list.`,
      );
    }
  }

  for (const routePath of routePaths) {
    const existingOwner = allRoutePaths.get(routePath);
    if (existingOwner && existingOwner !== projectName) {
      errors.push(
        `${projectName}: route path "${routePath}" also declared by "${existingOwner}".`,
      );
      continue;
    }
    allRoutePaths.set(routePath, projectName);
  }
}

if (errors.length > 0) {
  console.error("Manifest validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `Manifest validation passed (${manifestFiles.length} manifest file(s)).`,
);
