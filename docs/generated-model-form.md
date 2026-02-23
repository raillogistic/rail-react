# Generated ModelForm Integration Guide

## Overview

Generated ModelForms consume backend contract queries and transform them into a
DynamicForm schema with deterministic mutation bindings and normalized errors.

## Required GraphQL operations

- `modelFormContract`
- `modelFormContractPages`
- `modelFormInitialData`

GraphQL documents live in
`src/shared/api/graphql/legacy/modelFormContract.ts`.

## Frontend adapter flow

1. Load contract and optional initial data.
2. Call `useGeneratedModelForm` to map contract fields/sections into DynamicForm
   schema.
3. Use `useGeneratedValidators` to derive baseline validators from contract
   constraints.
4. Default submit wiring (`ModelForm`, create/update modes) now executes generated
   mutations automatically; no manual Apollo mutation code is required.
5. Runtime overrides are applied before payload build, then identifier resolution
   runs (`objectId` default with contract/override support).
6. All submit failures are normalized to field-path or `__all__` with conflict
   metadata preserved.

## Compatibility fallback

- Keep legacy schema queries active (`formConfig`) during rollout.
- If generated query returns opt-in disabled errors, use legacy schema without
  blocking the user flow.
- `resolveModelFormSchema` in `src/widgets/model-form/index.tsx` centralizes the generated
  vs legacy decision.

## Runtime overrides

- Runtime overrides are path-based and support `REPLACE`, `MERGE`, `UNSET`.
- Call `buildSubmissionValues` from `useGeneratedModelForm` before mutation
  submission so overrides are applied consistently.

## Default generated submit behavior

- `ModelForm` in `CREATE`/`UPDATE` mode now routes Save through generated submit by default.
- Create uses `mutationBindings.createOperation`; update uses `mutationBindings.updateOperation`.
- Update identifier key resolution precedence:
  - `contractIdentifierKey`
  - explicit override
  - `mutationBindings.updateIdentifierKey`
  - fallback `objectId`

## Nested relation normalization defaults

Generated submit now normalizes relation fields without manual adapters:

- Singular scalar relation values normalize to `{ connect: <id> }`.
- Update-mode to-many scalar lists normalize to `{ set: [...] }` (replacement semantics).
- Singular `null` values normalize to `{ clear: true }`.
- To-many object lists infer per-item intent:
  - object with `id`/`pk`/`objectId`/`object_id` -> `update`
  - object without identity key -> `create`
- Explicit operation objects (`connect`, `create`, `update`, `disconnect`, `set`, `delete`, `clear`) pass through unchanged.
- Non-relation fields are preserved as submitted.

## Nested relation operation controls

Use `nested.<relationPath>` to override default generated behavior per relation:

- `scalarListOperation`: choose update-mode scalar-list behavior (`"set"` or `"connect"`).
- `removeOperation`: when a persisted nested row is removed in UPDATE mode, emit `"disconnect"` or `"delete"` (diffed against initial loaded values).
- `deleteMutation`: enable direct server delete when removing list rows from the UI.

```tsx
<ModelForm
  app="store"
  model="Order"
  mode="UPDATE"
  objectId="42"
  nested={{
    items: {
      scalarListOperation: "connect",
      removeOperation: "disconnect",
      deleteMutation: {
        enabled: true,
        operationName: "deleteOrderItem", // optional when modelName is provided
        modelName: "OrderItem",
        idPath: "id",
        selection: "id",
      },
    },
  }}
/>
```

### Nested list row intent in UI

- Rows with identity (`id`, `pk`, `objectId`, `object_id`) are labeled `Existing`.
- Rows without identity are labeled `New`.
- On submit:
  - `Existing` rows map to nested `update`.
  - `New` rows map to nested `create`.

### Direct delete from list remove action

- If `deleteMutation.enabled` is true and the row has identity, remove triggers a direct GraphQL delete mutation (`delete<Model>(id: ID!)` or `operationName`).
- If direct delete is disabled or identity is missing, remove is local-only and payload diffing handles disconnect/delete later on submit.

## Nested policy enforcement (fail-fast)

- Inferred and explicit relation actions are checked against relation policy before mutation dispatch.
- Blocked actions fail fast with relation-scoped validation errors (`field=<relationPath>`).
- No fallback action is applied when policy denies an action.

### Loading + duplicate-submit guarantees

- One submit lock exists per form instance.
- While lock is active:
  - Save is disabled.
  - repeated Save clicks are rejected locally (no duplicate network dispatch).
- Lock is released for success, validation failure, conflict failure, transport failure,
  and custom-submit override exceptions.

### Conflict handling UX

- Conflict errors are normalized with `conflict: true` and `refreshRequired` metadata.
- Field-level conflict instructions render a refresh hint when provided by error metadata.
- If conflict path is unavailable or hidden, error maps to canonical `__all__`.

## `ModelForm` component (ready-to-use)

`ModelForm` wraps contract loading + initial data + DynamicForm rendering in one component.

```tsx
import { ModelForm } from "@/widgets/model-form";

export function ProductCreateForm() {
  return (
    <ModelForm
      app="store"
      model="Product"
      mode="CREATE"
      behavior={{
        onSubmit: async (values) => {
          console.log(values);
        },
      }}
    />
  );
}
```

### Update/View mode with automatic initial values

```tsx
<ModelForm app="store" model="Product" mode="UPDATE" objectId="42" />
<ModelForm app="store" model="Product" mode="VIEW" objectId="42" />
```

- `UPDATE` and `VIEW` fetch `modelFormInitialData` automatically when `objectId` is provided.
- `VIEW` defaults to read-only and hides actions unless explicitly overridden.
- `modelFormInitialData` now enforces backend `view` authorization. If access is
  denied, `ModelForm` surfaces the error through `onLoadError` with
  `stage="initialData"` and renders `errorFallback` when provided.

### Nested + field/section controls

```tsx
<ModelForm
  app="store"
  model="Order"
  mode="CREATE"
  nested={{
    customer: {
      onlyFields: ["email"],
      fieldOverrides: { email: { label: "Customer Email" } },
    },
  }}
  fieldOverrides={{ name: { label: "Display Name" } }}
  sectionOverrides={{ main: { title: "Main Info" } }}
/>
```

### Relationship filters

Use `onlyRelationships` / `excludeRelationships` to control which nested
relation paths can render.
