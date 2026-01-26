/**
 * Unit tests for filter state helpers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createInitialFilterState,
  generateId,
  countConditions,
  cloneFilterGroup,
  findItemById,
  removeItemById,
  updateItemById,
  validateFilterState,
} from "../state";
import type { FilterGroup, FilterCondition, FilterFormState } from "../types";

describe("state helpers", () => {
  describe("generateId", () => {
    it("should generate unique IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });

    it("should generate IDs with expected prefix", () => {
      const id = generateId();
      expect(id).toMatch(/^f_[a-z0-9]+_[a-z0-9]+$/);
    });
  });

  describe("createInitialFilterState", () => {
    it("should create empty filter state with default values", () => {
      const state = createInitialFilterState();

      expect(state).toHaveProperty("root");
      expect(state.root.type).toBe("group");
      expect(state.root.logic).toBe("AND");
      expect(state.root.conditions).toEqual([]);
      expect(state.root.negated).toBe(false);
      expect(state.selectedPresets).toEqual([]);
      expect(state.distinctOn).toEqual([]);
      expect(state.orderBy).toEqual([]);
    });

    it("should generate unique root ID each time", () => {
      const state1 = createInitialFilterState();
      const state2 = createInitialFilterState();
      expect(state1.root.id).not.toBe(state2.root.id);
    });
  });

  describe("countConditions", () => {
    it("should return 0 for empty group", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [],
        negated: false,
      };
      expect(countConditions(group)).toBe(0);
    });

    it("should count conditions with values", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "test" },
          { id: "c2", type: "condition", fieldPath: ["status"], fieldName: "status", operator: "eq", value: "active" },
        ],
        negated: false,
      };
      expect(countConditions(group)).toBe(2);
    });

    it("should not count conditions without values", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "test" },
          { id: "c2", type: "condition", fieldPath: ["status"], fieldName: "status", operator: "eq", value: undefined },
          { id: "c3", type: "condition", fieldPath: ["type"], fieldName: "type", operator: "eq", value: "" },
          { id: "c4", type: "condition", fieldPath: ["tags"], fieldName: "tags", operator: "in", value: [] },
          { id: "c5", type: "condition", fieldPath: ["desc"], fieldName: "desc", operator: "eq", value: null },
        ],
        negated: false,
      };
      expect(countConditions(group)).toBe(1);
    });

    it("should count nested group conditions", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "test" },
          {
            id: "g2",
            type: "group",
            logic: "OR",
            conditions: [
              { id: "c2", type: "condition", fieldPath: ["status"], fieldName: "status", operator: "eq", value: "active" },
              { id: "c3", type: "condition", fieldPath: ["type"], fieldName: "type", operator: "eq", value: "product" },
            ],
            negated: false,
          },
        ],
        negated: false,
      };
      expect(countConditions(group)).toBe(3);
    });
  });

  describe("cloneFilterGroup", () => {
    it("should create a deep copy", () => {
      const original: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "test" },
        ],
        negated: false,
      };

      const cloned = cloneFilterGroup(original);

      // Should be equal but not same reference
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.conditions).not.toBe(original.conditions);
      expect(cloned.conditions[0]).not.toBe(original.conditions[0]);
    });

    it("should clone nested groups", () => {
      const original: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          {
            id: "g2",
            type: "group",
            logic: "OR",
            conditions: [
              { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "test" },
            ],
            negated: true,
          },
        ],
        negated: false,
      };

      const cloned = cloneFilterGroup(original);
      const nestedOriginal = original.conditions[0] as FilterGroup;
      const nestedCloned = cloned.conditions[0] as FilterGroup;

      expect(nestedCloned).not.toBe(nestedOriginal);
      expect(nestedCloned.conditions[0]).not.toBe(nestedOriginal.conditions[0]);
    });
  });

  describe("findItemById", () => {
    const group: FilterGroup = {
      id: "g1",
      type: "group",
      logic: "AND",
      conditions: [
        { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "test" },
        {
          id: "g2",
          type: "group",
          logic: "OR",
          conditions: [
            { id: "c2", type: "condition", fieldPath: ["status"], fieldName: "status", operator: "eq", value: "active" },
          ],
          negated: false,
        },
      ],
      negated: false,
    };

    it("should find root group", () => {
      const found = findItemById(group, "g1");
      expect(found).toBe(group);
    });

    it("should find direct condition", () => {
      const found = findItemById(group, "c1");
      expect(found?.id).toBe("c1");
      expect((found as FilterCondition).fieldName).toBe("name");
    });

    it("should find nested group", () => {
      const found = findItemById(group, "g2");
      expect(found?.id).toBe("g2");
      expect((found as FilterGroup).logic).toBe("OR");
    });

    it("should find deeply nested condition", () => {
      const found = findItemById(group, "c2");
      expect(found?.id).toBe("c2");
      expect((found as FilterCondition).fieldName).toBe("status");
    });

    it("should return null for non-existent ID", () => {
      const found = findItemById(group, "nonexistent");
      expect(found).toBeNull();
    });
  });

  describe("removeItemById", () => {
    it("should remove direct condition", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "test" },
          { id: "c2", type: "condition", fieldPath: ["status"], fieldName: "status", operator: "eq", value: "active" },
        ],
        negated: false,
      };

      const result = removeItemById(group, "c1");
      expect(result.conditions).toHaveLength(1);
      expect(result.conditions[0].id).toBe("c2");
    });

    it("should remove nested condition", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          {
            id: "g2",
            type: "group",
            logic: "OR",
            conditions: [
              { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "test" },
              { id: "c2", type: "condition", fieldPath: ["status"], fieldName: "status", operator: "eq", value: "active" },
            ],
            negated: false,
          },
        ],
        negated: false,
      };

      const result = removeItemById(group, "c1");
      const nestedGroup = result.conditions[0] as FilterGroup;
      expect(nestedGroup.conditions).toHaveLength(1);
      expect(nestedGroup.conditions[0].id).toBe("c2");
    });

    it("should remove nested group", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "test" },
          {
            id: "g2",
            type: "group",
            logic: "OR",
            conditions: [],
            negated: false,
          },
        ],
        negated: false,
      };

      const result = removeItemById(group, "g2");
      expect(result.conditions).toHaveLength(1);
      expect(result.conditions[0].id).toBe("c1");
    });

    it("should not modify original group (immutable)", () => {
      const original: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "test" },
        ],
        negated: false,
      };

      const result = removeItemById(original, "c1");
      expect(original.conditions).toHaveLength(1);
      expect(result.conditions).toHaveLength(0);
    });
  });

  describe("updateItemById", () => {
    it("should update direct condition", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "test" },
        ],
        negated: false,
      };

      const result = updateItemById(group, "c1", (item) => ({
        ...item,
        value: "updated",
      }));

      expect((result.conditions[0] as FilterCondition).value).toBe("updated");
    });

    it("should update root group", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [],
        negated: false,
      };

      const result = updateItemById(group, "g1", (item) => ({
        ...item,
        logic: "OR",
      }));

      expect(result.logic).toBe("OR");
    });

    it("should update nested condition", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          {
            id: "g2",
            type: "group",
            logic: "OR",
            conditions: [
              { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "test" },
            ],
            negated: false,
          },
        ],
        negated: false,
      };

      const result = updateItemById(group, "c1", (item) => ({
        ...item,
        operator: "contains",
      }));

      const nestedGroup = result.conditions[0] as FilterGroup;
      expect((nestedGroup.conditions[0] as FilterCondition).operator).toBe("contains");
    });

    it("should not modify original group (immutable)", () => {
      const original: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "test" },
        ],
        negated: false,
      };

      const result = updateItemById(original, "c1", (item) => ({
        ...item,
        value: "updated",
      }));

      expect((original.conditions[0] as FilterCondition).value).toBe("test");
      expect((result.conditions[0] as FilterCondition).value).toBe("updated");
    });
  });

  describe("validateFilterState", () => {
    it("should return empty array for valid state", () => {
      const state: FilterFormState = {
        root: {
          id: "g1",
          type: "group",
          logic: "AND",
          conditions: [
            { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "test" },
          ],
          negated: false,
        },
        selectedPresets: [],
        distinctOn: [],
        orderBy: [],
      };

      const errors = validateFilterState(state);
      expect(errors).toHaveLength(0);
    });

    it("should detect empty nested groups", () => {
      const state: FilterFormState = {
        root: {
          id: "g1",
          type: "group",
          logic: "AND",
          conditions: [
            {
              id: "g2",
              type: "group",
              logic: "OR",
              conditions: [],
              negated: false,
            },
          ],
          negated: false,
        },
        selectedPresets: [],
        distinctOn: [],
        orderBy: [],
      };

      const errors = validateFilterState(state);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("Empty group");
    });

    it("should not flag empty root group as error", () => {
      const state: FilterFormState = {
        root: {
          id: "g1",
          type: "group",
          logic: "AND",
          conditions: [],
          negated: false,
        },
        selectedPresets: [],
        distinctOn: [],
        orderBy: [],
      };

      const errors = validateFilterState(state);
      expect(errors).toHaveLength(0);
    });

    it("should detect distinctOn without matching orderBy", () => {
      const state: FilterFormState = {
        root: {
          id: "g1",
          type: "group",
          logic: "AND",
          conditions: [],
          negated: false,
        },
        selectedPresets: [],
        distinctOn: ["category"],
        orderBy: [],
      };

      const errors = validateFilterState(state);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain("distinctOn");
    });

    it("should detect distinctOn with mismatched orderBy", () => {
      const state: FilterFormState = {
        root: {
          id: "g1",
          type: "group",
          logic: "AND",
          conditions: [],
          negated: false,
        },
        selectedPresets: [],
        distinctOn: ["category"],
        orderBy: ["name"],
      };

      const errors = validateFilterState(state);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain("category");
    });

    it("should allow matching distinctOn and orderBy", () => {
      const state: FilterFormState = {
        root: {
          id: "g1",
          type: "group",
          logic: "AND",
          conditions: [],
          negated: false,
        },
        selectedPresets: [],
        distinctOn: ["category"],
        orderBy: ["category", "name"],
      };

      const errors = validateFilterState(state);
      expect(errors).toHaveLength(0);
    });

    it("should allow descending orderBy for distinctOn", () => {
      const state: FilterFormState = {
        root: {
          id: "g1",
          type: "group",
          logic: "AND",
          conditions: [],
          negated: false,
        },
        selectedPresets: [],
        distinctOn: ["category"],
        orderBy: ["-category"],
      };

      const errors = validateFilterState(state);
      expect(errors).toHaveLength(0);
    });
  });
});
