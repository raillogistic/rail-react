# GraphQL model mutation hooks

This guide explains how to use generated mutation hooks from
`src/lib/graphql/mutations`. These hooks build mutation documents from the same
naming contract used by query hooks, expose ModelForm-ready metadata, and run
mutations with execute-time variables.

## Overview

Use this module when you need model-level GraphQL mutations without hard-coding
mutation documents. The hooks support:

- CRUD (`create`, `update`, `delete`)
- Bulk operations (`bulkCreate`, `bulkUpdate`, `bulkDelete`)
- Custom model methods (`method`)
- ModelForm metadata and initial-data hydration for create/update flows

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

## Hook return shape

Each `useModel<Operation>Mutation` hook returns mutation execution state and
ModelForm metadata on the same object.

```ts
type UseModelMutationResult = {
  data: unknown;
  rawData: Record<string, unknown> | undefined;
  loading: boolean;
  error: ApolloError | undefined;
  called: boolean;
  reset: () => void;
  execute: (
    variables: OperationVariablesInput,
    options?: ExecuteModelMutationOptions,
  ) => Promise<FetchResult>;
  mutationDocument: DocumentNode;
  mutationName: string;
  operationName: string;
  fields: ModelFormContractField[];
  permissions: ModelFormContractPermissions | null;
  mutationBindings: ModelFormMutationBindings | null;
  errorPolicy: ModelFormErrorPolicy | null;
  initialValues: Record<string, unknown> | null;
  readonlyValues: Record<string, unknown> | null;
  formLoading: boolean;
  contractLoading: boolean;
  initialDataLoading: boolean;
  formError: Error | undefined;
  contractError: Error | undefined;
  initialDataError: Error | undefined;
  refetchContract: () => Promise<ModelFormContract | null>;
  refetchInitialData: () => Promise<ModelFormInitialData | null>;
};
```

`execute` always takes variables at call time. The hook options no longer
accept `variables`.

## Create and update usage

Use create and update hooks to build form screens where metadata and execution
are managed together.

```tsx
import { useModelCreateMutation, useModelUpdateMutation } from "@/lib/graphql";

export function ProductFormActions() {
  const createMutation = useModelCreateMutation({
    identity: {
      app: "inventory",
      model: "Product",
    },
    selectionOptions: {
      selection: "id name status",
    },
  });

  const updateMutation = useModelUpdateMutation({
    identity: {
      app: "inventory",
      model: "Product",
    },
    selectionOptions: {
      selection: "id name status",
    },
    modelFormOptions: {
      objectId: "42",
    },
  });

  const onCreate = async () => {
    await createMutation.execute({
      input: { name: "Desk", status: "DRAFT" },
    });
  };

  const onUpdate = async () => {
    await updateMutation.execute({
      id: "42",
      input: { status: "ACTIVE" },
    });
  };

  return (
    <div>
      <button onClick={onCreate}>Create</button>
      <button onClick={onUpdate}>Update</button>
    </div>
  );
}
```

For update form hydration, provide `modelFormOptions.objectId` unless you pass
`modelFormOptions.initialData` directly. If `objectId` is missing, the hook
returns an explicit `initialDataError` and `formError`.

## Delete and bulk usage

Use delete and bulk hooks for entity removal and batched writes.

```tsx
import {
  useModelDeleteMutation,
  useModelBulkDeleteMutation,
} from "@/lib/graphql";

export function DeleteActions() {
  const deleteOne = useModelDeleteMutation({
    model: "Product",
    selection: "id",
  });

  const deleteMany = useModelBulkDeleteMutation({
    model: "Product",
    selection: "id",
  });

  const onDeleteOne = async () => {
    await deleteOne.execute({ id: "42" });
  };

  const onDeleteMany = async () => {
    await deleteMany.execute({ ids: ["101", "102", "103"] });
  };

  return (
    <div>
      <button onClick={onDeleteOne}>Delete one</button>
      <button onClick={onDeleteMany}>Delete many</button>
    </div>
  );
}
```

## Custom model method usage

Use `useModelMethodMutation` for generated method mutations.

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

Use grouped options to keep larger hook configuration readable.

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
  modelFormOptions: {
    objectId: "42",
    includeNested: true,
  },
});
```

Flat options remain supported for backward compatibility.

## Variable normalizers

You can normalize payloads directly with helpers from
`src/lib/graphql/mutations/variables.ts`:

- `buildModelCreateMutationVariables`
- `buildModelUpdateMutationVariables`
- `buildModelDeleteMutationVariables`
- `buildModelBulkCreateMutationVariables`
- `buildModelBulkUpdateMutationVariables`
- `buildModelBulkDeleteMutationVariables`
- `buildModelMethodMutationVariables`

Update, delete, and method normalizers require canonical `id` in the input and
map it to `identifierVariableName` when configured.

## Testing this module

From `rail-react`, run:

```bash
npm run test -- src/lib/graphql/mutations --run
```

## Next steps

- For query generation, read
  [GraphQL model query hooks](./graphql-model-query-hooks.md).
- For form rendering, read [DynamicForm guide](./dynamic-form.md).
