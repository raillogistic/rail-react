/**
 * Integration tests for DynamicFilterForm with mock GraphQL
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";
import { DynamicFilterForm } from "../..";
import type { FilterFormState } from "../..";

// Mock GraphQL queries
const MOCK_MODEL_SCHEMA_QUERY = `
  query GetModelSchema($app: String!, $model: String!) {
    modelSchema(app: $app, model: $model) {
      app
      model
      verboseName
      fields {
        name
        verboseName
        fieldType
        graphqlType
      }
    }
  }
`;

const MOCK_FILTER_SCHEMA_QUERY = `
  query GetFilterSchema($app: String!, $model: String!) {
    filterSchema(app: $app, model: $model) {
      fieldName
      fieldLabel
      baseType
      availableOperators
    }
  }
`;

const mockModelSchemaResponse = {
  modelSchema: {
    app: "store",
    model: "Product",
    verboseName: "Product",
    verboseNamePlural: "Products",
    fields: [
      {
        name: "name",
        verboseName: "Name",
        fieldType: "CharField",
        graphqlType: "String",
        isRelation: false,
      },
      {
        name: "price",
        verboseName: "Price",
        fieldType: "DecimalField",
        graphqlType: "Float",
        isRelation: false,
      },
    ],
    filterConfig: {
      inputTypeName: "ProductWhereInput",
      supportsAnd: true,
      supportsOr: true,
      supportsNot: true,
      presets: [
        {
          name: "active",
          description: "Active products",
          filterJson: '{"status":{"eq":"active"}}',
        },
      ],
    },
  },
};

const mockFilterSchemaResponse = {
  filterSchema: [
    {
      fieldName: "name",
      fieldLabel: "Name",
      baseType: "String",
      availableOperators: ["eq", "contains"],
      options: [
        { name: "eq", label: "Equals", graphqlType: "String", isList: false },
        { name: "contains", label: "Contains", graphqlType: "String", isList: false },
      ],
    },
    {
      fieldName: "price",
      fieldLabel: "Price",
      baseType: "Number",
      availableOperators: ["eq", "gte", "lte"],
      options: [
        { name: "eq", label: "Equals", graphqlType: "Float", isList: false },
        { name: "gte", label: ">=", graphqlType: "Float", isList: false },
        { name: "lte", label: "<=", graphqlType: "Float", isList: false },
      ],
    },
  ],
};

const mocks = [
  {
    request: {
      query: MOCK_MODEL_SCHEMA_QUERY,
      variables: { app: "store", model: "Product" },
    },
    result: {
      data: mockModelSchemaResponse,
    },
  },
  {
    request: {
      query: MOCK_FILTER_SCHEMA_QUERY,
      variables: { app: "store", model: "Product" },
    },
    result: {
      data: mockFilterSchemaResponse,
    },
  },
];

describe("DynamicFilterForm Integration Tests", () => {
  const defaultProps = {
    app: "store",
    model: "Product",
    onFiltersChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial loading", () => {
    it("should show loading state while fetching schemas", () => {
      render(
        <MockedProvider mocks={mocks}>
          <DynamicFilterForm {...defaultProps} />
        </MockedProvider>
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it("should render form after schemas load", async () => {
      render(
        <MockedProvider mocks={mocks}>
          <DynamicFilterForm {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add condition/i })).toBeInTheDocument();
      });
    });

    it("should show error state on schema fetch failure", async () => {
      const errorMocks = [
        {
          request: {
            query: MOCK_MODEL_SCHEMA_QUERY,
            variables: { app: "store", model: "Product" },
          },
          error: new Error("Network error"),
        },
      ];

      render(
        <MockedProvider mocks={errorMocks}>
          <DynamicFilterForm {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/error loading schema/i)).toBeInTheDocument();
      });
    });
  });

  describe("adding conditions", () => {
    it("should add a condition when field is selected", async () => {
      const user = userEvent.setup();
      const onFiltersChange = vi.fn();

      render(
        <MockedProvider mocks={mocks} >
          <DynamicFilterForm {...defaultProps} onFiltersChange={onFiltersChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add condition/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /add condition/i }));
      await user.click(screen.getByText("Name"));

      await waitFor(() => {
        expect(screen.getByLabelText(/operator/i)).toBeInTheDocument();
      });
    });

    it("should call onFiltersChange when condition value is entered", async () => {
      const user = userEvent.setup();
      const onFiltersChange = vi.fn();

      render(
        <MockedProvider mocks={mocks} >
          <DynamicFilterForm {...defaultProps} onFiltersChange={onFiltersChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add condition/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /add condition/i }));
      await user.click(screen.getByText("Name"));

      const valueInput = screen.getByRole("textbox", { name: /value/i });
      await user.type(valueInput, "Test Product");

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            root: expect.objectContaining({
              conditions: expect.arrayContaining([
                expect.objectContaining({
                  fieldName: "name",
                  value: "Test Product",
                }),
              ]),
            }),
          })
        );
      });
    });
  });

  describe("preset selection", () => {
    it("should display available presets", async () => {
      render(
        <MockedProvider mocks={mocks} >
          <DynamicFilterForm {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /presets/i })).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /presets/i }));

      expect(screen.getByText("active")).toBeInTheDocument();
    });

    it("should apply preset when selected", async () => {
      const user = userEvent.setup();
      const onFiltersChange = vi.fn();

      render(
        <MockedProvider mocks={mocks} >
          <DynamicFilterForm {...defaultProps} onFiltersChange={onFiltersChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /presets/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /presets/i }));
      await user.click(screen.getByText("active"));

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            selectedPresets: ["static_active"],
          })
        );
      });
    });
  });

  describe("complex filter building", () => {
    it("should build AND filter with multiple conditions", async () => {
      const user = userEvent.setup();
      const onFiltersChange = vi.fn();

      render(
        <MockedProvider mocks={mocks} >
          <DynamicFilterForm {...defaultProps} onFiltersChange={onFiltersChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add condition/i })).toBeInTheDocument();
      });

      // Add first condition
      await user.click(screen.getByRole("button", { name: /add condition/i }));
      await user.click(screen.getByText("Name"));
      const nameInput = screen.getByRole("textbox", { name: /value/i });
      await user.type(nameInput, "Product A");

      // Add second condition
      await user.click(screen.getByRole("button", { name: /add condition/i }));
      await user.click(screen.getByText("Price"));
      const priceInput = screen.getByRole("spinbutton", { name: /value/i });
      await user.type(priceInput, "100");

      await waitFor(() => {
        const lastCall = onFiltersChange.mock.calls[onFiltersChange.mock.calls.length - 1][0];
        expect(lastCall.root.conditions).toHaveLength(2);
        expect(lastCall.root.logic).toBe("AND");
      });
    });

    it("should toggle logic from AND to OR", async () => {
      const user = userEvent.setup();
      const onFiltersChange = vi.fn();

      render(
        <MockedProvider mocks={mocks} >
          <DynamicFilterForm {...defaultProps} onFiltersChange={onFiltersChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add condition/i })).toBeInTheDocument();
      });

      // Change logic to OR
      const logicSelector = screen.getByRole("combobox", { name: /logic/i });
      await user.click(logicSelector);
      await user.click(screen.getByRole("option", { name: /or/i }));

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            root: expect.objectContaining({
              logic: "OR",
            }),
          })
        );
      });
    });

    it("should add nested group", async () => {
      const user = userEvent.setup();
      const onFiltersChange = vi.fn();

      render(
        <MockedProvider mocks={mocks} >
          <DynamicFilterForm {...defaultProps} onFiltersChange={onFiltersChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add group/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /add group/i }));

      await waitFor(() => {
        const lastCall = onFiltersChange.mock.calls[onFiltersChange.mock.calls.length - 1][0];
        expect(lastCall.root.conditions).toHaveLength(1);
        expect(lastCall.root.conditions[0].type).toBe("group");
      });
    });
  });

  describe("query generation", () => {
    it("should generate valid GraphQL query", async () => {
      const user = userEvent.setup();

      render(
        <MockedProvider mocks={mocks} >
          <DynamicFilterForm {...defaultProps} showQueryBuilder />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add condition/i })).toBeInTheDocument();
      });

      // Add condition
      await user.click(screen.getByRole("button", { name: /add condition/i }));
      await user.click(screen.getByText("Name"));
      const valueInput = screen.getByRole("textbox", { name: /value/i });
      await user.type(valueInput, "Test");

      // View generated query
      await user.click(screen.getByRole("button", { name: /view query/i }));

      await waitFor(() => {
        expect(screen.getByText(/query ProductList/i)).toBeInTheDocument();
        expect(screen.getByText(/where:/i)).toBeInTheDocument();
      });
    });

    it("should copy query to clipboard", async () => {
      const user = userEvent.setup();
      const mockClipboard = vi.fn();
      Object.assign(navigator, {
        clipboard: {
          writeText: mockClipboard,
        },
      });

      render(
        <MockedProvider mocks={mocks} >
          <DynamicFilterForm {...defaultProps} showQueryBuilder />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add condition/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /view query/i }));
      await user.click(screen.getByRole("button", { name: /copy/i }));

      expect(mockClipboard).toHaveBeenCalled();
    });
  });

  describe("saved filters", () => {
    it("should save current filter", async () => {
      const user = userEvent.setup();
      const onSaveFilter = vi.fn();

      render(
        <MockedProvider mocks={mocks} >
          <DynamicFilterForm {...defaultProps} onSaveFilter={onSaveFilter} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add condition/i })).toBeInTheDocument();
      });

      // Add a condition first
      await user.click(screen.getByRole("button", { name: /add condition/i }));
      await user.click(screen.getByText("Name"));
      const valueInput = screen.getByRole("textbox", { name: /value/i });
      await user.type(valueInput, "Test");

      // Save filter
      await user.click(screen.getByRole("button", { name: /save filter/i }));
      
      const nameInput = screen.getByRole("textbox", { name: /filter name/i });
      await user.type(nameInput, "My Filter");
      
      await user.click(screen.getByRole("button", { name: /save/i }));

      expect(onSaveFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "My Filter",
          filterJson: expect.any(Object),
        })
      );
    });
  });

  describe("validation", () => {
    it("should show validation errors for empty required values", async () => {
      const user = userEvent.setup();

      render(
        <MockedProvider mocks={mocks} >
          <DynamicFilterForm {...defaultProps} validateOnBlur />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add condition/i })).toBeInTheDocument();
      });

      // Add condition but leave value empty
      await user.click(screen.getByRole("button", { name: /add condition/i }));
      await user.click(screen.getByText("Name"));

      const valueInput = screen.getByRole("textbox", { name: /value/i });
      await user.click(valueInput);
      await user.tab(); // Blur the input

      await waitFor(() => {
        expect(screen.getByText(/value is required/i)).toBeInTheDocument();
      });
    });
  });

  describe("initial filters", () => {
    it("should initialize with provided filter state", async () => {
      const initialState: FilterFormState = {
        root: {
          id: "root",
          type: "group",
          logic: "AND",
          conditions: [
            {
              id: "c1",
              type: "condition",
              fieldPath: ["name"],
              fieldName: "name",
              operator: "contains",
              value: "Initial Value",
            },
          ],
          negated: false,
        },
        selectedPresets: [],
        distinctOn: [],
        orderBy: [],
      };

      render(
        <MockedProvider mocks={mocks} >
          <DynamicFilterForm {...defaultProps} initialFilters={initialState} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("Initial Value")).toBeInTheDocument();
      });
    });
  });
});
