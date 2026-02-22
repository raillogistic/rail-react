# Refactor plan for reusable rail-react frontend

This plan turns `rail-react` into a reusable frontend platform where each new
project only adds pages, features, and project manifests. The core shell,
routing engine, providers, and shared libraries remain unchanged across
projects.

## What this plan delivers

This section defines the expected end state before you start migration.

- A stable app shell that never imports project pages directly.
- A plugin-style route and navigation registry loaded from project manifests.
- A clean layer model with clear import boundaries.
- One GraphQL/API boundary instead of parallel stacks.
- A migration path that keeps existing behavior while you move module by
  module.

## Current blockers in rail-react

Your current codebase already has reusable building blocks, but core
composition still depends on project-specific declarations.

- `src/routes/links.tsx` mixes route constants, navigation metadata, and page
  component declarations in one file.
- Core navigation contains project/demo screens, for example table and form
  demo pages, instead of loading from project modules.
- You have two GraphQL layers (`src/graphql` and `src/lib/graphql`) with
  overlapping responsibilities.
- UI composition concerns are split between `src/layout`, `src/views/routes`,
  and `src/views/*`, which makes ownership unclear.
- `src/apps/routes.local.ts` is a useful extension point, but the `local` file
  is intentionally gitignored, so it does not scale as a shared project
  contract.
- Compatibility wrappers exist in `src/views/providers/*`, which indicates old
  and new boundaries are both active.

## Target architecture

Use a layered, plugin-first structure so core runtime stays stable while each
project contributes only manifests and feature/page modules.

```text
src/
  app/
    bootstrap/
    providers/
    router/
    shell/
    config/
  processes/
    auth-session/
    metadata-warmup/
  pages/
    dashboard/
    settings-account/
  widgets/
    app-navigation/
    app-header/
  features/
    auth/
    settings/
    model-import/
  entities/
    user/
    session/
    permission/
  shared/
    api/
      apollo/
      graphql/
    ui/
    lib/
    config/
  projects/
    core/
      manifest.ts
    billing/
      manifest.ts
  test/
```

## Layer responsibilities and import rules

These rules must stay strict. They are the main reason future projects can be
added without changing core files.

- `app` composes runtime and can import all lower layers.
- `processes` orchestrates multi-feature flows and can import `features`,
  `entities`, and `shared`.
- `pages` can import `widgets`, `features`, `entities`, and `shared`.
- `widgets` can import `features`, `entities`, and `shared`.
- `features` can import `entities` and `shared`.
- `entities` can import only `shared`.
- `shared` can import only `shared`.

## Project manifest contract

A project manifest becomes the only place where project-specific routes and
navigation are declared.

```ts
export interface AppRouteConfig {
  id: string;
  path: string;
  requiresAuth: boolean;
  requiredPermission?: string;
  component: React.LazyExoticComponent<React.ComponentType>;
}

export interface NavigationEntry {
  id: string;
  title: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  hidden?: boolean;
}

export interface AppManifest {
  id: string;
  defaultRoute: string;
  routes: AppRouteConfig[];
  navigation: {
    id: string;
    label: string;
    items: NavigationEntry[];
  }[];
}
```

Your registry in `src/app/router` must load manifests automatically.

```ts
const projectModules = import.meta.glob<{ manifest: AppManifest }>(
  "@/projects/*/manifest.ts",
  { eager: true },
);
```

The router and sidebar must consume only this registry. Core files must not
hardcode project pages anymore.

## Refactor mapping from current folders

This mapping lets you migrate with minimal breakage.

- `src/layout/*` moves to `src/app/shell/*`.
- `src/views/routes/*` moves to `src/app/router/*`.
- `src/routes/links.tsx` splits into:
  `src/app/router/contracts.ts`,
  `src/app/router/manifestRegistry.ts`, and
  `src/projects/*/manifest.ts`.
- `src/views/AuthDependentContent.tsx` moves to `src/app/bootstrap`.
- `src/views/providers/*` is removed after imports switch to `src/auth/context`.
- `src/graphql/*` is reduced to compatibility exports, then replaced by
  `src/features/auth/api/*` and `src/shared/api/graphql/*`.
- `src/lib/*` is classified into `shared`, `entities`, `features`, and
  `widgets` by ownership.

## GraphQL and API boundary plan

You must keep one API model to avoid duplicated query builders and auth logic.

- Keep Apollo client bootstrap in `src/shared/api/apollo`.
- Move auth-specific operations from `src/graphql/*` into
  `src/features/auth/api/*`.
- Keep metadata/query composition utilities in `src/shared/api/graphql/*`.
- Publish temporary re-exports to avoid large, risky import rewrites in one
  commit.
- Remove temporary re-exports once import migration reaches 100 percent.

## Module template for reusability

Every new feature and page must follow one file contract so teams can add new
modules without touching core runtime.

```text
feature-or-page/
  index.ts
  ui/
    *.tsx
  model/
    *.ts
  api/
    *.ts
  lib/
    *.ts
  __tests__/
```

Use this policy in all `*.ts` and `*.tsx` files.

- Use JSDoc for exported props, hooks, and functions.
- Export from `index.ts` only.
- Keep UI components free from direct GraphQL query strings.
- Keep data-fetching and mutation wiring inside `api/` or feature hooks.

## Migration roadmap

Use phased migration so you preserve behavior at each checkpoint.

1. Phase 1: Introduce contracts and registry.
   Create `contracts.ts` and `manifestRegistry.ts`, then adapt router/sidebar
   to read from registry while still sourcing current links.
2. Phase 2: Extract current core routes into `projects/core/manifest.ts`.
   Move route declarations out of `src/routes/links.tsx` and keep old exports
   as compatibility wrappers.
3. Phase 3: Move shell and router ownership.
   Relocate `layout` and `views/routes` into `app/shell` and `app/router`.
4. Phase 4: Normalize domain modules.
   Move `views/settings`, `auth/pages`, and import pages into `pages` and
   `features`.
5. Phase 5: Consolidate GraphQL.
   Create final `shared/api/graphql` and `features/auth/api` boundaries and
   delete legacy duplicate modules.
6. Phase 6: Enforce guardrails.
   Add lint rules for layer imports and add CI checks that block forbidden
   cross-layer imports.

## Definition of done

This checklist confirms that new projects can be added without editing core.

- Adding a project requires only `src/projects/<project>/manifest.ts` and new
  page/feature folders.
- `src/app/*`, `src/main.tsx`, and `src/App.tsx` remain unchanged for a new
  project.
- Navigation and routing are generated only from manifests.
- Project features are lazy-loaded by route to keep bundle boundaries clean.
- No imports remain from deprecated compatibility wrappers.
- Lint and tests pass with the new layer rules enabled.

## Next steps

If you want implementation to start immediately, follow this order.

1. Approve the target folder names and manifest contract in this file.
2. Implement phases 1 and 2 in one branch to establish the registry and
   compatibility layer.
3. Migrate one vertical slice, for example `model-import`, as the reference
   pattern for all remaining modules.
