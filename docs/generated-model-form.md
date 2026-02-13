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
4. Resolve mutation operations from `mutationBindings` with
   `resolveGeneratedMutationOperation`.
5. Normalize mutation errors with `normalizeGeneratedMutationErrors` and map
   bulk errors to `items.<row>.<field>`.

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
