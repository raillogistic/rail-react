import { describe, it, expect } from "vitest";
import { buildFormSchema } from "../utils/schema-builders";
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

describe("buildFormSchema", () => {
  it("maps choice fields and relationship metadata", () => {
    const metadata = baseMetadata();
    metadata.fields = [
      {
        name: "status",
        fieldName: "status",
        verboseName: "Status",
        helpText: "",
        fieldType: "CharField",
        graphqlType: "String",
        required: true,
        nullable: false,
        blank: false,
        editable: true,
        unique: false,
        maxLength: 20,
        minLength: null,
        maxValue: null,
        minValue: null,
        decimalPlaces: null,
        maxDigits: null,
        choices: [{ value: "open", label: "Open" }],
        defaultValue: null,
        hasDefault: false,
        autoNow: false,
        autoNowAdd: false,
        validators: [],
        regexPattern: null,
        readable: true,
        writable: true,
        visibility: "VISIBLE",
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
        customMetadata: JSON.stringify({
          widget: "radio",
          placeholder: "Pick status",
          order: 2,
        }),
      },
    ];
    metadata.relationships = [
      {
        name: "assignee",
        fieldName: "assignee",
        verboseName: "Assignee",
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
        customMetadata: JSON.stringify({ inlineCreate: false }),
      },
    ];

    const schema = buildFormSchema(metadata, {}, {}, "create");

    const statusField = schema.fields.find(
      (field) => field.name === "status"
    ) as any;
    expect(statusField.type).toBe("radio");
    expect(statusField.placeholder).toBe("Pick status");
    expect(statusField.options).toEqual([{ value: "open", label: "Open" }]);
    expect(statusField.order).toBe(2);

    const assigneeField = schema.fields.find(
      (field) => field.name === "assignee"
    ) as any;
    expect(assigneeField.type).toBe("select-query");
    expect(assigneeField.multiple).toBe(false);
    expect(assigneeField.inlineCreate).toEqual({ enabled: false });
  });
});
