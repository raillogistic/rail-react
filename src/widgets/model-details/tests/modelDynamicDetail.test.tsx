import * as React from "react";
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
let latestModelFormProps: Record<string, unknown> | null = null;

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
  ModelForm: (props: Record<string, unknown>) => {
    latestModelFormProps = props;
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [submitOutcome, setSubmitOutcome] = React.useState<
      { ok: boolean; conflict: boolean; errorCount: number } | null
    >(null);
    const actions = props.actions as
      | {
          extra?:
            | React.ReactNode
            | ((ctx: {
                form: unknown;
                isSubmitting: boolean;
                canSubmit: boolean;
                submitOutcome?: {
                  ok: boolean;
                  conflict: boolean;
                  errorCount: number;
                } | null;
              }) => React.ReactNode);
        }
      | undefined;
    const renderedExtra =
      typeof actions?.extra === "function"
        ? actions.extra({
            form: {},
            isSubmitting,
            canSubmit: true,
            submitOutcome,
          })
        : actions?.extra;

    return (
      <div data-testid="model-form-mock">
        <button
          type="button"
          data-testid="model-form-submit-success-mock"
          onClick={() => {
            setIsSubmitting(true);
            setSubmitOutcome(null);
            setTimeout(() => {
              setIsSubmitting(false);
              setSubmitOutcome({ ok: true, conflict: false, errorCount: 0 });
            }, 0);
          }}
        >
          Submit success mock
        </button>
        {renderedExtra}
      </div>
    );
  },
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
  const metadataRefetch = vi.fn().mockResolvedValue(metadata);
  const queryRefetch = vi.fn().mockResolvedValue(null);
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
    refetch: metadataRefetch,
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
    refetch: queryRefetch,
  });

  useModelDeleteMutationMock.mockReturnValue({
    execute: deleteExecute,
    loading: false,
  });

  return { deleteExecute, metadataRefetch, queryRefetch };
}

describe("ModelDynamicDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    latestModelFormProps = null;
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
    expect(useModelSingleQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        app: "store",
        model: "Product",
        id: "1",
        selectionOptions: expect.objectContaining({
          includeRowPermissions: true,
        }),
      }),
    );
  });

  it("keeps built-in actions hidden until backend row permissions are resolved", async () => {
    setupDefaultMocks({
      queryData: {
        id: "1",
        name: "Product Alpha",
      },
    });

    render(<ModelDynamicDetail app="store" model="Product" id="1" />);

    await waitFor(() => {
      expect(screen.getByText("Product Alpha")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "Update" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
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

  it("sorts nested object fields by field.order and forwards nested section host id", async () => {
    const metadataWithProfileRelation = {
      ...baseMetadata,
      relationships: [
        {
          name: "profile",
          fieldName: "profile",
          verboseName: "Profile",
          helpText: "",
          relatedApp: "store",
          relatedModel: "Profile",
          relatedModelVerbose: "Profile",
          relationType: "one_to_one",
          isReverse: false,
          isToOne: true,
          isToMany: false,
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
      metadata: metadataWithProfileRelation,
      queryData: {
        id: "1",
        name: "Product Alpha",
        profile: {
          firstName: "Ada",
          lastName: "Lovelace",
        },
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
      model: "Profile",
      fields: [
        {
          ...baseMetadata.fields[0],
          name: "id",
          fieldName: "id",
          verboseName: "ID",
        },
        {
          ...baseMetadata.fields[1],
          name: "firstName",
          fieldName: "firstName",
          verboseName: "First Name",
        },
        {
          ...baseMetadata.fields[1],
          name: "lastName",
          fieldName: "lastName",
          verboseName: "Last Name",
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
            profile: {
              mode: "object",
              fields: [
                {
                  path: "lastName",
                  order: 2,
                  render: (ctx) => (
                    <span>{`nested:${String(ctx.value)}:${ctx.sectionId}:${ctx.field.sectionId ?? ""}`}</span>
                  ),
                },
                {
                  path: "firstName",
                  order: 1,
                  render: (ctx) => (
                    <span>{`nested:${String(ctx.value)}:${ctx.sectionId}:${ctx.field.sectionId ?? ""}`}</span>
                  ),
                },
              ],
            },
          },
        }}
      />,
    );

    const firstNameField = await screen.findByText(
      "nested:Ada:nested:profile:nested:profile",
    );
    const lastNameField = await screen.findByText(
      "nested:Lovelace:nested:profile:nested:profile",
    );

    expect(
      firstNameField.compareDocumentPosition(lastNameField) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("supports nested sectionId override with per-field sectionId override", async () => {
    const metadataWithProfileRelation = {
      ...baseMetadata,
      relationships: [
        {
          name: "profile",
          fieldName: "profile",
          verboseName: "Profile",
          helpText: "",
          relatedApp: "store",
          relatedModel: "Profile",
          relatedModelVerbose: "Profile",
          relationType: "one_to_one",
          isReverse: false,
          isToOne: true,
          isToMany: false,
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
      metadata: metadataWithProfileRelation,
      queryData: {
        id: "1",
        name: "Product Alpha",
        profile: {
          firstName: "Ada",
          lastName: "Lovelace",
        },
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
      model: "Profile",
      fields: [
        {
          ...baseMetadata.fields[0],
          name: "id",
          fieldName: "id",
          verboseName: "ID",
        },
        {
          ...baseMetadata.fields[1],
          name: "firstName",
          fieldName: "firstName",
          verboseName: "First Name",
        },
        {
          ...baseMetadata.fields[1],
          name: "lastName",
          fieldName: "lastName",
          verboseName: "Last Name",
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
            profile: {
              sectionId: "host:profile",
              mode: "object",
              fields: [
                {
                  path: "firstName",
                  render: (ctx) => <span>{`ctx:${ctx.sectionId}`}</span>,
                },
                {
                  path: "lastName",
                  sectionId: "host:profile:last-name",
                  render: (ctx) => <span>{`ctx:${ctx.sectionId}`}</span>,
                },
              ],
            },
          },
        }}
      />,
    );

    expect(await screen.findByText("ctx:host:profile")).toBeInTheDocument();
    expect(
      await screen.findByText("ctx:host:profile:last-name"),
    ).toBeInTheDocument();
  });

  it("renders nested sections after the main details section", async () => {
    const metadataWithProfileRelation = {
      ...baseMetadata,
      relationships: [
        {
          name: "profile",
          fieldName: "profile",
          verboseName: "Profile",
          helpText: "",
          relatedApp: "store",
          relatedModel: "Profile",
          relatedModelVerbose: "Profile",
          relationType: "one_to_one",
          isReverse: false,
          isToOne: true,
          isToMany: false,
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
      metadata: metadataWithProfileRelation,
      queryData: {
        id: "1",
        name: "Primary-Detail-Value",
        profile: {
          firstName: "Nested-After-Main",
        },
        rowPermissions: {
          canUpdate: false,
          canDelete: false,
          updateReason: null,
          deleteReason: null,
        },
      },
    });

    fetchMetadataSnapshotMock.mockResolvedValue({
      ...baseMetadata,
      model: "Profile",
      fields: [
        {
          ...baseMetadata.fields[0],
          name: "id",
          fieldName: "id",
          verboseName: "ID",
        },
        {
          ...baseMetadata.fields[1],
          name: "firstName",
          fieldName: "firstName",
          verboseName: "First Name",
        },
      ],
    });

    render(
      <ModelDynamicDetail
        app="store"
        model="Product"
        id="1"
        baseDetail={{
          header: {
            title: () => "",
          },
          actions: {
            showUpdate: false,
            showDelete: false,
            showTemplates: false,
            showCustomMutations: false,
          },
          layout: {
            includeFields: ["name"],
          },
          nestedFields: {
            profile: {
              order: -100,
              mode: "object",
              fields: ["firstName"],
            },
          },
        }}
      />,
    );

    const mainField = await screen.findByText("Primary-Detail-Value");
    const nestedField = await screen.findByText("Nested-After-Main");
    const pageText = document.body.textContent ?? "";

    expect(mainField).toBeInTheDocument();
    expect(nestedField).toBeInTheDocument();
    expect(pageText.indexOf("Primary-Detail-Value")).toBeLessThan(
      pageText.indexOf("Nested-After-Main"),
    );
  });

  it("routes layout and custom sections into tabs with body fallback for unknown tabId", async () => {
    const user = userEvent.setup();
    setupDefaultMocks({
      queryData: {
        id: "1",
        name: "Product Alpha",
        rowPermissions: {
          canUpdate: false,
          canDelete: false,
          updateReason: null,
          deleteReason: null,
        },
      },
    });

    render(
      <ModelDynamicDetail
        app="store"
        model="Product"
        id="1"
        baseDetail={{
          header: {
            title: () => "",
          },
          actions: {
            showUpdate: false,
            showDelete: false,
            showTemplates: false,
            showCustomMutations: false,
          },
          layout: {
            tabs: [
              { id: "overview", title: "Overview" },
              { id: "extra", title: "Extra" },
            ],
            includeUnassignedFields: false,
            sections: [
              {
                id: "main-grid",
                tabId: "overview",
                columns: 2,
                rows: [{ fields: ["name"] }],
              },
            ],
            customSections: [
              {
                id: "extra-custom",
                tabId: "extra",
                render: () => <div>Custom Extra Content</div>,
              },
              {
                id: "fallback-custom",
                tabId: "missing-tab",
                render: () => <div>Fallback Body Content</div>,
              },
            ],
          },
        }}
      />,
    );

    expect(screen.queryByText("Custom Extra Content")).toBeNull();
    expect(await screen.findByText("Fallback Body Content")).toBeVisible();
    expect(await screen.findByText("Product Alpha")).toBeVisible();

    await user.click(screen.getByRole("tab", { name: "Extra" }));
    const extraContent = await screen.findByText("Custom Extra Content");
    await waitFor(() => {
      expect(extraContent).toBeVisible();
    });
  });

  it("routes nested sections into configured tab", async () => {
    const user = userEvent.setup();
    const metadataWithProfileRelation = {
      ...baseMetadata,
      relationships: [
        {
          name: "profile",
          fieldName: "profile",
          verboseName: "Profile",
          helpText: "",
          relatedApp: "store",
          relatedModel: "Profile",
          relatedModelVerbose: "Profile",
          relationType: "one_to_one",
          isReverse: false,
          isToOne: true,
          isToMany: false,
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
      metadata: metadataWithProfileRelation,
      queryData: {
        id: "1",
        name: "Product Alpha",
        profile: {
          firstName: "NestedTabValue",
        },
        rowPermissions: {
          canUpdate: false,
          canDelete: false,
          updateReason: null,
          deleteReason: null,
        },
      },
    });

    fetchMetadataSnapshotMock.mockResolvedValue({
      ...baseMetadata,
      model: "Profile",
      fields: [
        {
          ...baseMetadata.fields[0],
          name: "id",
          fieldName: "id",
          verboseName: "ID",
        },
        {
          ...baseMetadata.fields[1],
          name: "firstName",
          fieldName: "firstName",
          verboseName: "First Name",
        },
      ],
    });

    render(
      <ModelDynamicDetail
        app="store"
        model="Product"
        id="1"
        baseDetail={{
          header: {
            title: () => "",
          },
          actions: {
            showUpdate: false,
            showDelete: false,
            showTemplates: false,
            showCustomMutations: false,
          },
          layout: {
            tabs: [
              { id: "overview", title: "Overview" },
              { id: "relations", title: "Relations" },
            ],
            includeUnassignedFields: false,
            sections: [
              {
                id: "main-grid",
                tabId: "overview",
                rows: [{ fields: ["name"] }],
              },
            ],
          },
          nestedFields: {
            profile: {
              tabId: "relations",
              mode: "object",
              fields: ["firstName"],
            },
          },
        }}
      />,
    );

    expect(screen.queryByText("NestedTabValue")).toBeNull();

    await user.click(screen.getByRole("tab", { name: "Relations" }));
    const nestedValue = await screen.findByText("NestedTabValue");
    await waitFor(() => {
      expect(nestedValue).toBeVisible();
    });
  });

  it("forwards tab view controls to DynamicDetail", async () => {
    const user = userEvent.setup();
    const onActiveTabChange = vi.fn();
    setupDefaultMocks({
      queryData: {
        id: "1",
        name: "Product Alpha",
        rowPermissions: {
          canUpdate: false,
          canDelete: false,
          updateReason: null,
          deleteReason: null,
        },
      },
    });

    render(
      <ModelDynamicDetail
        app="store"
        model="Product"
        id="1"
        baseDetail={{
          header: {
            title: () => "",
          },
          actions: {
            showUpdate: false,
            showDelete: false,
            showTemplates: false,
            showCustomMutations: false,
          },
          view: {
            initialTabId: "extra",
            onActiveTabChange,
          },
          layout: {
            tabs: [
              { id: "overview", title: "Overview" },
              { id: "extra", title: "Extra" },
            ],
            includeUnassignedFields: false,
            customSections: [
              {
                id: "overview-content",
                tabId: "overview",
                render: () => <div>Overview Tab Content</div>,
              },
              {
                id: "extra-content",
                tabId: "extra",
                render: () => <div>Extra Tab Content</div>,
              },
            ],
          },
        }}
      />,
    );

    const extraContent = await screen.findByText("Extra Tab Content");
    expect(extraContent).toBeVisible();
    expect(screen.queryByText("Overview Tab Content")).toBeNull();

    await user.click(screen.getByRole("tab", { name: "Overview" }));
    const overviewContent = await screen.findByText("Overview Tab Content");
    await waitFor(() => {
      expect(overviewContent).toBeVisible();
      expect(onActiveTabChange).toHaveBeenCalledWith("overview");
    });
  });

  it("applies section container spans declared in layout sections", async () => {
    setupDefaultMocks({
      queryData: {
        id: "1",
        name: "Product Alpha",
        rowPermissions: {
          canUpdate: false,
          canDelete: false,
          updateReason: null,
          deleteReason: null,
        },
      },
    });

    render(
      <ModelDynamicDetail
        app="store"
        model="Product"
        id="1"
        baseDetail={{
          header: {
            title: () => "",
          },
          actions: {
            showUpdate: false,
            showDelete: false,
            showTemplates: false,
            showCustomMutations: false,
          },
          view: {
            sectionColumns: 6,
          },
          layout: {
            includeUnassignedFields: false,
            sections: [
              {
                id: "summary",
                containerSpan: { base: 1, xxl: 4 },
                rows: [{ fields: ["name"] }],
              },
              {
                id: "audit",
                containerSpan: { base: 1, xxl: 2 },
                rows: [{ fields: ["id"] }],
              },
            ],
          },
        }}
      />,
    );

    await screen.findByText("Product Alpha");
    const summarySection = screen.getByTestId("section-layout:summary");
    const auditSection = screen.getByTestId("section-layout:audit");

    expect(summarySection.className).toContain("col-span-1");
    expect(summarySection.className).toContain("2xl:col-span-4");
    expect(auditSection.className).toContain("col-span-1");
    expect(auditSection.className).toContain("2xl:col-span-2");
  });

  it("defaults update dialog form layout variant to popup", async () => {
    const user = userEvent.setup();
    setupDefaultMocks();

    render(<ModelDynamicDetail app="store" model="Product" id="1" />);

    const updateButton = document
      .querySelector("button .lucide-pencil")
      ?.closest("button");
    expect(updateButton).toBeTruthy();
    await user.click(updateButton as HTMLButtonElement);

    await waitFor(() => {
      expect(screen.getByTestId("model-form-mock")).toBeInTheDocument();
    });

    const layout = latestModelFormProps?.layout as
      | { variant?: string }
      | undefined;
    expect(layout?.variant).toBe("popup");
  });

  it("preserves popup variant from update formProps layout when direct layout omits variant", async () => {
    const user = userEvent.setup();
    setupDefaultMocks();

    render(
      <ModelDynamicDetail
        app="store"
        model="Product"
        id="1"
        baseDetail={{
          actions: {
            updateForm: {
              modelFormProps: {
                formProps: {
                  layout: {
                    variant: "popup",
                    columns: 1,
                  },
                },
                layout: {
                  columns: 2,
                  variant: undefined as unknown as "default",
                },
              },
            },
          },
        }}
      />,
    );

    const updateButton = document
      .querySelector("button .lucide-pencil")
      ?.closest("button");
    expect(updateButton).toBeTruthy();
    await user.click(updateButton as HTMLButtonElement);

    await waitFor(() => {
      expect(screen.getByTestId("model-form-mock")).toBeInTheDocument();
    });

    const layout = latestModelFormProps?.layout as
      | { variant?: string; columns?: number }
      | undefined;
    expect(layout?.variant).toBe("popup");
    expect(layout?.columns).toBe(2);
  });

  it("does not refetch detail data when opening the update action", async () => {
    const user = userEvent.setup();
    const { metadataRefetch, queryRefetch } = setupDefaultMocks();

    render(<ModelDynamicDetail app="store" model="Product" id="1" />);

    const updateButton = document
      .querySelector("button .lucide-pencil")
      ?.closest("button");
    expect(updateButton).toBeTruthy();
    await user.click(updateButton as HTMLButtonElement);

    await waitFor(() => {
      expect(screen.getByTestId("model-form-mock")).toBeInTheDocument();
    });

    expect(metadataRefetch).not.toHaveBeenCalled();
    expect(queryRefetch).not.toHaveBeenCalled();
  });

  it("refetches detail data after successful update submit by default", async () => {
    const user = userEvent.setup();
    const { metadataRefetch, queryRefetch } = setupDefaultMocks();

    render(<ModelDynamicDetail app="store" model="Product" id="1" />);

    const updateButton = document
      .querySelector("button .lucide-pencil")
      ?.closest("button");
    expect(updateButton).toBeTruthy();
    await user.click(updateButton as HTMLButtonElement);

    await waitFor(() => {
      expect(screen.getByTestId("model-form-mock")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("model-form-submit-success-mock"));

    await waitFor(() => {
      expect(metadataRefetch).toHaveBeenCalled();
      expect(queryRefetch).toHaveBeenCalled();
    });
  });

  it("supports disabling refetch after successful update submit", async () => {
    const user = userEvent.setup();
    const { metadataRefetch, queryRefetch } = setupDefaultMocks();

    render(
      <ModelDynamicDetail
        app="store"
        model="Product"
        id="1"
        baseDetail={{
          actions: {
            updateForm: {
              refetchOnSubmitSuccess: false,
            },
          },
        }}
      />,
    );

    const updateButton = document
      .querySelector("button .lucide-pencil")
      ?.closest("button");
    expect(updateButton).toBeTruthy();
    await user.click(updateButton as HTMLButtonElement);

    await waitFor(() => {
      expect(screen.getByTestId("model-form-mock")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("model-form-submit-success-mock"));

    await waitFor(() => {
      expect(metadataRefetch).not.toHaveBeenCalled();
      expect(queryRefetch).not.toHaveBeenCalled();
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

    const actionsButton = document
      .querySelector("button .lucide-zap")
      ?.closest("button");
    expect(actionsButton).toBeTruthy();
    await user.click(actionsButton as HTMLButtonElement);

    await waitFor(() => {
      expect(screen.getByText("Publish Product")).toBeInTheDocument();
    });
  });

  it("hides Actions dropdown when no custom mutation is enabled", async () => {
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
            allowed: false,
            requiredPermissions: ["store.publish_product"],
            reason: "Disabled by backend",
            action: JSON.stringify({ button_title: "Publish Product" }),
          },
        ],
      },
    });

    render(<ModelDynamicDetail app="store" model="Product" id="1" />);

    await waitFor(() => {
      expect(screen.getByText("Product Alpha")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /actions/i })).toBeNull();
  });

  it("keeps custom mutation enabled when backend allows it and runtime permission source is absent", async () => {
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
      />,
    );

    const actionsButton = document
      .querySelector("button .lucide-zap")
      ?.closest("button");
    expect(actionsButton).toBeTruthy();
    await user.click(actionsButton as HTMLButtonElement);

    const publishItem = await screen.findByRole("menuitem", {
      name: "Publish Product",
    });
    expect(publishItem).toBeEnabled();
  });

  it("does not refetch detail data after custom action mutation success", async () => {
    const user = userEvent.setup();
    const { metadataRefetch, queryRefetch } = setupDefaultMocks({
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

    render(<ModelDynamicDetail app="store" model="Product" id="1" />);

    const actionsButton = document
      .querySelector("button .lucide-zap")
      ?.closest("button");
    expect(actionsButton).toBeTruthy();
    await user.click(actionsButton as HTMLButtonElement);

    const publishItem = await screen.findByRole("menuitem", {
      name: "Publish Product",
    });
    await user.click(publishItem);

    const confirmButton = await screen.findByRole("button", {
      name: /confirm/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(apolloClientMock.mutate).toHaveBeenCalled();
    });

    expect(metadataRefetch).not.toHaveBeenCalled();
    expect(queryRefetch).not.toHaveBeenCalled();
  });

  it("renders header title from name by default", async () => {
    setupDefaultMocks({
      queryData: {
        id: "1",
        name: "Product Alpha",
        desc: "Default header description",
        rowPermissions: {
          canUpdate: true,
          canDelete: true,
          updateReason: null,
          deleteReason: null,
        },
      },
    });

    render(<ModelDynamicDetail app="store" model="Product" id="1" />);

    await waitFor(() => {
      expect(screen.getByText("Product Alpha")).toBeInTheDocument();
      expect(screen.getByText("Default header description")).toBeInTheDocument();
    });
  });

  it("renders header title from title fallback when name is missing", async () => {
    setupDefaultMocks({
      queryData: {
        id: "1",
        title: "Fallback Title",
        description: "Fallback description",
        rowPermissions: {
          canUpdate: true,
          canDelete: true,
          updateReason: null,
          deleteReason: null,
        },
      },
    });

    render(<ModelDynamicDetail app="store" model="Product" id="1" />);

    await waitFor(() => {
      expect(screen.getByText("Fallback Title")).toBeInTheDocument();
      expect(screen.getByText("Fallback description")).toBeInTheDocument();
    });
  });

  it("renders custom header actions sorted by position and receives refetch", async () => {
    const user = userEvent.setup();
    const { metadataRefetch, queryRefetch } = setupDefaultMocks({
      queryData: {
        id: "1",
        name: "Product Alpha",
        desc: "Header",
        rowPermissions: {
          canUpdate: false,
          canDelete: false,
          updateReason: null,
          deleteReason: null,
        },
      },
    });

    render(
      <ModelDynamicDetail
        app="store"
        model="Product"
        id="1"
        baseDetail={{
          actions: {
            showUpdate: false,
            showDelete: false,
            showTemplates: false,
            showCustomMutations: false,
          },
          header: {
            actions: () => [
              {
                position: 2,
                render: (props) => (
                  <button type="button" onClick={() => void props.refetch()}>
                    B Action
                  </button>
                ),
              },
              {
                position: 0,
                render: () => <button type="button">A Action</button>,
              },
            ],
          },
        }}
      />,
    );

    const customButtons = await screen.findAllByRole("button");
    const buttonNames = customButtons.map((button) => button.textContent ?? "");
    expect(buttonNames.indexOf("A Action")).toBeLessThan(
      buttonNames.indexOf("B Action"),
    );

    await user.click(screen.getByRole("button", { name: "B Action" }));
    await waitFor(() => {
      expect(metadataRefetch).toHaveBeenCalled();
      expect(queryRefetch).toHaveBeenCalled();
    });
  });

  it("forwards DynamicDetail header frame props", async () => {
    setupDefaultMocks();

    render(
      <ModelDynamicDetail
        app="store"
        model="Product"
        id="1"
        baseDetail={{
          header: {
            frame: {
              title: "Header Frame",
              description: "Frame description",
              testId: "custom-header-frame",
            },
          },
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByTestId("custom-header-frame").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("Header Frame")).toBeInTheDocument();
    expect(screen.getByText("Frame description")).toBeInTheDocument();
  });

  it("supports header.frame.description resolver returning React element", async () => {
    setupDefaultMocks({
      queryData: {
        id: "1",
        name: "Product Alpha",
        desc: "ignored",
        rowPermissions: {
          canUpdate: true,
          canDelete: true,
          updateReason: null,
          deleteReason: null,
        },
      },
    });

    render(
      <ModelDynamicDetail
        app="store"
        model="Product"
        id="1"
        baseDetail={{
          header: {
            frame: {
              description: (data) => <span>{String(data?.name ?? "")} description</span>,
            },
          },
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Product Alpha description")).toBeInTheDocument();
    });
  });
});
