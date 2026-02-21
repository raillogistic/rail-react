# GraphQL model mutation hooks

This guide explains how to use the generated mutation hooks in
`src/lib/graphql/mutations`. These hooks build GraphQL model mutations from a
shared naming contract, normalize variables, and execute with Apollo
`useMutation`.

## Overview

Use this module when you want model mutation generation without coupling to
`ModelForm` or `ModelTableV2`. You can generate CRUD, bulk, and custom model
method mutations with consistent operation naming and response parsing.

```tsx
import {
  useModelCreateMutation,
  useModelUpdateMutation,
  useModelDeleteMutation,
  useModelBulkCreateMutation,
  useModelBulkUpdateMutation,
  useModelBulkDeleteMutation,
  useModelMethodMutation,
} from "@/lib/graphql";
```

## Choose a hook

Use one focused hook based on the backend mutation you need:

- `useModelCreateMutation`
- `useModelUpdateMutation`
- `useModelDeleteMutation`
- `useModelBulkCreateMutation`
- `useModelBulkUpdateMutation`
- `useModelBulkDeleteMutation`
- `useModelMethodMutation`

Each hook returns:

- `data`
- `rawData`
- `loading`
- `error`
- `called`
- `reset`
- `execute`
- `mutationDocument`
- `mutationName`
- `operationName`

## CRUD usage

Use create, update, and delete hooks with model-based defaults.

```tsx
import {
  useModelCreateMutation,
  useModelUpdateMutation,
  useModelDeleteMutation,
} from "@/lib/graphql";

export function ProductActions() {
  const createMutation = useModelCreateMutation({
    model: "Product",
    selection: "id name status",
    variables: { input: { name: "Desk", status: "DRAFT" } },
  });

  const updateMutation = useModelUpdateMutation({
    model: "Product",
    selection: "id name status",
    variables: { id: "42", input: { status: "ACTIVE" } },
  });

  const deleteMutation = useModelDeleteMutation({
    model: "Product",
    selection: "id",
  });

  const onCreate = async () => {
    await createMutation.execute();
  };

  const onUpdate = async () => {
    await updateMutation.execute();
  };

  const onDelete = async () => {
    await deleteMutation.execute({ id: "42" });
  };

  return (
    <div>
      <button onClick={onCreate}>Create</button>
      <button onClick={onUpdate}>Update</button>
      <button onClick={onDelete}>Delete</button>
    </div>
  );
}
```

## Bulk usage

Use bulk hooks for batched create, update, and delete mutations.

```tsx
import { useModelBulkDeleteMutation } from "@/lib/graphql";

export function BulkDeleteProductsButton() {
  const mutation = useModelBulkDeleteMutation({
    model: "Product",
    selection: "id",
  });

  const onBulkDelete = async () => {
    await mutation.execute({ ids: ["101", "102", "103"] });
  };

  return <button onClick={onBulkDelete}>Bulk delete</button>;
}
```

## Custom method usage

Use `useModelMethodMutation` for model method mutations (`<method><Model>`
naming contract).

```tsx
import { useModelMethodMutation } from "@/lib/graphql";

export function DatasetPreviewButton() {
  const mutation = useModelMethodMutation({
    model: "ReportingDataset",
    methodName: "run_query",
    includeInput: true,
    resultSelection: "preview sql",
  });

  const onPreview = async () => {
    await mutation.execute({
      id: "42",
      input: {
        query: "SELECT * FROM sales LIMIT 5",
      },
    });
  };

  return <button onClick={onPreview}>Preview</button>;
}
```

## Grouped options

The hooks support grouped options and backward-compatible flat options.
Grouped options make larger mutation configs easier to read.

```tsx
import { useModelUpdateMutation } from "@/lib/graphql";

const mutation = useModelUpdateMutation({
  identity: {
    app: "inventory",
    model: "Product",
  },
  selectionOptions: {
    selection: "id name status",
  },
  executionOptions: {
    operationName: "updateProductRecord",
    mutationName: "updateProduct",
    identifierVariableName: "pk",
    identifierArgumentName: "id",
    identifierType: "UUID!",
  },
});
```

## Naming and customization options

By default, generated names follow the backend contract:

- `create<Model>`
- `update<Model>`
- `delete<Model>`
- `bulkCreate<Model>`
- `bulkUpdate<Model>`
- `bulkDelete<Model>`
- `<method><Model>`

Use execution options to customize generated documents:

- `operationName`
- `mutationName`
- `responseAlias`
- `identifierVariableName`
- `identifierArgumentName`
- `identifierType`
- `inputTypeName`
- `bulkInputTypeName`
- `methodFieldName`
- `customArgumentDefinitions`
- `customArgumentAssignments`

> **Note:** `app` is optional and is ignored for mutation operation naming.

## Builder-only usage

Use the document builder directly when you need generated documents outside the
hooks.

```tsx
import { gql, useMutation } from "@apollo/client";
import { buildModelMutationDocument } from "@/lib/graphql";

const built = buildModelMutationDocument({
  mode: "create",
  model: "Product",
  selection: "id name",
});

const [mutate] = useMutation(built.mutationDocument);
```

## Variable normalizers

You can build normalized variable payloads directly:

- `buildModelCreateMutationVariables`
- `buildModelUpdateMutationVariables`
- `buildModelDeleteMutationVariables`
- `buildModelBulkCreateMutationVariables`
- `buildModelBulkUpdateMutationVariables`
- `buildModelBulkDeleteMutationVariables`
- `buildModelMethodMutationVariables`

These helpers apply consistent identifier mapping (`id` vs custom identifier)
and merge `extra` payload fields when provided.

## Testing this module

From `rail-react`, run:

```bash
npm run test -- src/lib/graphql/mutations --run
```

## Next steps

- Use generated query hooks for list/page/single reads:
  [GraphQL model query hooks](./graphql-model-query-hooks.md)
- Use generated model form workflows for mutation orchestration:
  [DynamicForm guide](./dynamic-form.md)
