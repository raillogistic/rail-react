import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const gitCmd = process.platform === "win32" ? "git.exe" : "git";
const args = new Set(process.argv.slice(2));
const runFullScan = args.has("--full");

const includeRoots = ["src", "docs", "scripts"];
const allowedExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".md",
  ".json",
]);
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
]);
const ignoredRelativePaths = new Set(["scripts/check-mojibake.mjs"]);

const suspiciousFragments = [
  "\u00C3",
  "\u00C2",
  "\u00E2\u20AC\u2122",
  "\u00E2\u20AC\u0153",
  "\u00E2\u20AC",
  "\u00E2\u20AC\u201C",
  "\u00E2\u20AC\u201D",
  "\u00E2\u20AC\u00A2",
  "\u00E2\u2020",
  "\u00E2\u0152",
  "\uFFFD",
];

const readLines = (value) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const hasAllowedExtension = (filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  return allowedExtensions.has(extension);
};

const toRelative = (filePath) =>
  path.relative(repoRoot, filePath).replace(/\\/g, "/");

const runGit = (gitArgs) => {
  try {
    return execFileSync(gitCmd, gitArgs, { encoding: "utf8" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown git execution error.";
    console.error(`Failed to run git ${gitArgs.join(" ")}: ${message}`);
    process.exit(1);
  }
};

const listFiles = (directory) => {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const stack = [directory];
  const output = [];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (ignoredDirectories.has(entry.name)) {
          continue;
        }
        stack.push(fullPath);
        continue;
      }

      if (hasAllowedExtension(entry.name)) {
        output.push(fullPath);
      }
    }
  }

  return output;
};

const getChangedFiles = () => {
  const tracked = readLines(
    runGit(["diff", "--name-only", "--diff-filter=ACMRTUXB", "HEAD"]),
  );
  const untracked = readLines(
    runGit(["ls-files", "--others", "--exclude-standard"]),
  );

  return [...new Set([...tracked, ...untracked])]
    .map((filePath) => path.resolve(repoRoot, filePath))
    .filter((filePath) => fs.existsSync(filePath))
    .filter(hasAllowedExtension);
};

const getCandidateFiles = () => {
  if (runFullScan) {
    return includeRoots.flatMap((relativeRoot) =>
      listFiles(path.join(repoRoot, relativeRoot)),
    );
  }

  return getChangedFiles();
};

const hasSuspiciousEncoding = (line) =>
  suspiciousFragments.some((fragment) => line.includes(fragment));

const files = getCandidateFiles().filter((filePath) => {
  const relativePath = toRelative(filePath);
  return !ignoredRelativePaths.has(relativePath);
});

if (files.length === 0) {
  const mode = runFullScan ? "full scan" : "changed-files scan";
  console.log(`Encoding check skipped (${mode}, no matching files).`);
  process.exit(0);
}

const violations = [];
for (const filePath of files) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!hasSuspiciousEncoding(line)) {
      return;
    }
    violations.push({
      filePath: toRelative(filePath),
      lineNumber: index + 1,
      excerpt: line.trim().slice(0, 120),
    });
  });
}

if (violations.length === 0) {
  const mode = runFullScan ? "full scan" : "changed-files scan";
  console.log(`Encoding check passed (${mode}, ${files.length} file(s) scanned).`);
  process.exit(0);
}

console.error(
  `Encoding check failed: ${violations.length} suspicious line(s) found.`,
);
for (const violation of violations.slice(0, 200)) {
  console.error(
    `- ${violation.filePath}:${violation.lineNumber} ${violation.excerpt}`,
  );
}
if (violations.length > 200) {
  console.error(
    `... ${violations.length - 200} additional suspicious line(s) omitted.`,
  );
}
if (!runFullScan) {
  console.error("Tip: run with --full to scan the entire repository.");
}
process.exit(1);
