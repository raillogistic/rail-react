import type { ModelFormContract } from "../../types/generatedContract";
import { allNestedRelationFixtures } from "./nestedRelationPayloads";

export const sampleModelFormContract: ModelFormContract = {
 id: "test_app.Product.CREATE",
 appLabel: "test_app",
 modelName: "Product",
 mode: "CREATE",
 version: "1",
 configVersion: "abc123",
 generatedAt: "2026-02-12T12:00:00Z",
 fields: [
 {
 name: "name",
 path: "name",
 fieldName: "name",
 label: "Name",
 kind: "TEXT",
 graphqlType: "String",
 pythonType: "str",
 required: true,
 nullable: false,
 readOnly: false,
 hidden: false,
 defaultValue: "",
 constraints: { max_length: 120 },
 validators: [{ type: "MaxLengthValidator", params: { limit_value: 120 } }],
 ui: { placeholder: "Product name" },
 metadata: null,
 },
 {
 name: "price",
 path: "price",
 fieldName: "price",
 label: "Price",
 kind: "DECIMAL",
 graphqlType: "Float",
 pythonType: "Decimal",
 required: true,
 nullable: false,
 readOnly: false,
 hidden: false,
 defaultValue: null,
 constraints: { min_value: 0 },
 validators: [],
 ui: { step: 0.01 },
 metadata: null,
 },
 ],
 sections: [
 {
 id: "main",
 title: "Main",
 description: null,
 fieldPaths: ["name", "price"],
 order: 0,
 layout: null,
 visible: true,
 },
 ],
 relations: [],
 permissions: {
 canCreate: true,
 canUpdate: true,
 canDelete: true,
 canView: true,
 create: {
 allowed: true,
 requiredPermissions: [],
 requiresAuthentication: false,
 reason: null,
 },
 update: {
 allowed: true,
 requiredPermissions: [],
 requiresAuthentication: false,
 reason: null,
 },
 delete: {
 allowed: true,
 requiredPermissions: [],
 requiresAuthentication: false,
 reason: null,
 },
 view: {
 allowed: true,
 requiredPermissions: [],
 requiresAuthentication: false,
 reason: null,
 },
 fieldPermissions: [
 {
 field: "name",
 canRead: true,
 canWrite: true,
 visibility: "VISIBLE",
 },
 {
 field: "price",
 canRead: true,
 canWrite: true,
 visibility: "VISIBLE",
 },
 ],
 },
 mutationBindings: {
 createOperation: "createProduct",
 updateOperation: "updateProduct",
 bulkCreateOperation: "bulkCreateProduct",
 bulkUpdateOperation: "bulkUpdateProduct",
 updateIdentifierKey: "objectId",
 updateTargetPolicy: "PRIMARY_KEY_ONLY",
 bulkCommitPolicy: "ATOMIC",
 conflictPolicy: "REJECT_STALE",
 },
 errorPolicy: {
 canonicalFormErrorKey: "__all__",
 fieldPathNotation: "dot",
 bulkRowPrefixPattern: "items.<row>.<field>",
 },
};

export const sampleModelFormContractWithRelations: ModelFormContract = {
 ...sampleModelFormContract,
 id: "test_app.Product.UPDATE",
 mode: "UPDATE",
 relations: allNestedRelationFixtures,
};

export const sampleCreateSubmitBindings = {
 createOperation: "createProduct",
 updateOperation: "updateProduct",
 defaultIdentifierKey: "objectId",
 formErrorKey: "__all__",
};

export const sampleUpdateSubmitBindings = {
 ...sampleCreateSubmitBindings,
 updateIdentifierKey: "sku",
};
