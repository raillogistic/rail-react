#!/usr/bin/env node

import { constants as fsConstants } from "node:fs";
import {
  access,
  readFile,
  writeFile,
  rm,
  readdir,
  rmdir,
} from "node:fs/promises";
import path from "node:path";

const usage = `
Usage:
  npm run unregister -- --model <app.model> --project <project> [options]

Required:
  --model <app.model>      Model reference (for example: catalog.article)
  --project <project>      Existing project under src/projects/<project>

Options:
  --app <app>              App name when --model has no app prefix
  --slug <slug>            Model slug override (default: inferred from model)
  --keep-files             Keep generated page files on disk
  --force                  Continue even if some entries are missing
  --dry-run                Print planned changes without writing files
  --help, -h               Show this help

Examples:
  npm run unregister -- --model catalog.article --project catalog
  npm run unregister -- --model article --app catalog --project catalog
  npm run unregister -- --model operations.restitution --project operations --dry-run
`;

const parseArgs = (argv) => {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "-h" || token === "--help") {
      options.help = true;
      continue;
    }

    if (!token.startsWith("--")) {
      continue;
    }

    if (token.startsWith("--no-")) {
      options[token.slice(5)] = false;
      continue;
    }

    const equalsIndex = token.indexOf("=");
    if (equalsIndex > 0) {
      options[token.slice(2, equalsIndex)] = token.slice(equalsIndex + 1);
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      options[key] = next;
      index += 1;
      continue;
    }

    options[key] = true;
  }
  return options;
};

const splitWords = (value) =>
  String(value ?? "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const capitalizeWord = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "";

const toPascalCase = (value) => splitWords(value).map(capitalizeWord).join("");

const toKebabCase = (value) => splitWords(value).map((word) => word.toLowerCase()).join("-");

const toConstantCase = (value) =>
  splitWords(value)
    .map((word) => word.toUpperCase())
    .join("_");

const resolveModelReference = (modelOption, appOption) => {
  const modelInput = String(modelOption ?? "").trim();
  if (!modelInput) {
    return { appName: "", modelName: "" };
  }

  if (modelInput.includes(".")) {
    const [rawApp, ...rest] = modelInput.split(".");
    return {
      appName: rawApp,
      modelName: rest.join("."),
    };
  }

  return {
    appName: String(appOption ?? "").trim(),
    modelName: modelInput,
  };
};

const assertExists = async (targetPath) => {
  try {
    await access(targetPath, fsConstants.F_OK);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      throw new Error(`Required path is missing: ${targetPath}`);
    }
    throw error;
  }
};

const readIfExists = async (targetPath) => {
  try {
    return await readFile(targetPath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
};

const pathExists = async (targetPath) => {
  try {
    await access(targetPath, fsConstants.F_OK);
    return true;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findMatchingBracket = (source, openIndex, openChar, closeChar) => {
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    const previous = source[index - 1];

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inSingle) {
      if (char === "'" && previous !== "\\") {
        inSingle = false;
      }
      continue;
    }

    if (inDouble) {
      if (char === '"' && previous !== "\\") {
        inDouble = false;
      }
      continue;
    }

    if (inTemplate) {
      if (char === "`" && previous !== "\\") {
        inTemplate = false;
      }
      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === "'") {
      inSingle = true;
      continue;
    }

    if (char === '"') {
      inDouble = true;
      continue;
    }

    if (char === "`") {
      inTemplate = true;
      continue;
    }

    if (char === openChar) {
      depth += 1;
      continue;
    }

    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
};

const locateArrayByKey = (source, key, fromIndex = 0) => {
  const keyIndex = source.indexOf(key, fromIndex);
  if (keyIndex === -1) {
    return null;
  }

  const openIndex = source.indexOf("[", keyIndex);
  if (openIndex === -1) {
    return null;
  }

  const closeIndex = findMatchingBracket(source, openIndex, "[", "]");
  if (closeIndex === -1) {
    return null;
  }

  return { keyIndex, openIndex, closeIndex };
};

const getTopLevelArrayItemRanges = (source, openIndex, closeIndex) => {
  const ranges = [];
  let itemStart = openIndex + 1;

  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = openIndex + 1; index < closeIndex; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    const previous = source[index - 1];

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inSingle) {
      if (char === "'" && previous !== "\\") {
        inSingle = false;
      }
      continue;
    }

    if (inDouble) {
      if (char === '"' && previous !== "\\") {
        inDouble = false;
      }
      continue;
    }

    if (inTemplate) {
      if (char === "`" && previous !== "\\") {
        inTemplate = false;
      }
      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === "'") {
      inSingle = true;
      continue;
    }

    if (char === '"') {
      inDouble = true;
      continue;
    }

    if (char === "`") {
      inTemplate = true;
      continue;
    }

    if (char === "{") {
      braceDepth += 1;
      continue;
    }

    if (char === "}") {
      if (braceDepth > 0) {
        braceDepth -= 1;
      }
      continue;
    }

    if (char === "[") {
      bracketDepth += 1;
      continue;
    }

    if (char === "]") {
      if (bracketDepth > 0) {
        bracketDepth -= 1;
      }
      continue;
    }

    if (char === "(") {
      parenDepth += 1;
      continue;
    }

    if (char === ")") {
      if (parenDepth > 0) {
        parenDepth -= 1;
      }
      continue;
    }

    if (
      char === "," &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      parenDepth === 0
    ) {
      ranges.push({ start: itemStart, end: index });
      itemStart = index + 1;
    }
  }

  ranges.push({ start: itemStart, end: closeIndex });
  return ranges;
};

const removeItemsByIdsFromArray = (source, key, ids, fromIndex = 0) => {
  const bounds = locateArrayByKey(source, key, fromIndex);
  if (!bounds) {
    return { source, removedCount: 0, bounds: null };
  }

  const ranges = getTopLevelArrayItemRanges(source, bounds.openIndex, bounds.closeIndex);
  const items = ranges
    .map((range) => source.slice(range.start, range.end))
    .map((text) => text.trim())
    .filter(Boolean);

  let removedCount = 0;
  const kept = [];

  for (const item of items) {
    const hasTargetId = ids.some((id) =>
      new RegExp(`\\bid:\\s*["'\`]${escapeRegExp(id)}["'\`]`).test(item),
    );
    if (hasTargetId) {
      removedCount += 1;
      continue;
    }
    kept.push(item);
  }

  if (removedCount === 0) {
    return { source, removedCount: 0, bounds };
  }

  const newArrayBody = kept.length > 0 ? `\n${kept.join(",\n")}\n` : "\n";
  const next =
    source.slice(0, bounds.openIndex + 1) +
    newArrayBody +
    source.slice(bounds.closeIndex);

  return { source: next, removedCount, bounds };
};

const removeRouteConstants = (source, constantKeys) => {
  let next = source;
  const removedKeys = [];

  for (const key of constantKeys) {
    const constantPattern = new RegExp(
      `^\\s*${escapeRegExp(key)}:\\s*["'\`][^"'\`]+["'\`],?\\s*$\\n?`,
      "m",
    );
    if (constantPattern.test(next)) {
      next = next.replace(constantPattern, "");
      removedKeys.push(key);
    }
  }

  return { source: next, removedKeys };
};

const removeLazyComponentBlock = (source, componentName) => {
  const lazyPattern = new RegExp(
    `\\n?const ${escapeRegExp(componentName)} = lazy\\(\\(\\) =>[\\s\\S]*?\\n\\);\\n?`,
    "m",
  );
  if (!lazyPattern.test(source)) {
    return { source, removed: false };
  }
  return {
    source: source.replace(lazyPattern, "\n"),
    removed: true,
  };
};

const removeNavigationEntriesById = (source, ids) => {
  let next = source;
  let removedCount = 0;
  let fromIndex = 0;

  while (true) {
    const removal = removeItemsByIdsFromArray(next, "entries:", ids, fromIndex);
    if (!removal.bounds) {
      break;
    }

    next = removal.source;
    removedCount += removal.removedCount;
    fromIndex = removal.bounds.keyIndex + 1;
  }

  return { source: next, removedCount };
};

const normalizeSpacing = (source) =>
  source
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n");

const run = async () => {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage.trim());
    process.exit(0);
  }

  if (!options.model || !options.project) {
    console.error('Missing required arguments. Use "--model" and "--project".');
    console.log(usage.trim());
    process.exit(1);
  }

  const resolvedModel = resolveModelReference(options.model, options.app);
  const appName = toKebabCase(resolvedModel.appName);
  const modelPascal = toPascalCase(resolvedModel.modelName);
  const projectId = toKebabCase(options.project);
  const modelSlug = toKebabCase(options.slug || resolvedModel.modelName);

  if (!appName) {
    throw new Error(
      'Unable to resolve app name. Pass "--model app.model" or add "--app <app>".',
    );
  }
  if (!modelPascal) {
    throw new Error("Unable to resolve model name from --model.");
  }
  if (!projectId) {
    throw new Error("Invalid --project value.");
  }
  if (!modelSlug) {
    throw new Error("Invalid model slug. Use --slug to override.");
  }

  const keepFiles = Boolean(options["keep-files"]);
  const force = Boolean(options.force);
  const dryRun = Boolean(options["dry-run"]);

  const constantBase = toConstantCase(modelSlug);
  const routeConstants = {
    list: `${constantBase}_LIST`,
    create: `${constantBase}_CREATE`,
    edit: `${constantBase}_EDIT`,
    detail: `${constantBase}_DETAIL`,
  };
  const routeIds = {
    list: `${projectId}:${modelSlug}:list`,
    create: `${projectId}:${modelSlug}:create`,
    edit: `${projectId}:${modelSlug}:edit`,
    detail: `${projectId}:${modelSlug}:detail`,
  };

  const listComponentName = `${modelPascal}ListPage`;
  const formComponentName = `${modelPascal}FormPage`;
  const detailComponentName = `${modelPascal}DetailPage`;

  const root = process.cwd();
  const projectDir = path.join(root, "src", "projects", projectId);
  const routesPath = path.join(projectDir, "config", "routes.ts");
  const manifestPath = path.join(projectDir, "manifest.tsx");
  const modelPagesDir = path.join(projectDir, "pages", modelSlug);
  const generatedPages = [
    path.join(modelPagesDir, `${listComponentName}.tsx`),
    path.join(modelPagesDir, `${formComponentName}.tsx`),
    path.join(modelPagesDir, `${detailComponentName}.tsx`),
  ];

  await assertExists(projectDir);
  await assertExists(routesPath);
  await assertExists(manifestPath);

  const routesSource = await readFile(routesPath, "utf8");
  const manifestSource = await readFile(manifestPath, "utf8");

  const updatedRoutes = removeRouteConstants(routesSource, Object.values(routeConstants));

  let nextManifest = manifestSource;
  const manifestRemovals = {
    lazy: 0,
    routes: 0,
    navigation: 0,
  };

  for (const componentName of [listComponentName, formComponentName, detailComponentName]) {
    const lazyRemoval = removeLazyComponentBlock(nextManifest, componentName);
    nextManifest = lazyRemoval.source;
    if (lazyRemoval.removed) {
      manifestRemovals.lazy += 1;
    }
  }

  const routesRemoval = removeItemsByIdsFromArray(
    nextManifest,
    "routes:",
    Object.values(routeIds),
  );
  nextManifest = routesRemoval.source;
  manifestRemovals.routes = routesRemoval.removedCount;

  const navigationRemoval = removeNavigationEntriesById(nextManifest, [routeIds.list]);
  nextManifest = navigationRemoval.source;
  manifestRemovals.navigation = navigationRemoval.removedCount;

  nextManifest = normalizeSpacing(nextManifest);
  const nextRoutes = normalizeSpacing(updatedRoutes.source);

  const fileWrites = [];
  const fileDeletes = [];

  if (nextRoutes !== routesSource) {
    fileWrites.push({ path: routesPath, content: nextRoutes, action: "update" });
  }

  if (nextManifest !== manifestSource) {
    fileWrites.push({ path: manifestPath, content: nextManifest, action: "update" });
  }

  if (!keepFiles) {
    for (const filePath of generatedPages) {
      const content = await readIfExists(filePath);
      if (content !== null) {
        fileDeletes.push({ path: filePath, action: "delete" });
      }
    }

    const dirExists = await pathExists(modelPagesDir);
    if (dirExists || fileDeletes.length > 0) {
      fileDeletes.push({ path: modelPagesDir, action: "delete-empty-dir" });
    }
  }

  const changedCount =
    fileWrites.length + fileDeletes.filter((item) => item.action !== "delete-empty-dir").length;

  if (changedCount === 0 && !force) {
    throw new Error(
      "No matching registration found for this model/project. Use --force to bypass this check.",
    );
  }

  if (dryRun) {
    console.log("Dry run only. Planned changes:");
    for (const entry of fileWrites) {
      console.log(`- ${entry.action.toUpperCase()}: ${path.relative(root, entry.path)}`);
    }
    for (const entry of fileDeletes) {
      if (entry.action === "delete-empty-dir") {
        console.log(`- DELETE DIR (if empty): ${path.relative(root, entry.path)}`);
        continue;
      }
      console.log(`- DELETE: ${path.relative(root, entry.path)}`);
    }
    return;
  }

  for (const entry of fileWrites) {
    await writeFile(entry.path, entry.content, "utf8");
  }

  for (const entry of fileDeletes) {
    if (entry.action === "delete-empty-dir") {
      try {
        const items = await readdir(entry.path);
        if (items.length === 0) {
          await rmdir(entry.path);
        }
      } catch (error) {
        if (!error || error.code !== "ENOENT") {
          throw error;
        }
      }
      continue;
    }
    await rm(entry.path, { force: true });
  }

  console.log(`Unregistered ${appName}.${modelPascal} from project "${projectId}".`);
  console.log(`Removed route ids: ${Object.values(routeIds).join(", ")}`);
  if (keepFiles) {
    console.log("Generated page files were kept on disk (--keep-files).");
  } else {
    console.log(`Cleaned generated pages under src/projects/${projectId}/pages/${modelSlug}.`);
  }
  console.log("Run `npm run check:manifests` to validate route wiring.");
};

run().catch((error) => {
  console.error(
    `Unregister command failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
