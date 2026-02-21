import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createModelSection, type ModelSectionData } from "../builtInSections/ModelSection";
import { resolveSectionActions } from "../sectionState";
import type { SectionRuntimeCtx, SectionState } from "../sectionTypes";
import type { MutationMetadata, TemplateInfo } from "@/lib/graphql/metadata/types";

/** Build deterministic section data payload for action and rendering tests. */
function createModelData(overrides?: Partial<ModelSectionData>): ModelSectionData {
  return {
    groups: [
      {
        id: "main",
        title: "Main",
        fields: [
          {
            id: "name",
            label: "Name",
            kind: "text",
            value: "Product 1",
          },
        ],
      },
    ],
    allFields: [
      {
        id: "name",
        label: "Name",
        kind: "text",
        value: "Product 1",
      },
    ],
    objectId: "42",
    access: {
      canView: true,
      canUpdate: true,
    },
    customMutations: [],
    templates: [],
    ...overrides,
  };
}

/** Build minimal runtime context with optional permission keys. */
function createRuntime(permissions: string[] = []): SectionRuntimeCtx {
  return {
    entityId: "42",
    permissions,
  };
}

describe("ModelSection actions and access", () => {
  it("renders update action when object update is allowed", () => {
    const onUpdate = vi.fn();
    const section = createModelSection({
      id: "product-model",
      appLabel: "store",
      modelName: "Product",
      onUpdate,
    });

    const runtime = createRuntime();
    const state: SectionState<ModelSectionData> = {
      status: "success",
      data: createModelData(),
    };

    const actions = resolveSectionActions(section, runtime, state, async () => undefined);
    expect(actions.find((action) => action.id === "model-section:update")).toBeDefined();
  });

  it("prefers backend allowed flags for custom mutation and template action visibility", () => {
    const mutation: MutationMetadata = {
      name: "archiveProduct",
      operation: "custom",
      inputFields: [],
      allowed: true,
      requiredPermissions: ["store.archive_product"],
      mutationType: "custom",
    };

    const template: TemplateInfo = {
      key: "invoice",
      title: "Invoice",
      endpoint: "/api/templates/store/product/invoice/<pk>/",
      allowed: true,
      permissions: ["store.generate_invoice"],
    };

    const section = createModelSection({
      id: "product-model",
      appLabel: "store",
      modelName: "Product",
      onUpdate: vi.fn(),
    });

    const runtime = createRuntime();
    const state: SectionState<ModelSectionData> = {
      status: "success",
      data: createModelData({
        customMutations: [mutation],
        templates: [template],
      }),
    };

    const actions = resolveSectionActions(
      section,
      runtime,
      state,
      async () => undefined,
    );

    expect(
      actions.some((action) => action.id === "model-section:mutation:archiveProduct"),
    ).toBe(true);
    expect(
      actions.some((action) => action.id === "model-section:template:invoice"),
    ).toBe(true);

    const deniedState: SectionState<ModelSectionData> = {
      status: "success",
      data: createModelData({
        customMutations: [{ ...mutation, allowed: false }],
        templates: [{ ...template, allowed: false }],
      }),
    };

    const deniedActions = resolveSectionActions(
      section,
      runtime,
      deniedState,
      async () => undefined,
    );
    expect(
      deniedActions.some((action) => action.id === "model-section:mutation:archiveProduct"),
    ).toBe(false);
    expect(
      deniedActions.some((action) => action.id === "model-section:template:invoice"),
    ).toBe(false);
  });

  it("supports generated action exclusions", () => {
    const section = createModelSection({
      id: "product-model",
      appLabel: "store",
      modelName: "Product",
      onUpdate: vi.fn(),
      autoActions: {
        excludeActionIds: ["model-section:update"],
      },
    });

    const runtime = createRuntime();
    const state: SectionState<ModelSectionData> = {
      status: "success",
      data: createModelData(),
    };

    const actions = resolveSectionActions(section, runtime, state, async () => undefined);
    expect(actions.find((action) => action.id === "model-section:update")).toBeUndefined();
  });

  it("renders access alert and hides fields when object view is denied", () => {
    const section = createModelSection({
      id: "product-model",
      appLabel: "store",
      modelName: "Product",
    });

    const state: SectionState<ModelSectionData> = {
      status: "success",
      data: createModelData({
        access: {
          canView: false,
          canUpdate: false,
          viewReason: "Permission required: store.view_product",
        },
        groups: [],
        allFields: [],
      }),
    };

    render(
      <>
        {section.render({
          section,
          runtime: createRuntime(),
          state,
          data: state.data,
          actions: [],
          reload: async () => undefined,
        })}
      </>,
    );

    expect(screen.getByText("Access denied")).toBeInTheDocument();
    expect(
      screen.getByText("Permission required: store.view_product"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Name")).toBeNull();
  });
});

