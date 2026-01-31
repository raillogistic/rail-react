import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global suppression of specific console warnings/errors
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args: unknown[]) => {
  const msg = args.map(a => {
    if (typeof a === 'string') return a;
    if (a instanceof Error) return a.message;
    try {
      return JSON.stringify(a);
    } catch {
      return String(a);
    }
  }).join(' ');

  if (
    msg.includes('go.apollo.dev/c/err') ||
    msg.includes('Please remove this option') ||
    msg.includes('addTypename') ||
    msg.includes('canonizeResults') ||
    msg.includes('An error occurred! For more details')
  ) {
    return;
  }
  originalError.apply(console, args);
};

console.warn = (...args: unknown[]) => {
  const msg = args.map(a => {
    if (typeof a === 'string') return a;
    if (a instanceof Error) return a.message;
    try {
      return JSON.stringify(a);
    } catch {
      return String(a);
    }
  }).join(' ');

  if (
    msg.includes('go.apollo.dev/c/err') ||
    msg.includes('Please remove this option') ||
    msg.includes('addTypename') ||
    msg.includes('canonizeResults')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};
