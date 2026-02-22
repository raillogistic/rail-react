import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
const gitCmd = process.platform === "win32" ? "git.exe" : "git";
const nodeCmd = process.execPath;
const eslintCli = new URL(
  "../node_modules/eslint/bin/eslint.js",
  import.meta.url,
);
const eslintCliPath = fileURLToPath(eslintCli);

const readLines = (value) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const runGit = (args) => {
  try {
    return execFileSync(gitCmd, args, { encoding: "utf8" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown git execution error.";
    console.error(`Failed to run git ${args.join(" ")}: ${message}`);
    process.exit(1);
  }
};

const tracked = readLines(
  runGit(["diff", "--name-only", "--diff-filter=ACMRTUXB", "HEAD"]),
);
const untracked = readLines(
  runGit(["ls-files", "--others", "--exclude-standard"]),
);

const lintableExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

const lintableFiles = [...new Set([...tracked, ...untracked])]
  .filter((filePath) => {
    const extension = filePath.slice(filePath.lastIndexOf("."));
    return lintableExtensions.has(extension);
  })
  .filter((filePath) => fs.existsSync(filePath));

if (lintableFiles.length === 0) {
  console.log("No changed JS/TS files to lint.");
  process.exit(0);
}

console.log(`Linting ${lintableFiles.length} changed file(s).`);
const result = spawnSync(nodeCmd, [eslintCliPath, ...lintableFiles], {
  stdio: "inherit",
});

if (result.error) {
  const message =
    result.error instanceof Error
      ? result.error.message
      : "Unknown lint execution error.";
  console.error(`Failed to run eslint: ${message}`);
  process.exit(1);
}

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
