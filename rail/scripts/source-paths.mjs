/** Resolve existing source aliases consistently in standalone and subtree applications. */
import fs from 'node:fs';
import path from 'node:path';

export const projectRoot = process.cwd();
export const sharedRoot = fs.existsSync(path.join(projectRoot, 'rail/package.json')) ? path.join(projectRoot, 'rail') : projectRoot;
export const sourceRoots = [...new Set([path.join(projectRoot, 'src'), path.join(sharedRoot, 'src')])];

/** Find which architecture source tree owns a file. */
export function sourceRootFor(file) {
  return sourceRoots.find(root => file.startsWith(`${root}${path.sep}`)) ?? sourceRoots[0];
}

/** Preserve public aliases while resolving generic code into the shared foundation. */
export function resolveSourceImport(specifier, importer) {
  if (specifier.startsWith('.')) return path.resolve(path.dirname(importer), specifier);
  if (!specifier.startsWith('@/')) return null;
  const relative = specifier.slice(2);
  const generic = /^(app|entities|features|shared|widgets)(\/|$)/.test(relative)
    || relative.startsWith('projects/core/') || relative === 'test/typingModels';
  return path.join(generic ? sharedRoot : projectRoot, 'src', relative);
}
