import '@testing-library/jest-dom';
import { vi } from 'vitest';

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
