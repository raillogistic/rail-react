import { MockedProvider } from "@apollo/client/testing";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MODEL_DETAIL_CONTRACT_QUERY } from "@/lib/metadata/queries";

import { MODEL_DETAIL_V2_CONTRACT_FIXTURE } from "./fixtures/modelDetailV2Contract";
import { ModelDetailV2 } from "../v2";
import { buildDetailQuery } from "../v2/utils/buildDetailQuery";

const CONTRACT_VARIABLES = {
  input: {
    app: "test_app",
    model: "Product",
    objectId: "1",
  },
};

const DETAIL_RECORD_QUERY = buildDetailQuery({
  modelName: "Product",
  fields: ["id", "name", "price"],
});

const DETAIL_QUERY_MOCK = {
  request: {
    query: DETAIL_RECORD_QUERY,
    variables: {
      id: "1",
    },
  },
  result: {
    data: {
      record: {
        __typename: "Product",
        id: "1",
        name: "Desk",
        price: "499.00",
      },
    },
  },
};

const CONTRACT_QUERY_MOCK = {
  request: {
    query: MODEL_DETAIL_CONTRACT_QUERY,
    variables: CONTRACT_VARIABLES,
  },
  result: {
    data: {
      modelDetailContract: MODEL_DETAIL_V2_CONTRACT_FIXTURE,
    },
  },
};

const FALLBACK_CONTRACT_QUERY_MOCK = {
  request: {
    query: MODEL_DETAIL_CONTRACT_QUERY,
    variables: CONTRACT_VARIABLES,
  },
  result: {
    data: {
      modelDetailContract: {
        ...MODEL_DETAIL_V2_CONTRACT_FIXTURE,
        contract: {
          ...MODEL_DETAIL_V2_CONTRACT_FIXTURE.contract,
          layoutNodes: [],
        },
      },
    },
  },
};

const CATEGORY_FIELDS = [
  "id",
  "enabled",
  "payload",
  "createdAt",
  "website",
  "contactEmail",
  "brochure",
  "previewImage",
];

const CATEGORY_QUERY = buildDetailQuery({
  modelName: "Product",
  fields: CATEGORY_FIELDS,
});

const RELATION_FIELDS = ["id", "name", "category"];

const RELATION_DETAIL_QUERY = buildDetailQuery({
  modelName: "Product",
  fields: RELATION_FIELDS,
  relationSelections: {
    category: ["desc"],
  },
});

const CATEGORY_CONTRACT_QUERY_MOCK = {
  request: {
    query: MODEL_DETAIL_CONTRACT_QUERY,
    variables: CONTRACT_VARIABLES,
  },
  result: {
    data: {
      modelDetailContract: {
        ok: true,
        reason: null,
        contract: {
          appLabel: "test_app",
          modelName: "Product",
          queryRoot: "product",
          identifierArg: "id",
          layoutVersion: "v2",
          defaultIncludeFields: CATEGORY_FIELDS,
          defaultExcludeFields: [],
          metadataVersion: "fixture-v2",
          permissions: {
            modelReadable: true,
            fieldVisibility: {
              enabled: true,
              payload: true,
              createdAt: true,
              website: true,
              contactEmail: true,
              brochure: true,
              previewImage: true,
            },
            relationVisibility: {},
            actionExecutability: {},
            sourceFlags: {},
            policy: "FAIL_CLOSED",
          },
          layoutNodes: [
            {
              id: "categories",
              type: "SECTION",
              title: "Categories",
              order: 0,
              relationSourceId: null,
              visibilityRule: null,
              fields: [
                { name: "enabled", title: "Enabled", type: "BooleanField" },
                { name: "payload", title: "Payload", type: "JSONField" },
                { name: "createdAt", title: "Created", type: "DateTimeField" },
                { name: "website", title: "Website", type: "URLField" },
                { name: "contactEmail", title: "Contact", type: "EmailField" },
                { name: "brochure", title: "Brochure", type: "FileField" },
                { name: "previewImage", title: "Preview", type: "ImageField" },
              ],
              children: [],
              actions: [],
            },
          ],
          actions: [],
        },
      },
    },
  },
};

const CATEGORY_DATA_QUERY_MOCK = {
  request: {
    query: CATEGORY_QUERY,
    variables: {
      id: "1",
    },
  },
  result: {
    data: {
      record: {
        __typename: "Product",
        id: "1",
        enabled: true,
        payload: { status: "ok" },
        createdAt: "2026-02-15T10:00:00Z",
        website: "https://example.com",
        contactEmail: "ops@example.com",
        brochure: "https://example.com/brochure.pdf",
        previewImage: "https://example.com/preview.png",
      },
    },
  },
};

const RELATION_CONTRACT_QUERY_MOCK = {
  request: {
    query: MODEL_DETAIL_CONTRACT_QUERY,
    variables: CONTRACT_VARIABLES,
  },
  result: {
    data: {
      modelDetailContract: {
        ok: true,
        reason: null,
        contract: {
          appLabel: "test_app",
          modelName: "Product",
          queryRoot: "product",
          identifierArg: "id",
          layoutVersion: "v2",
          defaultIncludeFields: RELATION_FIELDS,
          defaultExcludeFields: [],
          metadataVersion: "fixture-relation-v1",
          permissions: {
            modelReadable: true,
            fieldVisibility: {
              id: true,
              name: true,
              category: true,
            },
            relationVisibility: {
              category: true,
            },
            actionExecutability: {},
            sourceFlags: {},
            policy: "FAIL_CLOSED",
          },
          layoutNodes: [
            {
              id: "primary",
              type: "SECTION",
              title: "Product",
              order: 0,
              relationSourceId: null,
              visibilityRule: null,
              fields: [
                { name: "name", title: "Name", type: "CharField" },
                { name: "category", title: "Category", type: "RelationField" },
              ],
              children: [],
              actions: [],
            },
          ],
          relationDataSources: [
            {
              id: "category",
              relationName: "category",
              relatedApp: "test_app",
              relatedModel: "Category",
              direction: "FORWARD",
              mode: "SECTION",
              loadStrategy: "PRIMARY",
              queryName: "categoryPage",
              lookupField: "id",
              pagination: null,
              cacheKey: "test_app.Product:category",
            },
          ],
          actions: [],
        },
      },
    },
  },
};

const RELATION_DATA_QUERY_MOCK = {
  request: {
    query: RELATION_DETAIL_QUERY,
    variables: {
      id: "1",
    },
  },
  result: {
    data: {
      record: {
        __typename: "Product",
        id: "1",
        name: "Desk",
        category: {
          __typename: "Category",
          desc: "Office",
        },
      },
    },
  },
};

describe("ModelDetailV2 integration scaffold", () => {
  it("mounts with contract + detail query flow", async () => {
    render(
      <MockedProvider mocks={[CONTRACT_QUERY_MOCK, DETAIL_QUERY_MOCK]}>
        <ModelDetailV2 appName="test_app" modelName="Product" id="1" />
      </MockedProvider>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Product").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("Desk").length).toBeGreaterThan(0);
    expect(screen.getAllByText("499.00").length).toBeGreaterThan(0);
  });

  it("renders denied state when contract fails", async () => {
    const deniedMock = {
      request: {
        query: MODEL_DETAIL_CONTRACT_QUERY,
        variables: CONTRACT_VARIABLES,
      },
      result: {
        data: {
          modelDetailContract: {
            ok: false,
            reason: "Access denied",
            contract: null,
          },
        },
      },
    };

    render(
      <MockedProvider mocks={[deniedMock]}>
        <ModelDetailV2 appName="test_app" modelName="Product" id="1" />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Access denied");
    });
  });

  it("falls back to auto layout when contract has no layoutNodes", async () => {
    render(
      <MockedProvider mocks={[FALLBACK_CONTRACT_QUERY_MOCK, DETAIL_QUERY_MOCK]}>
        <ModelDetailV2 appName="test_app" modelName="Product" id="1" />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Product").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("Desk").length).toBeGreaterThan(0);
  });

  it("renders default field categories", async () => {
    render(
      <MockedProvider
        mocks={[CATEGORY_CONTRACT_QUERY_MOCK, CATEGORY_DATA_QUERY_MOCK]}
      >
        <ModelDetailV2 appName="test_app" modelName="Product" id="1" />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Categories")).toBeInTheDocument();
    });
    screen
      .getAllByTestId(/detail-section-toggle-/)
      .forEach((toggle) => fireEvent.click(toggle));

    expect(screen.getAllByText("Yes").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/status/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2026/).length).toBeGreaterThan(0);
    expect(
      screen
        .getAllByRole("link", { name: "https://example.com" })
        .some((link) => link.getAttribute("href") === "https://example.com"),
    ).toBe(true);
    expect(
      screen
        .getAllByRole("link", { name: "ops@example.com" })
        .some((link) => link.getAttribute("href") === "mailto:ops@example.com"),
    ).toBe(true);
    expect(
      screen
        .getAllByRole("link", { name: "Download file" })
        .some((link) => link.getAttribute("href") === "https://example.com/brochure.pdf"),
    ).toBe(true);
    expect(screen.getAllByAltText("Preview").length).toBeGreaterThan(0);
  });

  it("fetches to-one relation fields using desc and renders the related label", async () => {
    render(
      <MockedProvider
        mocks={[RELATION_CONTRACT_QUERY_MOCK, RELATION_DATA_QUERY_MOCK]}
      >
        <ModelDetailV2 appName="test_app" modelName="Product" id="1" />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Product").length).toBeGreaterThan(0);
    });

    screen
      .getAllByTestId(/detail-section-toggle-/)
      .forEach((toggle) => fireEvent.click(toggle));
    expect(screen.getAllByText("Desk").length).toBeGreaterThan(0);
    expect(screen.getByText("Office")).toBeInTheDocument();
  });
});
