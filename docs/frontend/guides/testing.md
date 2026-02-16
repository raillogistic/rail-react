# Frontend testing guide

This guide explains how you write and run tests for the React frontend with
Vitest and React Testing Library.

## Overview

Use the following tools in the frontend test stack:

- **[Vitest](https://vitest.dev/)** for unit and integration test execution.
- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)**
  for DOM-focused interaction assertions.
- **[jest-dom](https://github.com/testing-library/jest-dom)** for additional
  DOM matchers, such as `toBeInTheDocument`.

## Running tests

Run these commands from `rail-react`:

```bash
# Run tests in watch mode (default)
npm test

# Run tests with UI
npm run test:ui
```

When you change one frontend library, run a focused suite first to reduce
feedback time before running the broader matrix.

```bash
# Run Unit Field formatter tests only
npx vitest run src/lib/details/units/unitFieldFormatters.test.ts
```

## Writing tests

Write tests next to components or in focused test folders based on ownership
and reuse patterns.

### File location

You can co-locate tests with components, for example
`Component.test.tsx`, or place them in `src/test` when they validate shared
test infrastructure.

### Example test

This example shows a simple component render assertion:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders correctly', () => {
    render(<App />);
    const element = screen.getByText(/Hello/i);
    expect(element).toBeInTheDocument();
  });
});
```

## Configuration

Keep test runtime configuration in `vite.config.ts`. The setup file
`src/test/setup.ts` imports `jest-dom` so matchers are available globally.
