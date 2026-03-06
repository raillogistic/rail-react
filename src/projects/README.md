# Project generator commands

This directory stores project manifests and project pages. Use the commands
below from the `rail-react/` root to scaffold project structure and register
model screens.

## Use `startapp` to scaffold a new project

Use `startapp` when you need a new project folder under `src/projects/`.

```bash
npm run startapp -- <project-id>
```

Example:

```bash
npm run startapp -- inventory
```

`startapp` creates:

- `src/projects/<project-id>/manifest.tsx`
- `src/projects/<project-id>/manifest.ts`
- `src/projects/<project-id>/config/routes.ts`
- starter pages in `src/projects/<project-id>/pages/`

## Use `register` to expose a model inside an existing project

Use `register` to expose one model table with form and detail routes in an
existing project manifest.

```bash
npm run register -- --model <app.model> --project <project-id> [options]
```

Minimum example:

```bash
npm run register -- --model catalog.article --project catalog
```

Inline table actions example:

```bash
npm run register -- --model operations.restitution --project operations --type inline --title "Restitutions"
```

Set sidebar position example:

```bash
npm run register -- --model catalog.article --project catalog --order 1
```

When registration succeeds, the command:

- creates three files under `src/projects/<project-id>/pages/<model-slug>/`
- adds route constants in `src/projects/<project-id>/config/routes.ts`
- adds route and navigation entries in `src/projects/<project-id>/manifest.tsx`
- keeps list route visible in sidebar
- keeps create, edit, and detail routes hidden in sidebar navigation

## `register` options

- `--model <app.model>`: Required model reference, for example
  `catalog.article`.
- `--project <project-id>`: Required target project under `src/projects/`.
- `--type <pages|inline>`: List behavior mode. Default is `pages`.
- `--title "<label>"`: Sidebar and table title.
- `--order <number>`: Sidebar position for the list entry. `1` inserts first.
- `--app <app>`: Optional app when `--model` does not include app prefix.
- `--slug <slug>`: Optional route segment and folder override.
- `--route-base </path>`: Optional route base override.
- `--icon <LucideIcon>`: Optional icon override. Default is `FileText`.
- `--description "<text>"`: Optional list description in manifest.
- `--form-title "<text>"`: Optional title used for form/detail route labels.
- `--permission <perm>`: Optional `requiredPermission` for generated routes.
- `--dry-run`: Preview file changes without writing files.
- `--force`: Overwrite generated files and conflicting route constants.

## Control page access with access rules

Project manifests now support a structured `access` object on routes,
navigation groups, and navigation entries. Use it when one page or one section
of the app must only be visible to users with specific roles or permissions.
The existing `requiredPermission` field still works for simple cases and is
merged as an extra `allPermissions` check.

The `register` command still writes only `requiredPermission` when you use
`--permission`. After generation, edit the manifest manually when you need
role checks, multiple permissions, or group-level access rules.

Add `access` in the place that matches the scope you want:

- Route `access`: restrict one page.
- Navigation group `access`: restrict every page referenced by the group.
- Navigation entry `access`: restrict one menu item and its child pages.

Use these fields inside `access`:

- `requireAuthentication`: Set to `false` if the rule can apply to anonymous
  users.
- `anyPermissions`: Match when the user has at least one listed permission.
- `allPermissions`: Match when the user has every listed permission.
- `anyRoles`: Match when the user has at least one listed role.
- `allRoles`: Match when the user has every listed role.

This example shows the three supported manifest scopes in one project:

```tsx
routes: [
  protectedRoute("operations", {
    id: "operations.orders.list",
    path: OPERATIONS_ROUTES.ORDERS_LIST,
    title: "Orders",
    access: {
      anyRoles: ["ops_manager", "ops_agent"],
    },
    element: <OrdersListPage />,
  }),
  protectedRoute("operations", {
    id: "operations.shipments.detail",
    path: OPERATIONS_ROUTES.SHIPMENT_DETAIL,
    title: "Shipment detail",
    requiredPermission: "operations.view_shipment",
    access: {
      allRoles: ["ops_manager"],
    },
    element: <ShipmentDetailPage />,
  }),
],
navigation: [
  navGroup("operations", {
    id: "operations-control",
    label: "Operations",
    access: {
      anyRoles: ["ops_manager"],
    },
    entries: [
      {
        id: "orders",
        title: "Orders",
        path: OPERATIONS_ROUTES.ORDERS_LIST,
        guard: "protected",
        routeId: "operations.orders.list",
      },
      {
        id: "shipments",
        title: "Shipments",
        path: OPERATIONS_ROUTES.SHIPMENTS_LIST,
        guard: "protected",
        access: {
          allPermissions: ["operations.view_shipment"],
        },
        children: [
          {
            id: "shipment-detail",
            title: "Shipment detail",
            path: OPERATIONS_ROUTES.SHIPMENT_DETAIL,
            guard: "protected",
            routeId: "operations.shipments.detail",
            hidden: true,
          },
        ],
      },
    ],
  }),
],
```

If you use the updated `rail-django` backend, `rail-react` also fetches
`frontendRouteAccess` metadata and combines those rules with the inline
manifest rules. Inline and backend rules both must pass before a page is shown
in navigation or rendered after a direct URL hit.

Add backend-managed rules in `meta.yaml` like this:

```yaml
frontend_route_access:
  - targetType: navigation-group
    target: operations-control
    anyRoles:
      - ops_manager
  - targetType: route
    target: /operations/orders
    allPermissions:
      - operations.view_orders
  - targetType: navigation-entry
    target: shipments
    allPermissions:
      - operations.view_shipment
```

Use these backend targets:

- `project`: every route inside one project manifest.
- `route`: one route id or route path.
- `navigation-group`: every route reachable from one navigation group id.
- `navigation-entry`: one navigation entry id and its child routes.

After you edit access rules, run `npm run check:manifests`. If you also use
backend-managed rules, verify the matching `frontend_route_access` entries in
`rail-django` before you test the final role matrix.

## Use `unregister` to remove a model from an existing project

Use `unregister` to remove routes, sidebar navigation, and generated model page
files for a previously registered model.

```bash
npm run unregister -- --model <app.model> --project <project-id> [options]
```

Minimum example:

```bash
npm run unregister -- --model catalog.article --project catalog
```

Preview changes example:

```bash
npm run unregister -- --model operations.restitution --project operations --dry-run
```

When unregistration succeeds, the command:

- removes model route constants from `src/projects/<project-id>/config/routes.ts`
- removes list/create/edit/detail route entries from the project manifest
- removes the sidebar navigation entry for the model list
- removes generated files from `src/projects/<project-id>/pages/<model-slug>/`

## `unregister` options

- `--model <app.model>`: Required model reference, for example
  `catalog.article`.
- `--project <project-id>`: Required target project under `src/projects/`.
- `--app <app>`: Optional app when `--model` does not include app prefix.
- `--slug <slug>`: Optional route segment and folder override.
- `--keep-files`: Keep generated model pages on disk.
- `--dry-run`: Preview file changes without writing files.
- `--force`: Continue even if some entries are missing.

## Generated files for each model

For a model named `article`, the command creates:

- `src/projects/<project-id>/pages/article/ArticleListPage.tsx`
- `src/projects/<project-id>/pages/article/ArticleFormPage.tsx`
- `src/projects/<project-id>/pages/article/ArticleDetailPage.tsx`

This structure follows the same model folder pattern used by project pages such
as `src/projects/catalog/pages/article/`.
