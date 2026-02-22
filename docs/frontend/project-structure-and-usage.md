# Frontend project structure and usage

This guide explains how the `rail-react` frontend is organized, how the app
boots, and how to add routes and modules without breaking architecture checks.
It also includes the command flow for day-to-day edits and full refactor
validation.

## Quick start

Use this flow when you set up the project on a new machine or start work in an
existing clone.

1. Install dependencies from the repository root.

```bash
npm install
```

2. Start the local development server.

```bash
npm run dev
```

3. Open the URL printed by Vite (usually `http://localhost:5173`).
4. Run the default pre-pull-request validation set.

```bash
npm run check:encoding
npm run check:architecture
npm run lint
npm run test
```

## Validation command sets

Use the fast set for normal commits and the full set before large merge points.

### Changed-files validation (default)

This set is optimized for local iteration and runs quickly on modified files.

```bash
npm run check:encoding
npm run check:architecture
npm run lint
npm run test
```

- `lint` and `lint:changed` run ESLint only on changed JS and TS files.
- `test` runs the unit suite (`test:unit`).

### Full-repository validation (refactor and release)

This set gives broader coverage before major refactors or release branches.

```bash
npm run check:encoding -- --full
npm run check:architecture:full
npm run lint:full
npm run test:all
```

- `check:architecture:full` runs `check:layers:full` and `check:manifests`.
- `check:layers:full` scans the whole `src/` tree with
  `scripts/layer-migration-map.json` mappings and path overrides.
- `check:layers:full` is report mode by default. Use strict mode to fail on
  mapped layer violations:

```bash
node scripts/check-layer-imports-full.mjs --strict
```

## Repository structure

The repository combines frontend source, validation scripts, static assets, and
documentation.

- `src/`: frontend runtime code.
- `docs/`: project documentation.
- `scripts/`: maintenance and validation scripts.
- `public/`: static files served by Vite.
- `package.json`: dependency and script definitions.
- `vite.config.ts`: Vite build, aliases, and Vitest configuration.

## Source architecture under `src/`

The app uses manifest-driven routing with explicit architectural boundaries.
Place new code in the canonical folders below.

- `src/app/`: bootstrap, router, and authenticated shell composition.
- `src/projects/`: project manifests that declare routes and navigation.
- `src/pages/`: route-level page entry points, including `src/pages/auth/*`.
- `src/features/`: domain logic and feature API surfaces.
- `src/shared/`: cross-feature infrastructure and shared contracts.
- `src/lib/`: reusable UI and page-capable library modules.
- `src/apps/`: local-only manifest extension entry points.

Use `src/auth/*` as the auth runtime domain (providers, hooks, services), not
as a place for new route wrapper exports.

## Runtime boot flow

The boot process is stable and follows a fixed provider and composition order.

1. `src/main.tsx` renders `App`.
2. `src/App.tsx` wires `ApolloProvider`, `BrowserRouter`,
   `ConnectedAuthProvider`, and `AuthDependentContent`.
3. `src/app/bootstrap/AuthDependentContent.tsx` applies theme settings and
   mounts `RouteBuilder`.
4. `src/app/router/RouteBuilder.tsx` renders public auth routes and then the
   protected shell route.
5. `src/app/shell/MainApp.tsx` renders the sidebar, navbar, and page content.
6. `src/app/shell/AppContent.tsx` resolves page components from
   `src/app/router/navigation.ts`.

## Routing and navigation model

Routing and navigation are generated from project manifests and shared
navigation contracts.

- Route contracts are in `src/app/router/contracts.ts`.
- Manifest registry is in `src/app/router/manifestRegistry.ts`.
- Manifest validation is in `src/app/router/manifestValidation.ts`.
- Router navigation mapping is in `src/app/router/navigation.ts`.
- Shared navigation interfaces are in `src/shared/routing/navigation.ts`.
- Shared route constants are in `src/shared/routing/paths.ts`.
- The core manifest lives in `src/projects/core/manifest.tsx`.
- The loader resolves manifests with
  `import.meta.glob("@/projects/*/manifest.ts", { eager: true })`.

Each project manifest must expose:

- `projectId`
- `defaultRoute`
- `routes`
- `navigation`

### Local-only project extension

You can add local routes without committing them by creating
`src/apps/routes.local.ts`, which Git ignores.

The adapter in `src/app/router/localManifestExtension.ts` accepts:

- `APP_MANIFEST` or `APP_MANIFEST_EXTENSION`
- legacy-style `APP_NAVIGATION_LINKS` and `APP_DEFAULT_ROUTE`

## Add a new project manifest

Create a new folder under `src/projects/` and export a typed manifest.

1. Create `src/projects/<project-id>/manifest.tsx`.
2. Export a manifest object typed as `AppManifest`.
3. Create `src/projects/<project-id>/manifest.ts` that re-exports the default
   export from `manifest.tsx`.
4. Run architecture checks.

Use this minimal template.

```tsx
import type { AppManifest } from "@/app/router/contracts";

export const PROJECT_MANIFEST: AppManifest = {
  projectId: "billing",
  defaultRoute: "/billing",
  routes: [
    {
      id: "billing:home",
      path: "/billing",
      guard: "protected",
      projectId: "billing",
      title: "Billing",
      element: <div>Billing</div>,
    },
  ],
  navigation: [
    {
      id: "billing-main",
      label: "Billing",
      projectId: "billing",
      entries: [
        {
          id: "billing:home",
          routeId: "billing:home",
          title: "Billing",
          path: "/billing",
          guard: "protected",
        },
      ],
    },
  ],
};

export default PROJECT_MANIFEST;
```

## Add a page to an existing project

Use this workflow when you add a screen to `core` or another existing project.

1. Create the route entry component in `src/pages/*` or `src/lib/*/pages/*`.
2. Import it in the owning manifest, usually with `lazy()` and `Suspense`.
3. Add a route entry with a unique `id` and `path`.
4. Add a navigation entry that references the route with `routeId`.
5. Run validation (`check:architecture`, `lint`, and tests).

Import canonical modules directly. For example, use
`@/lib/import/pages/ModelImportPage` instead of creating compatibility wrapper
re-exports under legacy paths such as `src/auth/*` and `src/features/import/*`.

## API boundary usage

Keep new API integration code inside the shared and feature API boundaries.

- Use `src/shared/api/apollo/client.ts` for the runtime Apollo client.
- Use `src/shared/api/graphql/index.ts` for shared GraphQL exports.
- Use `src/features/auth/api/index.ts` for auth operations consumed by auth
  services and providers.

Legacy GraphQL modules still exist under `src/graphql/*`. Prefer
`src/shared/api/*` and feature-local API surfaces for new code.

## Integration test configuration

Define environment variables when you run integration tests against real
endpoints.

Required variables:

- `VITE_TEST_USERNAME`
- `VITE_TEST_PASSWORD`
- `VITE_TEST_GRAPHQL_ENDPOINT`

Optional model selection variables:

- `VITE_TEST_MODELFORM_APP_LABEL`
- `VITE_TEST_MODELFORM_MODEL_NAME`

Run integration tests with:

```bash
npm run test:integration
```

## Troubleshooting

Use these checks to isolate common route and manifest issues.

- A route does not appear in navigation:
  Confirm the manifest has both a route and navigation entry, and `hidden` is
  not `true`.
- `check:manifests` fails for a path expression:
  Use a string literal path or `ROUTES.<KEY>` in manifest `path` fields.
- The app lands on the wrong page:
  Confirm `defaultRoute` matches an existing route in the same manifest.
- A project manifest does not load:
  Confirm the project includes `manifest.ts` in addition to `manifest.tsx`.

## Next steps

Use `docs/frontend/index.md` to continue with testing and library-specific
guides after you complete the architecture workflow in this document.
