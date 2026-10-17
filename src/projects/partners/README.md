# Partners

This folder contains the complete Partenaires frontend: supplier and contact CRUD,
supplier intake and approvals, procurement lots, attachments, spending summaries,
closed purchase-order history, and the supplier reporting dashboard. It imports
only its own source, declared npm packages, and the consuming frontend's Rail runtime.

Existing `/achat/...` URLs and `achat:...` route IDs are retained for compatibility.
The project identity is `partners` in every frontend.

From Achat's `frontend/`, publish this folder to the existing private repository:

```powershell
npm run apps:push -- partners -m "Make Partners independently reusable"
```

From `plateforme-commandes/` (or another configured Rail frontend), install it:

```powershell
npm run apps:pull -- partners
```

Both commands validate imports and run the host architecture checks, unit tests,
and build. Dependencies are declared in this folder's `package.json` and installed
through the host's npm workspace. Keep host configuration outside this folder.

All pages are enabled by default. To install only the supplier list, set this entry
in the consuming frontend's `src/application/shared_project_options.ts`:

```ts
const options: Record<string, SharedAppOptions> = {
  partners: { routeIds: ["achat:suppliers:list"] },
};
```

Use `defaultRouteId` when excluding the supplier list, for example with
`routeIds: ["achat:reports:supplier-dashboard"]` and
`defaultRouteId: "achat:reports:supplier-dashboard"`. Lists hide create, edit, and
detail links for excluded pages. Include a list route when selecting its nested
pages so that Rail keeps inherited navigation access requirements intact.

The host supplies authentication, Apollo, the backend endpoint, UI providers,
and the Rail aliases. The backend must expose the existing `suppliers` models,
`catalog.ProcurementLot`, `purchasing.PurchaseOrder` history, supplier spending
fields, intake mutations and permissions, and the reporting operations/catalog
entry `achat_supplier_bi_overview`. Page selection does not change backend access.
Purchase-order history links appear only if the host registers
`achat:purchase-orders:detail`; the history table itself does not require that page.

For an Achat backend missing the supplier report catalog entry, the existing
`python manage.py sync_achat_reporting` command provisions the standard reporting
catalog. Sharing this frontend folder does not provision backend models or reports.

## Extraction verification (2026-10-16)

The extraction started from frontend commit
`b907555b722db8811a5ec313c7b14faa74fd4ee9` and reuses the installed Rail model
tables, forms, details, authentication and Apollo hooks. A snapshot recorded before
extraction verifies all 22 route definitions, navigation and access requirements.
Supplier and reporting GraphQL operation text is unchanged from that baseline.

Passed: frontend lint, full architecture checks, type checking, production build,
the complete frontend unit suite (909 tests), and the subsequently added intake
navigation tests. The focused Partners/portability suite passes all 22 tests.
A temporary installation into plateforme-commandes passed its complete unit suite
(678 tests), architecture checks and build. A supplier-list-only installation also
passed registration tests and build. That temporary installation was then removed.

The live supplier query passes. Live dashboard verification fails because the
configured backend has no `achat_supplier_bi_overview` report. The broader
`test:all` integration phase was stopped after additional purchasing/procurement
fixture failures; full integration verification remains incomplete.

The Rail skill validator reports no errors, but its accepted framework source
snapshot is stale, so its result is incomplete. Its explicit-detail-fields warning
was reviewed: `defineCrudViewConfig` supplies `layout.includeFields`, and the app's
tests check those lists. Native architecture checks and TypeScript checks pass.
