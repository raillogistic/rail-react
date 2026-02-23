import { describe, expect, it } from "vitest";
import type {
  ModelFormContract,
  ModelFormInitialData,
} from "@/widgets/model-form/types/generatedContract";
import {
  buildModelSectionData,
  type ModelSectionEnginePlugin,
} from "../modelSection";

function createContract(): ModelFormContract {
  return {
    id: "contract-order",
    appLabel: "store",
    modelName: "Order",
    mode: "UPDATE",
    version: "1",
    configVersion: "1",
    generatedAt: "2026-02-17T00:00:00Z",
    fields: [
      {
        name: "status",
        path: "status",
        fieldName: "status",
        label: "Status",
        kind: "CHOICE",
        graphqlType: "String",
        pythonType: "str",
        required: true,
        nullable: false,
        readOnly: false,
        hidden: false,
        validators: [],
        constraints: null,
        metadata: null,
        readable: true,
        writable: true,
        visibility: "VISIBLE",
      },
      {
        name: "name",
        path: "name",
        fieldName: "name",
        label: "Name",
        kind: "TEXT",
        graphqlType: "String",
        pythonType: "str",
        required: false,
        nullable: true,
        readOnly: false,
        hidden: false,
        validators: [],
        constraints: null,
        metadata: null,
        readable: true,
        writable: true,
        visibility: "VISIBLE",
      },
    ],
    sections: [
      {
        id: "identity",
        title: "Identity",
        description: null,
        fieldPaths: ["status", "name"],
        order: 1,
        layout: null,
        visible: true,
      },
    ],
    relations: [
      {
        name: "customer",
        path: "customer",
        label: "Customer",
        relationType: "FOREIGN_KEY",
        toMany: false,
        relatedAppLabel: "crm",
        relatedModelName: "Customer",
        readable: true,
        writable: true,
        policy: {
          path: "customer",
          allowedActions: ["CONNECT"],
          blockedActions: [],
          nestedEnabled: false,
        },
        nestedForm: null,
      },
      {
        name: "tags",
        path: "tags",
        label: "Tags",
        relationType: "MANY_TO_MANY",
        toMany: true,
        relatedAppLabel: "store",
        relatedModelName: "Tag",
        readable: true,
        writable: true,
        policy: {
          path: "tags",
          allowedActions: ["CONNECT"],
          blockedActions: [],
          nestedEnabled: false,
        },
        nestedForm: null,
      },
    ],
    permissions: null,
    mutationBindings: {
      createOperation: "createOrder",
      updateOperation: "updateOrder",
      bulkCreateOperation: "bulkCreateOrder",
      bulkUpdateOperation: "bulkUpdateOrder",
      updateIdentifierKey: "id",
      updateTargetPolicy: "PRIMARY_KEY_ONLY",
      bulkCommitPolicy: "ATOMIC",
      conflictPolicy: "REJECT_STALE",
    },
    errorPolicy: {
      canonicalFormErrorKey: "__all__",
      fieldPathNotation: "dot",
      bulkRowPrefixPattern: "rows[{index}]",
    },
  };
}

function createInitialData(): ModelFormInitialData {
  return {
    appLabel: "store",
    modelName: "Order",
    objectId: "42",
    loadedAt: "2026-02-17T00:00:00Z",
    values: {
      status: "PENDING",
      name: "Order-42",
      customer: {
        id: "c-1",
        desc: "ACME Industries",
      },
      tags: [
        { id: "t-1", desc: "Urgent" },
        { id: "t-2", name: "VIP" },
      ],
    },
  };
}

describe("modelSection engine", () => {
  it("maps relation labels using desc-first strategy by default", () => {
    const result = buildModelSectionData({
      contract: createContract(),
      initialData: createInitialData(),
      ctx: {
        appLabel: "store",
        modelName: "Order",
        objectId: "42",
        runtime: { entityId: "42" },
      },
    });

    const customerField = result.allFields.find((field) => field.id === "customer");
    expect(customerField?.kind).toBe("entityRef");
    expect((customerField?.value as { label?: string } | undefined)?.label).toBe(
      "ACME Industries",
    );

    const tagsField = result.allFields.find((field) => field.id === "tags");
    expect(tagsField?.kind).toBe("tags");
    expect(tagsField?.value).toEqual(["Urgent", "VIP"]);
  });

  it("applies manifest sections and field overrides for low-code composition", () => {
    const result = buildModelSectionData({
      contract: createContract(),
      initialData: createInitialData(),
      manifest: {
        sections: [
          {
            id: "main",
            title: "Main",
            columns: 3,
            fields: ["status", { path: "name", label: "Display Name" }],
          },
        ],
        includeUnassignedFields: false,
      },
      ctx: {
        appLabel: "store",
        modelName: "Order",
        objectId: "42",
        runtime: { entityId: "42" },
      },
    });

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].id).toBe("main");
    expect(result.groups[0].fields.map((field) => String(field.label))).toEqual([
      "Status",
      "Display Name",
    ]);
    expect(result.groups[0].columns).toBe(3);
    expect(result.allFields).toHaveLength(2);
  });

  it("allows plugin override for field mapping before default behavior", () => {
    const statusPlugin: ModelSectionEnginePlugin = {
      name: "status-as-badge",
      mapCandidate(candidate) {
        if (candidate.path !== "status") return undefined;
        return {
          id: "status",
          label: "Status",
          kind: "status",
          value: candidate.value,
        };
      },
    };

    const result = buildModelSectionData({
      contract: createContract(),
      initialData: createInitialData(),
      manifest: {
        include: ["status"],
        includeUnassignedFields: false,
      },
      plugins: [statusPlugin],
      ctx: {
        appLabel: "store",
        modelName: "Order",
        objectId: "42",
        runtime: { entityId: "42" },
      },
    });

    expect(result.allFields).toHaveLength(1);
    expect(result.allFields[0].kind).toBe("status");
  });
});
