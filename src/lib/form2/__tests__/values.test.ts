import { describe, it, expect } from "vitest";
import { normalizeRelationshipInputValues } from "../utils/values";
import type { FormMetadata } from "../types";

const baseMetadata = (): FormMetadata => ({
  app: "core",
  model: "Task",
  verboseName: "Task",
  verboseNamePlural: "Tasks",
  primaryKey: "id",
  ordering: [],
  uniqueTogether: [],
  fields: [],
  relationships: [],
  filters: [],
  mutations: [],
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
});

describe("normalizeRelationshipInputValues", () => {
  it("normalizes to-many values for update", () => {
    const metadata = baseMetadata();
    metadata.relationships = [
      {
        name: "tags",
        fieldName: "tags",
        verboseName: "Tags",
        helpText: "",
        relatedApp: "core",
        relatedModel: "Tag",
        relatedModelVerbose: "Tag",
        relationType: "MANY_TO_MANY",
        isReverse: false,
        isToOne: false,
        isToMany: true,
        onDelete: null,
        relatedName: null,
        throughModel: null,
        required: false,
        nullable: true,
        editable: true,
        lookupField: "__str__",
        searchFields: [],
        readable: true,
        writable: true,
        canCreateInline: true,
      },
    ];

    const result = normalizeRelationshipInputValues(
      { tags: [1, { id: "2" }, { name: "New Tag" }] },
      metadata,
      "update"
    );

    expect(result.tags).toEqual({
      set: [1, "2"],
      create: [{ name: "New Tag" }],
    });
  });

  it("normalizes to-one values for create", () => {
    const metadata = baseMetadata();
    metadata.relationships = [
      {
        name: "owner",
        fieldName: "owner",
        verboseName: "Owner",
        helpText: "",
        relatedApp: "auth",
        relatedModel: "User",
        relatedModelVerbose: "User",
        relationType: "FOREIGN_KEY",
        isReverse: false,
        isToOne: true,
        isToMany: false,
        onDelete: null,
        relatedName: null,
        throughModel: null,
        required: false,
        nullable: true,
        editable: true,
        lookupField: "__str__",
        searchFields: [],
        readable: true,
        writable: true,
        canCreateInline: true,
      },
    ];

    const result = normalizeRelationshipInputValues(
      { owner: { id: "7", name: "Ada" } },
      metadata,
      "create"
    );

    expect(result.owner).toEqual({ connect: "7" });
  });
});
