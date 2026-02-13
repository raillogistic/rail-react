import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useGeneratedModelForm } from "../hooks/useGeneratedModelForm";
import type {
  ModelFormContract,
  ModelFormInitialData,
} from "../types/generatedContract";
import { sampleModelFormContract } from "./fixtures/modelFormContract";

describe("useGeneratedModelForm adapter", () => {
  it("maps contract fields and sections to DynamicForm schema", () => {
    const { result } = renderHook(() =>
      useGeneratedModelForm({
        generatedEnabled: true,
        contract: sampleModelFormContract,
        initialData: {
          appLabel: "test_app",
          modelName: "Product",
          objectId: "1",
          values: { name: "Starter", price: 10 },
          loadedAt: "2026-02-12T12:00:00Z",
        },
      }),
    );

    expect(result.current.usingGenerated).toBe(true);
    expect(result.current.schema.sections?.[0]?.id).toBe("main");
    expect(result.current.schema.sections?.[0]?.fields.map((f) => f.name)).toEqual([
      "name",
      "price",
    ]);
    expect(result.current.initialValues.name).toBe("Starter");
  });

  it("applies runtime object-path overrides before submission", () => {
    const { result } = renderHook(() =>
      useGeneratedModelForm({
        generatedEnabled: true,
        contract: sampleModelFormContract,
        runtimeOverrides: [
          { path: "price", value: 42, action: "REPLACE" },
          { path: "meta.flags", value: { reviewed: true }, action: "MERGE" },
        ],
      }),
    );

    const submission = result.current.buildSubmissionValues({
      name: "Starter",
      price: 10,
      meta: { flags: { draft: true } },
    });
    expect(submission.price).toBe(42);
    expect(submission.meta.flags).toEqual({ draft: true, reviewed: true });
  });

  it("hides non-editable fields from generated schema", () => {
    const contract = {
      ...sampleModelFormContract,
      fields: [
        sampleModelFormContract.fields[0],
        {
          ...sampleModelFormContract.fields[1],
          path: "sku",
          fieldName: "sku",
          label: "SKU",
          readOnly: true,
        },
      ],
      sections: [
        {
          ...sampleModelFormContract.sections[0],
          fieldPaths: ["name", "sku"],
        },
      ],
    };

    const { result } = renderHook(() =>
      useGeneratedModelForm({
        generatedEnabled: true,
        contract,
      }),
    );

    expect(result.current.schema.sections?.[0]?.fields.map((f) => f.name)).toEqual([
      "name",
    ]);
  });

  it("hides identifier field even when backend marks it editable", () => {
    const contract = {
      ...sampleModelFormContract,
      fields: [
        {
          ...sampleModelFormContract.fields[0],
          path: "id",
          fieldName: "id",
          label: "ID",
          readOnly: false,
          hidden: false,
        },
        {
          ...sampleModelFormContract.fields[1],
          path: "name",
          fieldName: "name",
          label: "Name",
        },
      ],
      sections: [
        {
          ...sampleModelFormContract.sections[0],
          fieldPaths: ["id", "name"],
        },
      ],
    };

    const { result } = renderHook(() =>
      useGeneratedModelForm({
        generatedEnabled: true,
        contract,
      }),
    );

    expect(result.current.schema.sections?.[0]?.fields.map((f) => f.name)).toEqual([
      "name",
    ]);
  });

  it("parses JSONString contract payloads and initial values", () => {
    const contract: ModelFormContract = {
      ...sampleModelFormContract,
      fields: [
        {
          ...sampleModelFormContract.fields[0],
          kind: "CHOICE",
          ui: JSON.stringify({ placeholder: "Choose value" }) as unknown as Record<
            string,
            unknown
          >,
          metadata: JSON.stringify({
            choices: [
              { label: "A", value: "A" },
              { label: "B", value: "B" },
            ],
          }) as unknown as Record<string, unknown>,
          defaultValue: JSON.stringify("A") as unknown,
        },
      ],
      sections: [
        {
          ...sampleModelFormContract.sections[0],
          fieldPaths: [sampleModelFormContract.fields[0].path],
        },
      ],
    };

    const initialData: ModelFormInitialData = {
      appLabel: "test_app",
      modelName: "Product",
      objectId: "1",
      values: JSON.stringify({ name: "From JSON" }) as unknown as Record<
        string,
        unknown
      >,
      loadedAt: "2026-02-12T12:00:00Z",
    };

    const { result } = renderHook(() =>
      useGeneratedModelForm({
        generatedEnabled: true,
        contract,
        initialData,
      }),
    );

    const field = result.current.schema.sections?.[0]?.fields[0] as {
      inputProps?: { placeholder?: string };
      options?: unknown[];
      defaultValue?: unknown;
    };
    expect(field.inputProps?.placeholder).toBe("Choose value");
    expect(field.options).toEqual([
      { label: "A", value: "A" },
      { label: "B", value: "B" },
    ]);
    expect(field.defaultValue).toBe("A");
    expect(result.current.initialValues.name).toBe("From JSON");
  });

  it("maps camelCase initial values to snake_case contract paths", () => {
    const contract: ModelFormContract = {
      ...sampleModelFormContract,
      fields: [
        {
          ...sampleModelFormContract.fields[0],
          path: "inventory_count",
          fieldName: "inventory_count",
          kind: "NUMBER",
          defaultValue: null,
        },
      ],
      sections: [
        {
          ...sampleModelFormContract.sections[0],
          fieldPaths: ["inventory_count"],
        },
      ],
    };

    const initialData: ModelFormInitialData = {
      appLabel: "test_app",
      modelName: "Product",
      objectId: "1",
      values: JSON.stringify({ inventoryCount: 12 }) as unknown as Record<
        string,
        unknown
      >,
      loadedAt: "2026-02-12T12:00:00Z",
    };

    const { result } = renderHook(() =>
      useGeneratedModelForm({
        generatedEnabled: true,
        contract,
        initialData,
      }),
    );

    expect(result.current.initialValues.inventory_count).toBe(12);
    expect(result.current.schema.initialValues?.inventory_count).toBe(12);
  });
});
