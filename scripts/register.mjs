#!/usr/bin/env node

import { constants as fsConstants } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const usage = `
Usage:
  npm run register -- --model <app.model> --project <project> [options]

Required:
  --model <app.model>      Model reference (for example: catalog.article)
  --project <project>      Existing project under src/projects/<project>

Main options:
  --type <pages|inline>    List-page action style (default: pages)
  --title "<label>"        Sidebar/table label (default: inferred)
  --order <number>         Sidebar position (1 = first, default: append)

Additional options:
  --app <app>              App name when --model has no app prefix
  --slug <slug>            Route segment and pages folder (default: inferred)
  --route-base </path>     Base path (default: /<project>/<slug>)
  --icon <LucideIcon>      Icon used in routes/navigation (default: FileText)
  --description "<text>"   Description used for list route and nav entry
  --form-title "<text>"    Label used for create/edit/detail route titles
  --permission <perm>      requiredPermission for generated routes
  --force                  Overwrite generated files and route constants
  --dry-run                Print planned changes without writing files
  --help, -h               Show this help

Examples:
  npm run register -- --model catalog.article --project catalog
  npm run register -- --model operations.restitution --project operations --type inline
  npm run register -- --model article --app catalog --project catalog --title "Articles"
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

const parsePositiveIntegerOption = (value, flagName) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`Invalid ${flagName} value "${value}". Use an integer >= 1.`);
  }

  return number;
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

const toTitleCase = (value) => splitWords(value).map(capitalizeWord).join(" ");

const normalizeRouteBase = (value) => {
  const cleaned = String(value ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "");
  return cleaned ? `/${cleaned}` : "";
};

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
    throw new Error(`Could not locate "${key}" in project manifest.`);
  }

  const openIndex = source.indexOf("[", keyIndex);
  if (openIndex === -1) {
    throw new Error(`Could not locate array start for "${key}".`);
  }

  const closeIndex = findMatchingBracket(source, openIndex, "[", "]");
  if (closeIndex === -1) {
    throw new Error(`Could not locate array end for "${key}".`);
  }

  return { keyIndex, openIndex, closeIndex };
};

const listTopLevelObjectStarts = (source, arrayOpenIndex, arrayCloseIndex) => {
  const starts = [];
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = arrayOpenIndex + 1; index < arrayCloseIndex; index += 1) {
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

    if (char === "[" && braceDepth === 0) {
      bracketDepth += 1;
      continue;
    }

    if (char === "]" && braceDepth === 0 && bracketDepth > 0) {
      bracketDepth -= 1;
      continue;
    }

    if (char === "(" && braceDepth === 0) {
      parenDepth += 1;
      continue;
    }

    if (char === ")" && braceDepth === 0 && parenDepth > 0) {
      parenDepth -= 1;
      continue;
    }

    if (char === "{" && bracketDepth === 0 && parenDepth === 0) {
      if (braceDepth === 0) {
        starts.push(index);
      }
      braceDepth += 1;
      continue;
    }

    if (char === "}" && bracketDepth === 0 && parenDepth === 0 && braceDepth > 0) {
      braceDepth -= 1;
    }
  }

  return starts;
};

const insertBeforeIndex = (source, index, block) => {
  const before = source.slice(0, index);
  const after = source.slice(index);
  const leadingBreak = before.endsWith("\n") ? "" : "\n";
  return `${before}${leadingBreak}${block}\n${after}`;
};

const ensureNamedImport = (source, modulePath, symbolName) => {
  const importRegex = new RegExp(
    `import\\s*{([\\s\\S]*?)}\\s*from\\s*"${escapeRegExp(modulePath)}";`,
  );
  const match = source.match(importRegex);
  if (!match) {
    throw new Error(`Could not find import from "${modulePath}".`);
  }

  const names = match[1]
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (names.includes(symbolName)) {
    return { source, changed: false };
  }

  const updatedNames = [...names, symbolName];
  const multiline = match[0].includes("\n");
  const replacement = multiline
    ? `import {\n  ${updatedNames.join(",\n  ")},\n} from "${modulePath}";`
    : `import { ${updatedNames.join(", ")} } from "${modulePath}";`;

  return {
    source: source.replace(match[0], replacement),
    changed: true,
  };
};

const ensureLucideIconImport = (source, iconName) => {
  const match = source.match(/import\s*{([\s\S]*?)}\s*from\s*"lucide-react";/);

  if (!match) {
    const reactImportMatch = source.match(/import [^\n]+ from "react";\n/);
    if (!reactImportMatch) {
      throw new Error('Could not place import for "lucide-react".');
    }
    const insertionPoint = reactImportMatch.index + reactImportMatch[0].length;
    return {
      source: `${source.slice(0, insertionPoint)}import { ${iconName} } from "lucide-react";\n${source.slice(insertionPoint)}`,
      changed: true,
    };
  }

  const names = match[1]
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (names.includes(iconName)) {
    return { source, changed: false };
  }

  const updatedNames = [...names, iconName];
  const multiline = match[0].includes("\n");
  const replacement = multiline
    ? `import {\n  ${updatedNames.join(",\n  ")},\n} from "lucide-react";`
    : `import { ${updatedNames.join(", ")} } from "lucide-react";`;

  return {
    source: source.replace(match[0], replacement),
    changed: true,
  };
};

const upsertRouteConstants = (source, routeEntries, force) => {
  let next = source;
  const added = [];
  const replaced = [];
  const unchanged = [];

  for (const [key, value] of routeEntries) {
    const keyPattern = new RegExp(
      `^\\s*${escapeRegExp(key)}:\\s*["'\`]([^"'\`]+)["'\`],?\\s*$`,
      "m",
    );
    const existing = next.match(keyPattern);

    if (existing) {
      const existingValue = existing[1];
      if (existingValue === value) {
        unchanged.push(key);
        continue;
      }
      if (!force) {
        throw new Error(
          `ROUTES.${key} already exists with a different path (${existingValue}). Use --force to replace it.`,
        );
      }
      next = next.replace(keyPattern, `  ${key}: "${value}",`);
      replaced.push(key);
      continue;
    }

    added.push(key);
  }

  if (added.length > 0) {
    const insertionIndex = next.lastIndexOf("} as const;");
    if (insertionIndex === -1) {
      throw new Error('Could not locate "} as const;" in routes config.');
    }
    const addedLines = added
      .map((key) => `  ${key}: "${routeEntries.get(key)}",`)
      .join("\n");
    next = `${next.slice(0, insertionIndex)}${addedLines}\n${next.slice(insertionIndex)}`;
  }

  return { source: next, added, replaced, unchanged };
};

const quote = (value) => String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const buildListPageContent = ({
  listComponentName,
  projectId,
  appName,
  modelName,
  listType,
  listTitle,
  routeConstants,
}) => {
  if (listType === "inline") {
    return `import { DynamicModelTable } from "@/widgets/model-table";

export function ${listComponentName}() {
  return (
    <DynamicModelTable
      app="${quote(appName)}"
      model="${quote(modelName)}"
      create={{ type: "drawer" }}
      update={{ type: "drawer" }}
      detail={{ type: "modal" }}
      baseTable={{
        tableConfig: {
          title: "${quote(listTitle)}",
        },
      }}
    />
  );
}

export default ${listComponentName};
`;
  }

  return `import { ROUTES } from "@/projects/${quote(projectId)}/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

export function ${listComponentName}() {
  return (
    <DynamicModelTable
      app="${quote(appName)}"
      model="${quote(modelName)}"
      create={{
        type: "link",
        hrefTemplate: ROUTES.${routeConstants.create},
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.${routeConstants.edit},
      }}
      detail={{
        type: "link",
        hrefTemplate: ROUTES.${routeConstants.detail},
      }}
      baseTable={{
        tableConfig: {
          title: "${quote(listTitle)}",
        },
      }}
    />
  );
}

export default ${listComponentName};
`;
};

const buildFormPageContent = ({
  formComponentName,
  appName,
  modelName,
  formTitle,
}) => `import { useParams } from "react-router-dom";
import { ModelForm } from "@/widgets/model-form";

export function ${formComponentName}() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isUpdate ? "Edit ${quote(formTitle)}" : "Create ${quote(formTitle)}"}
        </h1>
      </header>
      <ModelForm
        app="${quote(appName)}"
        model="${quote(modelName)}"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
      />
    </section>
  );
}

export default ${formComponentName};
`;

const buildDetailPageContent = ({
  detailComponentName,
  appName,
  modelName,
}) => `import { useParams } from "react-router-dom";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function ${detailComponentName}() {
  const { id = "" } = useParams();
  return <ModelDynamicDetail app="${quote(appName)}" model="${quote(modelName)}" id={id} />;
}

export default ${detailComponentName};
`;

const buildLazyBlock = ({
  modelSlug,
  listComponentName,
  formComponentName,
  detailComponentName,
}) => [
  `const ${listComponentName} = lazy(() =>`,
  `  import("./pages/${modelSlug}/${listComponentName}").then((module) => ({`,
  `    default: module.${listComponentName},`,
  `  })),`,
  `);`,
  "",
  `const ${formComponentName} = lazy(() =>`,
  `  import("./pages/${modelSlug}/${formComponentName}").then((module) => ({`,
  `    default: module.${formComponentName},`,
  `  })),`,
  `);`,
  "",
  `const ${detailComponentName} = lazy(() =>`,
  `  import("./pages/${modelSlug}/${detailComponentName}").then((module) => ({`,
  `    default: module.${detailComponentName},`,
  `  })),`,
  `);`,
  "",
].join("\n");

const buildRoutesBlock = ({
  projectId,
  routeIds,
  routeConstants,
  listTitle,
  formTitle,
  description,
  iconName,
  listComponentName,
  formComponentName,
  detailComponentName,
  permission,
}) => {
  const permissionLine = permission
    ? `      requiredPermission: "${quote(permission)}",\n`
    : "";

  return [
    `    protectedRoute("${quote(projectId)}", {`,
    `      id: "${quote(routeIds.list)}",`,
    `      path: ROUTES.${routeConstants.list},`,
    `      title: "${quote(listTitle)}",`,
    `      description: "${quote(description)}",`,
    permissionLine ? permissionLine.trimEnd() : null,
    `      icon: ${iconName},`,
    `      element: withRouteSuspense(<${listComponentName} />),`,
    `    }),`,
    "",
    `    protectedRoute("${quote(projectId)}", {`,
    `      id: "${quote(routeIds.create)}",`,
    `      path: ROUTES.${routeConstants.create},`,
    `      title: "Create ${quote(formTitle)}",`,
    `      hidden: true,`,
    permissionLine ? permissionLine.trimEnd() : null,
    `      icon: ${iconName},`,
    `      element: withRouteSuspense(<${formComponentName} />),`,
    `    }),`,
    "",
    `    protectedRoute("${quote(projectId)}", {`,
    `      id: "${quote(routeIds.edit)}",`,
    `      path: ROUTES.${routeConstants.edit},`,
    `      title: "Edit ${quote(formTitle)}",`,
    `      hidden: true,`,
    permissionLine ? permissionLine.trimEnd() : null,
    `      icon: ${iconName},`,
    `      element: withRouteSuspense(<${formComponentName} />),`,
    `    }),`,
    "",
    `    protectedRoute("${quote(projectId)}", {`,
    `      id: "${quote(routeIds.detail)}",`,
    `      path: ROUTES.${routeConstants.detail},`,
    `      title: "${quote(formTitle)} details",`,
    `      hidden: true,`,
    permissionLine ? permissionLine.trimEnd() : null,
    `      icon: ${iconName},`,
    `      element: withRouteSuspense(<${detailComponentName} />),`,
    `    }),`,
  ]
    .filter(Boolean)
    .join("\n");
};

const buildNavigationEntryBlock = ({
  routeIds,
  routeConstants,
  listTitle,
  formTitle,
  description,
  iconName,
}) =>
  [
    "        {",
    `          id: "${quote(routeIds.list)}",`,
    `          routeId: "${quote(routeIds.list)}",`,
    `          title: "${quote(listTitle)}",`,
    `          path: ROUTES.${routeConstants.list},`,
    '          guard: "protected",',
    `          icon: ${iconName},`,
    `          description: "${quote(description)}",`,
    "          children: [",
    "            {",
    `              id: "${quote(routeIds.create)}",`,
    `              routeId: "${quote(routeIds.create)}",`,
    `              title: "Create ${quote(formTitle)}",`,
    `              path: ROUTES.${routeConstants.create},`,
    '              guard: "protected",',
    "              hidden: true,",
    "            },",
    "            {",
    `              id: "${quote(routeIds.edit)}",`,
    `              routeId: "${quote(routeIds.edit)}",`,
    `              title: "Edit ${quote(formTitle)}",`,
    `              path: ROUTES.${routeConstants.edit},`,
    '              guard: "protected",',
    "              hidden: true,",
    "            },",
    "            {",
    `              id: "${quote(routeIds.detail)}",`,
    `              routeId: "${quote(routeIds.detail)}",`,
    `              title: "${quote(formTitle)} details",`,
    `              path: ROUTES.${routeConstants.detail},`,
    '              guard: "protected",',
    "              hidden: true,",
    "            },",
    "          ],",
    "        },",
  ].join("\n");

const updateManifestSource = (source, config) => {
  let next = source;
  const result = {
    addedProtectedRouteImport: false,
    addedIconImport: false,
    insertedLazy: false,
    insertedRoutes: false,
    insertedNavigation: false,
  };

  if (next.includes(`id: "${config.routeIds.list}"`)) {
    throw new Error(
      `Route id "${config.routeIds.list}" already exists in manifest. Pick another model/slug.`,
    );
  }

  if (next.includes(`const ${config.listComponentName} = lazy(() =>`)) {
    throw new Error(
      `Component "${config.listComponentName}" already exists in manifest. Pick another model/slug.`,
    );
  }

  const protectedRouteImport = ensureNamedImport(
    next,
    "@/app/router/manifestFactory",
    "protectedRoute",
  );
  next = protectedRouteImport.source;
  result.addedProtectedRouteImport = protectedRouteImport.changed;

  const iconImport = ensureLucideIconImport(next, config.iconName);
  next = iconImport.source;
  result.addedIconImport = iconImport.changed;

  const exportIndex = next.indexOf("export const ");
  if (exportIndex === -1) {
    throw new Error("Could not locate manifest export declaration.");
  }
  next = `${next.slice(0, exportIndex)}${buildLazyBlock(config)}${next.slice(exportIndex)}`;
  result.insertedLazy = true;

  const routesBounds = locateArrayByKey(next, "routes:");
  next = insertBeforeIndex(next, routesBounds.closeIndex, buildRoutesBlock(config));
  result.insertedRoutes = true;

  const navigationBounds = locateArrayByKey(next, "navigation:");
  const entriesBounds = locateArrayByKey(next, "entries:", navigationBounds.openIndex);
  let navigationInsertIndex = entriesBounds.closeIndex;

  if (config.navigationOrder !== null) {
    const existingEntryStarts = listTopLevelObjectStarts(
      next,
      entriesBounds.openIndex,
      entriesBounds.closeIndex,
    );
    const requestedIndex = Math.max(0, config.navigationOrder - 1);
    if (requestedIndex < existingEntryStarts.length) {
      navigationInsertIndex = existingEntryStarts[requestedIndex];
    }
  }

  next = insertBeforeIndex(
    next,
    navigationInsertIndex,
    buildNavigationEntryBlock(config),
  );
  result.insertedNavigation = true;

  return { source: next, result };
};

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

  const type = String(options.type ?? "pages")
    .trim()
    .toLowerCase();
  if (type !== "pages" && type !== "inline") {
    throw new Error(`Invalid value for --type: "${type}". Use "pages" or "inline".`);
  }

  const resolvedModel = resolveModelReference(options.model, options.app);
  const appName = toKebabCase(resolvedModel.appName);
  const modelPascal = toPascalCase(resolvedModel.modelName);
  const projectId = toKebabCase(options.project);
  const modelSlug = toKebabCase(options.slug || resolvedModel.modelName);
  const iconName = String(options.icon ?? "FileText").trim();

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
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(iconName)) {
    throw new Error(`Invalid icon name "${iconName}". Use a Lucide export like "FileText".`);
  }

  const routeBase =
    normalizeRouteBase(options["route-base"]) || `/${projectId}/${modelSlug}`;
  const listTitle = String(options.title ?? toTitleCase(resolvedModel.modelName)).trim();
  const formTitle = String(options["form-title"] ?? toTitleCase(resolvedModel.modelName)).trim();
  const description = String(
    options.description ?? `Manage ${toTitleCase(resolvedModel.modelName)} records`,
  ).trim();
  const permission = options.permission ? String(options.permission).trim() : "";
  const navigationOrder = parsePositiveIntegerOption(options.order, "--order");
  const force = Boolean(options.force);
  const dryRun = Boolean(options["dry-run"]);

  const constantBase = toConstantCase(modelSlug);
  const routeConstants = {
    list: `${constantBase}_LIST`,
    create: `${constantBase}_CREATE`,
    edit: `${constantBase}_EDIT`,
    detail: `${constantBase}_DETAIL`,
  };
  const routeValues = new Map([
    [routeConstants.list, routeBase],
    [routeConstants.create, `${routeBase}/create`],
    [routeConstants.edit, `${routeBase}/:id/edit`],
    [routeConstants.detail, `${routeBase}/:id`],
  ]);
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

  await assertExists(projectDir);
  await assertExists(routesPath);
  await assertExists(manifestPath);

  const routesSource = await readFile(routesPath, "utf8");
  const manifestSource = await readFile(manifestPath, "utf8");

  const updatedRoutes = upsertRouteConstants(routesSource, routeValues, force);
  const updatedManifest = updateManifestSource(manifestSource, {
    projectId,
    modelSlug,
    routeIds,
    routeConstants,
    listTitle,
    formTitle,
    description,
    iconName,
    permission,
    navigationOrder,
    listComponentName,
    formComponentName,
    detailComponentName,
  });

  const generatedPages = [
    {
      path: path.join(modelPagesDir, `${listComponentName}.tsx`),
      content: buildListPageContent({
        listComponentName,
        projectId,
        appName,
        modelName: modelPascal,
        listType: type,
        listTitle,
        routeConstants,
      }),
    },
    {
      path: path.join(modelPagesDir, `${formComponentName}.tsx`),
      content: buildFormPageContent({
        formComponentName,
        appName,
        modelName: modelPascal,
        formTitle,
      }),
    },
    {
      path: path.join(modelPagesDir, `${detailComponentName}.tsx`),
      content: buildDetailPageContent({
        detailComponentName,
        appName,
        modelName: modelPascal,
      }),
    },
  ];

  const fileWrites = [];

  if (updatedRoutes.source !== routesSource) {
    fileWrites.push({ path: routesPath, content: updatedRoutes.source, action: "update" });
  }

  if (updatedManifest.source !== manifestSource) {
    fileWrites.push({ path: manifestPath, content: updatedManifest.source, action: "update" });
  }

  for (const pageFile of generatedPages) {
    const current = await readIfExists(pageFile.path);
    if (current === null) {
      fileWrites.push({ ...pageFile, action: "create" });
      continue;
    }
    if (current === pageFile.content) {
      continue;
    }
    if (!force) {
      throw new Error(
        `File already exists with different content: ${pageFile.path}. Use --force to overwrite.`,
      );
    }
    fileWrites.push({ ...pageFile, action: "overwrite" });
  }

  if (fileWrites.length === 0) {
    console.log("No changes required.");
    return;
  }

  if (dryRun) {
    console.log("Dry run only. Planned changes:");
    for (const entry of fileWrites) {
      console.log(`- ${entry.action.toUpperCase()}: ${path.relative(root, entry.path)}`);
    }
    return;
  }

  await mkdir(modelPagesDir, { recursive: true });

  for (const entry of fileWrites) {
    await writeFile(entry.path, entry.content, "utf8");
  }

  console.log(`Registered ${appName}.${modelPascal} in project "${projectId}".`);
  console.log(`Generated pages under src/projects/${projectId}/pages/${modelSlug}.`);
  console.log("Run `npm run check:manifests` to validate route wiring.");
};

run().catch((error) => {
  console.error(
    `Register command failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
