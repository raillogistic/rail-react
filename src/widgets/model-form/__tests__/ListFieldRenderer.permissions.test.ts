import { describe, expect, it } from "vitest";

import type { ListFieldConfig } from "../types/schema";
import {
 isRelationActionAllowed,
 shouldDisableDeleteForItem,
} from "../renderers/ListFieldRenderer";

function buildListConfig(meta?: Record<string, unknown>): ListFieldConfig {
 return {
 name: "tags",
 type: "list",
 label: "Tags",
 fields: [],
 ...(meta ? { meta } : {}),
 };
}

describe("ListFieldRenderer relation permission helpers", () => {
 it("allows actions when relation policy metadata is absent", () => {
 const config = buildListConfig();
 expect(isRelationActionAllowed(config, "DELETE")).toBe(true);
 });

 it("denies delete when action is missing from allowedActions", () => {
 const config = buildListConfig({
 relationPolicy: {
 allowedActions: ["CONNECT", "SET"],
 blockedActions: [],
 },
 });
 expect(isRelationActionAllowed(config, "DELETE")).toBe(false);
 });

 it("denies delete when blockedActions explicitly contains DELETE", () => {
 const config = buildListConfig({
 relationPolicy: {
 allowedActions: [],
 blockedActions: ["delete"],
 },
 });
 expect(isRelationActionAllowed(config, "DELETE")).toBe(false);
 });

 it("disables delete button only for persisted rows with direct delete config", () => {
 const config = buildListConfig({
 relationPolicy: {
 allowedActions: ["CONNECT", "SET"],
 blockedActions: [],
 },
 });

 expect(
 shouldDisableDeleteForItem(config, {
 identity: "VGFnOjE=",
 hasDirectDeleteConfig: true,
 }),
 ).toBe(true);

 expect(
 shouldDisableDeleteForItem(config, {
 identity: null,
 hasDirectDeleteConfig: true,
 }),
 ).toBe(false);

 expect(
 shouldDisableDeleteForItem(config, {
 identity: "VGFnOjE=",
 hasDirectDeleteConfig: false,
 }),
 ).toBe(false);
 });
});
