import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TableProvider } from "../../context/TableContext";
import { useTableFilters } from "../../hooks/useTableFilters";
import { ColumnFilter } from "../ColumnFilter";
import type { ModelSchema } from "../../types";

let mockMetadata: ModelSchema | null = null;

vi.mock("../../context/MetadataContext", () => ({
  useMetadata: () => ({
    metadata: mockMetadata,
    app: "auth",
    model: "User",
  }),
}));

function FilterStateProbe() {
  const { advancedFilters } = useTableFilters();
  return <pre data-testid="filters">{JSON.stringify(advancedFilters)}</pre>;
}

const metadata = {
  app: "auth",
  model: "User",
  verboseName: "User",
  verboseNamePlural: "Users",
  primaryKey: "id",
  ordering: ["username"],
  permissions: {
    canList: true,
    canRetrieve: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canBulkCreate: false,
    canBulkUpdate: false,
    canBulkDelete: false,
    canExport: true,
  },
  filters: [
    {
      name: "username",
      fieldName: "username",
      fieldLabel: "Username",
      baseType: "String",
      isNested: false,
      options: [
        {
          name: "username__icontains",
          lookup: "icontains",
          label: "Contains",
          isList: false,
        },
      ],
      filterInputType: "StringFilter",
      availableOperators: ["icontains"],
      defaultOperator: "icontains",
    },
  ],
  fields: [
    {
      name: "username",
      fieldName: "username",
      verboseName: "Username",
      helpText: "Required",
      fieldType: "CharField",
      graphqlType: "String",
      required: true,
      nullable: false,
      blank: false,
      editable: true,
      unique: true,
      hasDefault: false,
      autoNow: false,
      autoNowAdd: false,
      isPrimaryKey: false,
      isIndexed: true,
      isRelation: false,
      isComputed: false,
      isFile: false,
      isImage: false,
      isJson: false,
      isDate: false,
      isDatetime: false,
      isNumeric: false,
      isBoolean: false,
      isText: true,
      isRichText: false,
      isFsmField: false,
      readable: true,
      writable: true,
      visibility: "list",
      validators: [],
      choices: null,
    },
  ],
  relationships: [],
  relationFilters: [],
  filterConfig: {
    style: "nested",
    argumentName: "where",
    inputTypeName: "UserWhereInput",
    supportsAnd: true,
    supportsOr: true,
    supportsNot: true,
    dualModeEnabled: false,
    supportsFts: false,
    supportsAggregation: false,
  },
  mutations: [],
  metadataVersion: "1",
} as unknown as ModelSchema;

describe("ColumnFilter", () => {
  beforeEach(() => {
    mockMetadata = metadata;
  });

  it("still applies a single-field filter via the shared resolver", async () => {
    const user = userEvent.setup();

    render(
      <TableProvider>
        <ColumnFilter columnId="username" />
        <FilterStateProbe />
      </TableProvider>,
    );

    await user.click(screen.getByRole("button", { name: /filter username/i }));
    await user.type(screen.getByRole("textbox"), "alice");
    await user.click(screen.getByRole("button", { name: /appliquer/i }));

    await waitFor(() => {
      expect(screen.getByTestId("filters").textContent).toContain("alice");
      expect(screen.getByTestId("filters").textContent).toContain("icontains");
      expect(screen.getByTestId("filters").textContent).toContain("username");
    });
  });
});
