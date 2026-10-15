/** Compose the shared Vite setup with this application's source and configuration. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import shared from './rail/vite.config';

const root = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  ...shared,
  resolve: {
    ...shared.resolve,
    alias: [
      { find: '@rail/application', replacement: path.join(root, 'rail/src/application.ts') },
      { find: /^@\/(app|entities|features|shared|widgets)(\/|$)/, replacement: path.join(root, 'rail/src/$1$2') },
      { find: '@/projects/core', replacement: path.join(root, 'rail/src/projects/core') },
      { find: '@/test/typingModels', replacement: path.join(root, 'rail/src/test/typingModels') },
      { find: '@', replacement: path.join(root, 'src') },
      { find: 'react', replacement: path.join(root, 'node_modules/react') },
      { find: 'react-dom', replacement: path.join(root, 'node_modules/react-dom') },
    ],
  },
  test: {
    ...shared.test,
    setupFiles: [path.join(root, 'rail/src/test/setup.ts'), path.join(root, 'rail/src/widgets/model-table/filtering/__tests__/setup/setup.ts')],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'rail/src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/templates/**', 'rail/src/test/integration/**'],
  },
});
