import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, "src");
const migrationMapPath = path.join(repoRoot, "scripts", "layer-migration-map.json");
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

const getLayerFromAbsolutePath = (absolutePath) => {
  const relative = path.relative(srcRoot, absolutePath).replace(/\\/g, "/");
  const overrideMatch = pathOverrides.find(
    (override) =>
      relative === override.prefix || relative.startsWith(`${override.prefix}/`),
  );
  if (overrideMatch) {
    return overrideMatch.layer;
  }

  const [topFolder] = relative.split("/");
  const mappedLayer = topFolderMap[topFolder];
  return layerOrder.includes(mappedLayer) ? mappedLayer : null;
};

const getImportSpecifiers = (source) => {
  const specs = [];
  const staticImportPattern =
    /\b(?:import|export)\s+(?:type\s+)?[\s\S]*?\bfrom\s+["']([^"']+)["']/g;
  const dynamicImportPattern = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

  for (const match of source.matchAll(staticImportPattern)) {
    specs.push(match[1]);
  }
  for (const match of source.matchAll(dynamicImportPattern)) {
    specs.push(match[1]);
  }

  return specs;
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

const listSourceFiles = (dirPath) => {
  const stack = [dirPath];
  const output = [];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (
          entry.name === "node_modules" ||
          entry.name === "dist" ||
          entry.name === "build" ||
          entry.name === "__tests__"
        ) {
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

      output.push(fullPath);
    }
  }

  return output;
};

const allFiles = listSourceFiles(srcRoot).filter((file) =>
  /(\/|\\)(app|processes|pages|widgets|features|entities|shared)(\/|\\)/.test(
    file,
  ),
);

const violations = [];

for (const filePath of allFiles) {
  const importerLayer = getLayerFromAbsolutePath(filePath);
  if (!importerLayer) {
    continue;
  }

  const source = fs.readFileSync(filePath, "utf8");
  const importSpecifiers = getImportSpecifiers(source);
  for (const specifier of importSpecifiers) {
    const resolved = resolveSpecifier(specifier, filePath);
    if (!resolved) {
      continue;
    }

    const importedLayer = getLayerFromAbsolutePath(resolved);
    if (!importedLayer) {
      continue;
    }

    if (importedLayer === importerLayer) {
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

if (violations.length > 0) {
  console.error("Layer import violations:");
  for (const violation of violations) {
    console.error(`- ${violation.filePath}: ${violation.message}`);
  }
  process.exit(1);
}

console.log(
  `Layer import check passed (${allFiles.length} files scanned, no violations).`,
);
