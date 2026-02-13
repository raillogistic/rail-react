# Generated ModelForm Integration Guide

## Overview

Generated ModelForms consume backend contract queries and transform them into a
DynamicForm schema with deterministic mutation bindings and normalized errors.

## Required GraphQL operations

- `modelFormContract`
- `modelFormContractPages`
- `modelFormInitialData`

GraphQL documents live in `src/graphql/modelFormContract.ts`.

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
- `resolveModelFormSchema` in `src/lib/form/index.tsx` centralizes the generated
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
import { ModelForm } from "@/lib/form";

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

### Compatibility aliases

`ModelForm` also accepts legacy aliases:

- `appName` / `modelName` / `mutationMode` / `mutationId`
- `only` / `exclude`
- `nestedFields`
- `onlyRelationships` / `excludeRelationships`
