import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, "src");
const migrationMapPath = path.join(repoRoot, "scripts", "layer-migration-map.json");
const strictMode = process.argv.includes("--strict");

const layerOrder = [
  "shared",
  "entities",
  "features",
  "widgets",
  "pages",
  "processes",
  "app",
];

const layerWeight = Object.fromEntries(
  layerOrder.map((layer, index) => [layer, index]),
);

const migrationMapConfig = JSON.parse(fs.readFileSync(migrationMapPath, "utf8"));
const topFolderMap =
  migrationMapConfig.topFolders && typeof migrationMapConfig.topFolders === "object"
    ? migrationMapConfig.topFolders
    : migrationMapConfig;

const pathOverrides = Array.isArray(migrationMapConfig.pathOverrides)
  ? migrationMapConfig.pathOverrides
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }
        const prefix =
          typeof entry.prefix === "string"
            ? entry.prefix.replace(/^\/+|\/+$/g, "")
            : "";
        const layer = typeof entry.layer === "string" ? entry.layer : "";
        if (!prefix || !layerOrder.includes(layer)) {
          return null;
        }
        return { prefix, layer };
      })
      .filter(Boolean)
      .sort((a, b) => b.prefix.length - a.prefix.length)
  : [];

const shouldIgnoreDirectory = (directoryName) =>
  directoryName === "node_modules" ||
  directoryName === "dist" ||
  directoryName === "build" ||
  directoryName === "coverage" ||
  directoryName === "__tests__";

const listSourceFiles = (dirPath) => {
  const stack = [dirPath];
  const output = [];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (shouldIgnoreDirectory(entry.name)) {
          continue;
        }
        stack.push(fullPath);
        continue;
      }

      if (!/\.(ts|tsx)$/.test(entry.name)) {
        continue;
      }
      if (/\.(test|spec)\.(ts|tsx)$/.test(entry.name)) {
        continue;
      }
      if (entry.name === "schema.ts" || entry.name === "models.ts") {
        continue;
      }

      output.push(fullPath);
    }
  }

  return output;
};

const normalizeRelativePath = (absolutePath) =>
  path.relative(srcRoot, absolutePath).replace(/\\/g, "/");

const getTopFolder = (absolutePath) => {
  const relativePath = normalizeRelativePath(absolutePath);
  return relativePath.split("/")[0] ?? null;
};

const resolveMappedLayer = (absolutePath) => {
  const relativePath = normalizeRelativePath(absolutePath);
  const overrideMatch = pathOverrides.find(
    (override) =>
      relativePath === override.prefix ||
      relativePath.startsWith(`${override.prefix}/`),
  );
  if (overrideMatch) {
    return overrideMatch.layer;
  }

  const topFolder = getTopFolder(absolutePath);
  if (!topFolder) {
    return null;
  }
  const mappedLayer = topFolderMap[topFolder];
  return layerOrder.includes(mappedLayer) ? mappedLayer : null;
};

const getImportSpecifiers = (sourceCode) => {
  const specifiers = [];
  const staticImportPattern =
    /\b(?:import|export)\s+(?:type\s+)?[\s\S]*?\bfrom\s+["']([^"']+)["']/g;
  const dynamicImportPattern = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

  for (const match of sourceCode.matchAll(staticImportPattern)) {
    specifiers.push(match[1]);
  }
  for (const match of sourceCode.matchAll(dynamicImportPattern)) {
    specifiers.push(match[1]);
  }

  return specifiers;
};

const resolveSpecifier = (specifier, importerPath) => {
  if (specifier.startsWith("@/")) {
    return path.join(srcRoot, specifier.slice(2));
  }
  if (specifier.startsWith(".")) {
    return path.resolve(path.dirname(importerPath), specifier);
  }
  return null;
};

const allFiles = listSourceFiles(srcRoot);
const violations = [];
const scannedByRoot = new Map();

for (const filePath of allFiles) {
  const topFolder = getTopFolder(filePath) ?? "(unknown)";
  scannedByRoot.set(topFolder, (scannedByRoot.get(topFolder) ?? 0) + 1);

  const importerLayer = resolveMappedLayer(filePath);
  if (!importerLayer) {
    continue;
  }

  const sourceCode = fs.readFileSync(filePath, "utf8");
  const importSpecifiers = getImportSpecifiers(sourceCode);

  for (const specifier of importSpecifiers) {
    const resolvedPath = resolveSpecifier(specifier, filePath);
    if (!resolvedPath) {
      continue;
    }

    const importedLayer = resolveMappedLayer(resolvedPath);
    if (!importedLayer || importedLayer === importerLayer) {
      continue;
    }

    if (layerWeight[importedLayer] <= layerWeight[importerLayer]) {
      continue;
    }

    violations.push({
      filePath: path.relative(repoRoot, filePath).replace(/\\/g, "/"),
      message: `${importerLayer} cannot import ${importedLayer}: "${specifier}"`,
    });
  }
}

const sortedRoots = [...scannedByRoot.entries()].sort(([a], [b]) =>
  a.localeCompare(b),
);
console.log(
  `Layer full-scan analyzed ${allFiles.length} file(s) across ${sortedRoots.length} root folder(s).`,
);
for (const [rootName, count] of sortedRoots) {
  console.log(`- ${rootName}: ${count}`);
}

if (violations.length === 0) {
  console.log("Layer full-scan found no mapped layer violations.");
  process.exit(0);
}

console.error(`Layer full-scan found ${violations.length} violation(s).`);
for (const violation of violations.slice(0, 200)) {
  console.error(`- ${violation.filePath}: ${violation.message}`);
}
if (violations.length > 200) {
  console.error(`... ${violations.length - 200} additional violation(s) omitted.`);
}

if (strictMode) {
  process.exit(1);
}

console.warn(
  "Layer full-scan ran in report mode. Use --strict to fail on violations.",
);
process.exit(0);
