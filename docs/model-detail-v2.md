# ModelDetailV2 migration guide

This guide explains how you migrate legacy `ModelDetail` usage to
`ModelDetailV2`, how you enable metadata-driven customization, and how you
verify the migration with the expected tests.

## Migration overview

Use `ModelDetailV2` when you want metadata-driven rendering and shared behavior
across sections, tabs, relation tables, permissions, and actions.

Use this migration checklist:

1. Replace `ModelDetail` usage with `ModelDetailV2`.
2. Pass `appName`, `modelName`, and `id`.
3. Keep the view read-only and execute mutations through detail actions.
4. Add customization only where metadata defaults are not enough.
5. Run the detail test matrix after each migrated page.

## Basic usage

Render a detail page with only app/model/id values.

```tsx
import { ModelDetailV2 } from "@/lib/details";

export function ProductDetailPage({ id }: { id: string }) {
  return (
    <ModelDetailV2
      appName="test_app"
      modelName="Product"
      id={id}
    />
  );
}
```

## Customization options

`ModelDetailV2` accepts optional `customization` and `customRenderers` props so
you can layer model/tab/section field overrides without replacing the renderer.

```tsx
<ModelDetailV2
  appName="test_app"
  modelName="Product"
  id="1"
  customization={{
    modelFields: [
      "category.desc",
      { name: "secretCode", exclude: true },
    ],
    sectionFields: {
      main: [{ name: "price", title: "Cost", include: true, exclude: false }],
    },
  }}
  customRenderers={{
    price: (value) => `USD ${value}`,
  }}
/>
```

Precedence is deterministic:

1. Base metadata fields.
2. Model-level overrides.
3. Tab-level overrides.
4. Section-level overrides.

Exclude rules are fail-closed and remove fields from render output.

## Atomic field rendering

When you need strict single-value rendering in a detail experience, compose
`UnitFieldRenderer` from `@/lib/details` inside your field-level custom
renderers. This keeps atomic formatting and accessibility behavior consistent
without taking over section or page layout.

```tsx
import { UnitFieldRenderer } from "@/lib/details";

customRenderers={{
  status: (value) => (
    <UnitFieldRenderer
      mode="valueOnly"
      field={{
        id: "status",
        label: "Status",
        kind: "status",
        value,
      }}
    />
  ),
}}
```

For the full API, see the
[unit field renderer frontend guide](frontend/libs/unit-field-renderer.md).

## Actions and permissions

`DynamicDetail` renders scoped action toolbars for `MODEL`, `SECTION`, `TABLE`,
and `ROW` actions. Visibility is fail-closed:

- A field/action appears only when metadata and backend signals allow it.
- Unauthorized actions are hidden or denied.
- Action outcomes expose retry and refresh-required states.

The detail view remains read-only. Inline field editing is intentionally blocked.

## Verification

Run these commands from `rail-react`:

```bash
npm run test -- src/lib/details --run
npx tsc -p tsconfig.app.json --noEmit
```

## Next steps

After migration, add model-specific examples in your app docs that reference
the same `ModelDetailV2` configuration patterns used here.
