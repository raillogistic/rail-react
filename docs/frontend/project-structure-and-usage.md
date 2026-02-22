# Frontend project structure and usage

This guide explains how the `rail-react` frontend is organized, how the app
boots, and how you add new pages, routes, and project modules without breaking
the refactored architecture.

## Quick start

Use this flow when you set up the project on a new machine or start working in
an existing clone.

1. Install dependencies from the repository root:

```bash
npm install
```

2. Start the local development server:

```bash
npm run dev
```

3. Open the URL printed by Vite (usually `http://localhost:5173`).
4. Run architecture and test checks before you open a pull request:

```bash
npm run check:architecture
npm run lint
npm test
```

## Repository structure

The repository contains frontend source code, scripts, static assets, and
separate backend and frontend documentation.

- `src/`: frontend runtime code.
- `docs/`: project documentation.
- `scripts/`: maintenance and validation scripts.
- `public/`: static files served by Vite.
- `package.json`: dependency and command definitions.
- `vite.config.ts`: Vite build, alias, and Vitest configuration.

## Source architecture under `src/`

The refactor introduced explicit architecture layers and manifest-driven route
composition. You should place new code in the canonical folders below.

- `src/app/`: app shell, router, and bootstrap composition.
- `src/projects/`: project manifests that declare routes and navigation.
- `src/pages/`: route-level pages and page-level containers.
- `src/features/`: user-facing feature modules, such as auth APIs and import
  flows.
- `src/shared/`: cross-feature infrastructure, including API clients.

## Runtime boot flow

The app boot process is stable and follows a fixed provider and composition
order.

1. `src/main.tsx` renders `App`.
2. `src/App.tsx` wires `ApolloProvider`, `BrowserRouter`,
   `ConnectedAuthProvider`, and `AuthDependentContent`.
3. `src/app/bootstrap/AuthDependentContent.tsx` applies theme settings and
   mounts `RouteBuilder`.
4. `src/app/router/RouteBuilder.tsx` renders public auth routes and then the
   protected shell route.
5. `src/app/shell/MainApp.tsx` renders the sidebar, navbar, and page content.
6. `src/app/shell/AppContent.tsx` resolves page components from navigation
   metadata exposed by `src/app/router/navigation.ts`.

## Routing and navigation model

Routing and navigation are manifest-driven.

- Contracts are defined in `src/app/router/contracts.ts`.
- The manifest registry is implemented in
  `src/app/router/manifestRegistry.ts`.
- Navigation mapping helpers are in `src/app/router/navigation.ts`.
- Manifest validation logic is in `src/app/router/manifestValidation.ts`.
- The core manifest is in `src/projects/core/manifest.tsx`.
- Shared route constants are in `src/shared/routing/paths.ts`.
- The manifest loader uses
  `import.meta.glob("@/projects/*/manifest.ts", { eager: true })`.

Each project manifest must expose:

- `projectId`
- `defaultRoute`
- `routes`
- `navigation`

### Local-only project extension

You can add local routes without committing them by creating
`src/apps/routes.local.ts`, which is ignored by Git. The adapter in
`src/app/router/localManifestExtension.ts` can read either:

- `APP_MANIFEST` or `APP_MANIFEST_EXTENSION`
- legacy-style `APP_NAVIGATION_LINKS` and `APP_DEFAULT_ROUTE`

## Add a new project manifest

Add a new project by creating a folder under `src/projects/` and exporting a
manifest.

1. Create `src/projects/<project-id>/manifest.tsx`.
2. Export a manifest object typed as `AppManifest`.
3. Create `src/projects/<project-id>/manifest.ts` that re-exports the
   `manifest.tsx` default export.
4. Run manifest and architecture checks.

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

1. Create your route-level page in `src/pages/...` or feature page in
   `src/features/...`.
2. Import it in the owning manifest, usually with `lazy()` and `Suspense`.
3. Add a route entry with a unique `id` and `path`.
4. Add a navigation entry that references the route via `routeId`.
5. Verify with checks and tests.

## API boundary usage

The canonical API boundary exists under `src/shared/api` and
`src/features/auth/api`.

- Use `src/shared/api/apollo/client.ts` for the runtime Apollo client.
- Use `src/shared/api/graphql/index.ts` for shared GraphQL exports.
- Use `src/features/auth/api/index.ts` for auth operations consumed by auth
  providers and services.

Compatibility re-exports still exist in `src/graphql/*`. New imports should
prefer `src/shared/api/*` and `src/features/*` paths.

## Architecture and test gates

Run these commands to keep imports, manifests, and behavior valid.

```bash
npm run check:layers
npm run check:manifests
npm run check:architecture
npm run lint
npm test
```

When you change router contracts or manifests, run targeted router tests in
addition to the full suite.

```bash
npm run test -- src/app/router --run
```

If you run integration tests that hit real endpoints, define these variables in
`.env`:

- `VITE_TEST_USERNAME`
- `VITE_TEST_PASSWORD`
- `VITE_TEST_GRAPHQL_ENDPOINT`

## Migration guidance for new code

Legacy path stubs were removed from runtime paths. Keep all new route, shell,
and API work on canonical modules under `src/app/*`, `src/pages/*`,
`src/features/*`, and `src/shared/*`.

## Troubleshooting

These checks help you debug common routing and manifest issues quickly.

- Route does not appear in navigation:
  Confirm the manifest contains both a route and a navigation entry, and that
  `hidden` is not set to `true`.
- `check:manifests` fails for a route path expression:
  Use a string literal path or `ROUTES.<KEY>` in manifest `path` fields.
- App lands on the wrong page:
  Confirm `defaultRoute` matches an existing route in the same manifest.
- App does not load project routes:
  Confirm the project includes `manifest.ts` in addition to `manifest.tsx`.

## Next steps

Use the frontend docs index at `docs/frontend/index.md` to find testing and
library-specific guides after you complete the architecture flow in this
document.
