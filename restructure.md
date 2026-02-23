# Frontend src restructure plan

This document gives you a complete restructure proposal for `src/` organized by
single responsibility and feature ownership. It includes a target tree, mapping
from the current layout, architectural rules, and a phased migration plan with
quality gates.

## Objectives

This restructure keeps responsibilities clear and makes modules portable to
other projects with minimal path or dependency changes.

- Group code by business purpose first, then technical role.
- Keep each folder focused on one responsibility.
- Make imports predictable and enforceable with layer checks.
- Reduce coupling between routing, UI composition, and business logic.
- Support incremental migration without breaking the running app.

## Target `src/` tree

Use this as the target architecture for the next refactor cycle.

```txt
src/
  main.tsx
  app/
    App.tsx
    providers/
      ApolloProvider.tsx
      AuthProvider.tsx
      ThemeProvider.tsx
    router/
      RouteBuilder.tsx
      ProtectedRoute.tsx
      PublicRoute.tsx
      contracts.ts
      manifestRegistry.ts
      manifestValidation.ts
      navigation.ts
      localManifestExtension.ts
    shell/
      MainApp.tsx
      AppNavbar.tsx
      AppSidebar.tsx

  processes/
    auth-session/
    app-navigation/

  pages/
    auth/
      login/page.tsx
      forgot-password/page.tsx
      reset-password/page.tsx
      sessions/page.tsx
      mfa-setup/page.tsx
    dashboard/page.tsx
    settings/
      account/page.tsx
      appearance/page.tsx
      layout/page.tsx
      admin-ui/page.tsx

  widgets/
    navigation/
      nav-main/
      nav-user/
      command-menu/
    model-table/
    model-form/
    reporting/

  features/
    auth/
      login/
      logout/
      mfa/
      session-management/
      api/
      model/
    model-import/
      upload/
      review/
      simulation/
      commit/
      api/
      model/
      ui/
    model-table/
      filtering/
      grouping/
      export/
      preferences/
    model-form/
      validation/
      submit/
      generated/
    reporting/
      charting/
      datasets/
      export/
    settings/
      account/
      security/
      appearance/

  entities/
    user/
    session/
    permission/
    model-metadata/
    table-config/
    report/

  shared/
    api/
      apollo/
      graphql/
    routing/
      paths.ts
      navigation.ts
    ui/
      kit/
      theme/
    auth/
      userIdentity.ts
    config/
    hooks/
    utils/
    types/
    assets/
      fonts/
      icons/
      images/
      logos/
    styles/

  projects/
    core/
      manifest.tsx
      manifest.ts

  test/
    unit/
    integration/
    fixtures/
```

## Folder responsibilities

This section defines what belongs in each top-level folder.

- `app`: Application composition only, including providers, router, and shell.
- `processes`: Multi-feature workflows and orchestration logic.
- `pages`: Route entry containers that bind URL and screen composition.
- `widgets`: Reusable page blocks composed from one or more features.
- `features`: Business capabilities, user actions, and feature-local API usage.
- `entities`: Core domain models, entity rules, and entity-level state.
- `shared`: Cross-cutting primitives with no business ownership.
- `projects`: Manifest declarations and project-level routing metadata.
- `test`: Test scaffolding, shared mocks, and integration harness.

## Import direction rules

Use these dependency rules to keep the architecture stable.

- `app` can import from all lower layers.
- `processes` can import `features`, `entities`, and `shared`.
- `pages` can import `widgets`, `features`, `entities`, and `shared`.
- `widgets` can import `features`, `entities`, and `shared`.
- `features` can import `entities` and `shared`.
- `entities` can import only `shared`.
- `shared` must not import business layers.

Disallow lateral imports between unrelated features unless they go through
`entities` or `shared`.

## Current-to-target move map

Use this map as the migration baseline.

| Current path | Target path |
| --- | --- |
| `src/lib/components/ui/*` | `src/shared/ui/kit/*` |
| `src/lib/theme/*` | `src/shared/ui/theme/*` |
| `src/lib/components/nav-main.tsx` | `src/widgets/navigation/nav-main/index.tsx` |
| `src/lib/components/nav-user.tsx` | `src/widgets/navigation/nav-user/index.tsx` |
| `src/lib/components/user-nav.tsx` | `src/widgets/navigation/nav-user-menu/index.tsx` |
| `src/lib/components/command-menu.tsx` | `src/widgets/navigation/command-menu/index.tsx` |
| `src/lib/import/*` | `src/features/model-import/*` and `src/pages/*` |
| `src/lib/table/*` | `src/widgets/model-table/*` and `src/features/model-table/*` |
| `src/lib/form/*` | `src/widgets/model-form/*` and `src/features/model-form/*` |
| `src/lib/reporting/*` | `src/widgets/reporting/*` and `src/features/reporting/*` |
| `src/lib/graphql/*` | `src/shared/api/graphql/*` or feature-local `api/` |
| `src/graphql/*` | `src/shared/api/graphql/legacy/*` during transition, then remove |
| `src/auth/*` | `src/features/auth/*` and `src/entities/{user,session,permission}/*` |
| `src/hooks/*` | `src/shared/hooks/*` |
| `src/utils/*` | `src/shared/utils/*` |
| `src/assets/*` | `src/shared/assets/*` |
| `src/styles/*` | `src/shared/styles/*` |

## Refactor phases

Run this plan in order to avoid long-lived breakages.

### Phase 1: Baseline and guardrails

Start by freezing current behavior and codifying migration constraints.

1. Capture baseline checks and current test status.
2. Update architecture scripts with explicit allowed and disallowed zones.
3. Add temporary alias map for old-to-new paths.
4. Create a migration tracker file with module-level status.

Exit criteria:

- `npm run check:architecture` passes.
- `npm run lint` passes.
- `npm run test` passes.

### Phase 2: Shared foundations extraction

Move cross-cutting modules first so downstream migrations consume stable
primitives.

1. Move `lib/components/ui` to `shared/ui/kit`.
2. Move `lib/theme` to `shared/ui/theme`.
3. Consolidate GraphQL shared utilities under `shared/api/graphql`.
4. Move generic hooks and helpers under `shared/hooks` and `shared/utils`.

Exit criteria:

- `npm run check:architecture:full` passes.
- `npm run lint:full` passes.
- All imports to old shared paths are replaced or compatibility-exported.

### Phase 3: Auth domain normalization

Split auth into entity model, feature behavior, and route pages.

1. Move service and API logic into `features/auth`.
2. Move user/session/permission types and invariants into `entities`.
3. Keep page containers in `pages/auth`.
4. Remove duplicate wrappers and enforce canonical auth imports.

Exit criteria:

- Auth unit tests pass.
- Integration auth tests pass.
- No new imports from deprecated auth paths.

### Phase 4: Data module decomposition

Break monolithic table, form, import, and reporting modules into widgets and
features.

1. Move route-facing table and form shells into `widgets`.
2. Move business logic and mutations into corresponding `features/*`.
3. Keep entity-specific contracts in `entities/*`.
4. Remove duplicate hooks and obsolete compatibility layers.

Exit criteria:

- `npm run test:all` passes.
- Router and navigation flows still resolve expected pages.
- Bundle chunks remain stable or improve.

### Phase 5: Page and process cleanup

Keep pages thin and move orchestration into processes.

1. Reduce each page to routing and high-level composition concerns.
2. Move multi-feature workflows into `processes`.
3. Align manifests with new feature and widget entry points.

Exit criteria:

- `pages` contain no deep business logic.
- `processes` contain only orchestration concerns.

### Phase 6: Remove deprecated paths and enforce strict mode

Finalize the migration and prevent regressions.

1. Remove old folders and compatibility exports.
2. Turn strict mode on for full layer checks in CI.
3. Fail CI when old paths are imported.
4. Update documentation and onboarding references.

Exit criteria:

- `node scripts/check-layer-imports-full.mjs --strict` passes.
- `npm run check:architecture:full && npm run lint:full && npm run test:all`
  passes.
- No imports reference removed legacy roots.

## Risk controls

Use these controls to keep risk low during migration.

- Migrate one capability at a time, not multiple domains in one pull request.
- Keep temporary re-export adapters only within a defined sunset window.
- Add import lint rules to block new usage of deprecated paths.
- Run integration tests on each domain migration milestone.

## Deliverables

Track these outputs to make progress auditable.

- New folder scaffolding committed by phase.
- Alias and import-policy updates committed with tests.
- Migration tracker updated for each moved module.
- Final cleanup pull request that removes temporary adapters.

## Next steps

Use this sequence to start implementation.

1. Create folder scaffolding and aliases for the target tree.
2. Execute Phase 2 on shared foundations in a dedicated pull request.
3. Open separate pull requests for auth, then table and form, then import and
   reporting.
