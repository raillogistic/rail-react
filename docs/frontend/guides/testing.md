# Frontend Testing Guide

This guide covers how to write and run tests for the React frontend application using **Vitest** and **React Testing Library**.

## Overview

We use the following tools for testing:
- **[Vitest](https://vitest.dev/)**: A blazing fast unit test framework powered by Vite.
- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)**: Simple and complete testing utilities that encourage good testing practices.
- **[jest-dom](https://github.com/testing-library/jest-dom)**: Custom matchers for asserting on DOM nodes (e.g., `toBeInTheDocument`).

## Running Tests

To run the tests, use the following commands:

```bash
# Run tests in watch mode (default)
npm test

# Run tests with UI
npm run test:ui
```

## Writing Tests

### File Location
Tests can be co-located with components (e.g., `Component.test.tsx`) or placed in a dedicated `src/test` directory. We currently have a sample test in `src/test/sample.test.tsx`.

### Example Test

Here is an example of a simple component test:

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

The testing configuration is located in `vite.config.ts`. The setup file `src/test/setup.ts` imports `jest-dom` extensions to ensure matchers are available globally.
