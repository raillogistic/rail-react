import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Recharts and some UI primitives rely on ResizeObserver in jsdom tests.
globalThis.ResizeObserver ??= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Global mock for lucide-react to avoid missing icon exports
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return new Proxy(actual, {
    get: (target, prop: string) => {
      if (prop in target) return target[prop];
      if (typeof prop === 'string' && /^[A-Z]/.test(prop)) {
        return ({ className, ...props }: any) =>
          React.createElement('span', {
            'data-testid': `icon-${prop}`,
            className,
            ...props,
          });
      }
      return target[prop];
    },
  });
});

// Mock hooks that use Apollo to avoid "no ApolloClient found" in basic component tests
vi.mock('@/shared/api/graphql/graphql/mutations/hooks/useModelBulkDeleteMutation', () => ({
  useModelBulkDeleteMutation: () => ({
    mutate: vi.fn(),
    loading: false,
    error: null,
  }),
}));

// Global suppression of specific console warnings/errors
const originalError = console.error;
const originalWarn = console.warn;
const sensitivePatterns: Array<[RegExp, string]> = [
  [/(password\s*[=:]\s*)([^\s,;]+)/gi, '$1[REDACTED]'],
  [/(token\s*[=:]\s*)([^\s,;]+)/gi, '$1[REDACTED]'],
  [/(authorization\s*[=:]\s*)([^\s,;]+)/gi, '$1[REDACTED]'],
];

export const maskSensitiveTestLog = (message: string): string => {
  let masked = message;
  for (const [pattern, replacement] of sensitivePatterns) {
    masked = masked.replace(pattern, replacement);
  }
  return masked;
};

const buildLogMessage = (args: unknown[]): string =>
  maskSensitiveTestLog(
    args
      .map(a => {
        if (typeof a === 'string') return a;
        if (a instanceof Error) return a.message;
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      })
      .join(' ')
  );

console.error = (...args: unknown[]) => {
  const msg = buildLogMessage(args);

  if (
    msg.includes('go.apollo.dev/c/err') ||
    msg.includes('Please remove this option') ||
    msg.includes('addTypename') ||
    msg.includes('canonizeResults') ||
    msg.includes('An error occurred! For more details')
  ) {
    return;
  }
  originalError.call(console, msg);
};

console.warn = (...args: unknown[]) => {
  const msg = buildLogMessage(args);

  if (
    msg.includes('go.apollo.dev/c/err') ||
    msg.includes('Please remove this option') ||
    msg.includes('addTypename') ||
    msg.includes('canonizeResults')
  ) {
    return;
  }
  originalWarn.call(console, msg);
};
