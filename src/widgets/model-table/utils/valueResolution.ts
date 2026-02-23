export function resolveValueOptimized(row: Record<string, unknown>, path: string[]): unknown {
  let current: any = row;
  for (let i = 0; i < path.length; i++) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[path[i]];
  }
  return current;
}

export function buildAccessorPath(accessor: string): string[] {
  return accessor.split(".").filter(Boolean);
}
