# GraphQL model query hooks

This guide explains how to use the generated query hooks in
`src/lib/graphql`. These hooks build GraphQL model queries from metadata or
from predefined fields, and execute them with Apollo `useQuery`.

## Overview

Use this module when you want model query generation without `ModelTableV2`.
You can choose paginated, list, or single-object modes, then customize query
names, argument signatures, selection, and variables.

```tsx
import {
  useModelPageQuery,
  useModelListQuery,
  useModelSingleQuery,
} from "@/lib/graphql";
```

## Choose a hook

Use one of the focused hooks based on the backend query you need:

- `useModelPageQuery` for page-style responses (`pageInfo` + `items`)
- `useModelListQuery` for list responses (`[Model]`)
- `useModelSingleQuery` for single-object responses

Each hook returns:

- `data`
- `loading`
- `error`
- `refetch`
- `queryDocument`
- `variables`
- `queryName`
- `metadata`, `metadataLoading`, `metadataError`

## Metadata-driven usage

In metadata-driven mode, pass `app` and `model`. The hook fetches metadata
through the metadata gateway and builds selection and argument types
automatically.

```tsx
import { useModelPageQuery } from "@/lib/graphql";

type UserRow = {
  id: string;
  username: string;
};

type UserPage = {
  items: UserRow[];
  pageInfo: {
    totalCount: number;
    pageCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export function UserPageWidget() {
  const { data, loading, error } = useModelPageQuery({
    app: "auth",
    model: "User",
    variables: {
      page: 1,
      perPage: 20,
      where: { username: { icontains: "al" } },
      orderBy: ["-id"],
      skipCount: false,
    },
  });

  const page = (data ?? null) as UserPage | null;

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error.message}</p>;
  return <p>Rows: {page?.items.length ?? 0}</p>;
}
```

## Predefined-field usage (no metadata fetch)

In predefined mode, pass `fields` (or `selection`) and set `skipMetadata: true`
to avoid metadata requests.

```tsx
import { useModelListQuery } from "@/lib/graphql";

export function UserListWidget() {
  const { data, queryName } = useModelListQuery({
    app: "auth",
    model: "User",
    skipMetadata: true,
    fields: ["id", "username", "email"],
    variables: {
      orderBy: ["username"],
    },
  });

  const rows = (data as Array<Record<string, unknown>> | null) ?? [];
  return (
    <div>
      <p>Query field: {queryName}</p>
      <p>Rows: {rows.length}</p>
    </div>
  );
}
```

> **Note:** If you set both `skipMetadata: true` and omit `fields` and
> `selection`, the hook has no source for query generation and skips execution.

## Query customization options

Use these options to align with backend generator output:

- `managerName`: appends `By<Manager>` suffix (`userPageByPublished`)
- `queryName`: hard override root query field name
- `operationName`: hard override GraphQL operation name
- `whereTypeName`: hard override where input type
- `supportsQuick`: hard override quick-search support
- `selection`: full manual selection (string or tree)
- `customArgumentDefinitions`: replace generated variable definitions
- `customArgumentAssignments`: replace generated field arguments

Example for a strict single-object backend signature:

```tsx
import { useModelSingleQuery } from "@/lib/graphql";

const { data } = useModelSingleQuery({
  app: "auth",
  model: "User",
  variables: { id: "42" },
  customArgumentDefinitions: ["$id: ID!"],
  customArgumentAssignments: ["id: $id"],
});
```

## Variable behavior

Variable builders normalize payloads before execution:

- `orderBy` is sanitized with metadata-aware naming normalization
- `quick` is included only when quick search is enabled
- non-string entries in `orderBy`, `presets`, and `distinctOn` are filtered out
- page mode applies defaults when omitted: `page=1`, `perPage=20`

## Debugging generated queries

Use `queryDocument`, `queryName`, and `variables` from hook results for quick
inspection in logs and tests.

```tsx
const result = useModelPageQuery({ app: "auth", model: "User" });
console.log(result.queryName, result.variables);
```

## Testing this module

From `rail-react`, run:

```bash
npm run test -- src/lib/graphql/__tests__ --run
```

## Next steps

- Use `ModelTableV2` when you also need UI state, columns, and toolbar behavior:
  [ModelTableV2 guide](./tablev2.md)
- Use `FilterPanel` to build complex where payloads for these hooks:
  [Filter panel guide](./filter-panel.md)
