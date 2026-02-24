import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ModelDynamicDetail from "../components/ModelDynamicDetail";

const { apolloClientMock } = vi.hoisted(() => ({
  apolloClientMock: {
    query: vi.fn(),
    mutate: vi.fn(),
  },
}));

const useMetadataMock = vi.fn();
const fetchMetadataSnapshotMock = vi.fn();
const useModelSingleQueryMock = vi.fn();
const useModelDeleteMutationMock = vi.fn();

vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual<typeof import("@apollo/client")>(
    "@apollo/client",
  );
  return {
    ...actual,
    useApolloClient: () => apolloClientMock,
  };
});

vi.mock("@/shared/api/graphql/graphql/metadata/gateway", () => ({
  useMetadata: (...args: unknown[]) => useMetadataMock(...args),
  fetchMetadataSnapshot: (...args: unknown[]) =>
    fetchMetadataSnapshotMock(...args),
}));

vi.mock("@/shared/api/graphql/graphql/queries/hooks/useModelSingleQuery", () => ({
  useModelSingleQuery: (...args: unknown[]) => useModelSingleQueryMock(...args),
}));

vi.mock("@/shared/api/graphql/graphql/mutations/hooks/useModelDeleteMutation", () => ({
  useModelDeleteMutation: (...args: unknown[]) =>
    useModelDeleteMutationMock(...args),
}));

vi.mock("@/widgets/model-form", () => ({
  ModelForm: () => <div data-testid="model-form-mock" />,
}));

const baseMetadata = {
  app: "store",
  model: "Product",
  verboseName: "Product",
  verboseNamePlural: "Products",
  primaryKey: "id",
  fields: [
    {
      name: "id",
      fieldName: "id",
      verboseName: "ID",
      fieldType: "ID",
      graphqlType: "ID",
      required: true,
      nullable: false,
      blank: false,
      editable: false,
      unique: true,
      hasDefault: false,
      autoNow: false,
      autoNowAdd: false,
      readable: true,
      writable: false,
      visibility: "detail",
      isPrimaryKey: true,
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
      isText: false,
      isRichText: false,
      isFsmField: false,
    },
    {
      name: "name",
      fieldName: "name",
      verboseName: "Name",
      fieldType: "CharField",
      graphqlType: "String",
      required: true,
      nullable: false,
      blank: false,
      editable: true,
      unique: false,
      hasDefault: false,
      autoNow: false,
      autoNowAdd: false,
      readable: true,
      writable: true,
      visibility: "detail",
      isPrimaryKey: false,
      isIndexed: false,
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
    },
  ],
  relationships: [],
  filters: [],
  mutations: [],
  templates: [],
  permissions: {
    canList: true,
    canRetrieve: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canBulkCreate: false,
    canBulkUpdate: false,
    canBulkDelete: false,
    canExport: false,
  },
  metadataVersion: "1",
} as any;

function setupDefaultMocks(overrides?: {
  metadata?: unknown;
  queryData?: unknown;
  deleteExecute?: ReturnType<typeof vi.fn>;
}) {
  const metadata = overrides?.metadata ?? baseMetadata;
  const deleteExecute =
    overrides?.deleteExecute ??
    vi.fn().mockResolvedValue({
      data: {
        response: {
          ok: true,
          errors: [],
        },
      },
    });

  useMetadataMock.mockReturnValue({
    metadata,
    loading: false,
    error: undefined,
    refetch: vi.fn().mockResolvedValue(metadata),
  });

  fetchMetadataSnapshotMock.mockResolvedValue(null);

  useModelSingleQueryMock.mockReturnValue({
    data:
      overrides?.queryData ??
      ({
        id: "1",
        name: "Product Alpha",
        rowPermissions: {
          canUpdate: true,
          canDelete: true,
          updateReason: null,
          deleteReason: null,
        },
      } as any),
    loading: false,
    error: undefined,
    refetch: vi.fn().mockResolvedValue(null),
  });

  useModelDeleteMutationMock.mockReturnValue({
    execute: deleteExecute,
    loading: false,
  });

  return { deleteExecute };
}

describe("ModelDynamicDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apolloClientMock.mutate.mockResolvedValue({
      data: {
        response: {
          ok: true,
          errors: [],
        },
      },
      errors: [],
    });
    apolloClientMock.query.mockResolvedValue({ data: {} });
  });

  it("renders metadata-driven fields and default actions", async () => {
    setupDefaultMocks();

    render(
      <ModelDynamicDetail
        app="store"
        model="Product"
        id="1"
        baseDetail={{
          layout: {
            includeFields: ["name"],
          },
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Product Alpha")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("supports frontend permission overrides for actions", async () => {
    setupDefaultMocks();

    render(
      <ModelDynamicDetail
        app="store"
        model="Product"
        id="1"
        baseDetail={{
          actions: {
            permissions: {
              canUpdate: false,
              canDelete: false,
            },
          },
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Product Alpha")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "Update" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("renders nested to-many relation in auto table mode", async () => {
    const metadataWithRelation = {
      ...baseMetadata,
      relationships: [
        {
          name: "items",
          fieldName: "items",
          verboseName: "Items",
          helpText: "",
          relatedApp: "store",
          relatedModel: "OrderItem",
          relatedModelVerbose: "Order Item",
          relationType: "one_to_many",
          isReverse: false,
          isToOne: false,
          isToMany: true,
          required: false,
          nullable: true,
          editable: false,
          lookupField: "id",
          readable: true,
          writable: false,
          canCreateInline: false,
        },
      ],
    } as any;

    setupDefaultMocks({
      metadata: metadataWithRelation,
      queryData: {
        id: "1",
        name: "Product Alpha",
        items: [
          { id: "it-1", name: "Item A" },
          { id: "it-2", name: "Item B" },
        ],
        rowPermissions: {
          canUpdate: true,
          canDelete: true,
          updateReason: null,
          deleteReason: null,
        },
      },
    });

    fetchMetadataSnapshotMock.mockResolvedValue({
      ...baseMetadata,
      model: "OrderItem",
      fields: [
        {
          ...baseMetadata.fields[0],
          name: "id",
          fieldName: "id",
          verboseName: "ID",
        },
        {
          ...baseMetadata.fields[1],
          name: "name",
          fieldName: "name",
          verboseName: "Name",
        },
      ],
    });

    render(
      <ModelDynamicDetail
        app="store"
        model="Product"
        id="1"
        baseDetail={{
          nestedFields: {
            items: {
              mode: "auto",
            },
          },
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Item A")).toBeInTheDocument();
    });
  });

  it("executes delete mutation after confirmation", async () => {
    const user = userEvent.setup();
    const { deleteExecute } = setupDefaultMocks();

    render(
      <ModelDynamicDetail
        app="store"
        model="Product"
        id="1"
      />,
    );

    const toolbarDelete = await screen.findByRole("button", { name: "Delete" });
    await user.click(toolbarDelete);

    await waitFor(() => {
      expect(screen.getByText("Delete record?")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      expect(deleteExecute).toHaveBeenCalledWith({ id: "1" });
    });
  });

  it("shows store.Product custom action for user mkhaled when permission check passes", async () => {
    const user = userEvent.setup();

    setupDefaultMocks({
      metadata: {
        ...baseMetadata,
        mutations: [
          {
            name: "publishProduct",
            operation: "custom",
            mutationType: "custom",
            methodName: "publish_product",
            description: "Publish product",
            inputFields: [],
            allowed: true,
            requiredPermissions: ["store.publish_product"],
            action: JSON.stringify({ button_title: "Publish Product" }),
          },
        ],
      },
    });

    render(
      <ModelDynamicDetail
        app="store"
        model="Product"
        id="1"
        baseDetail={{
          runtime: {
            user: { username: "mkhaled" },
            can: (permissionKey, ctx) =>
              permissionKey === "store.publish_product" &&
              (ctx.user as { username?: string } | undefined)?.username ===
                "mkhaled",
          },
        }}
      />,
    );

    const actionsButton = await screen.findByRole("button", { name: /actions/i });
    await user.click(actionsButton);

    await waitFor(() => {
      expect(screen.getByText("Publish Product")).toBeInTheDocument();
    });
  });
});
