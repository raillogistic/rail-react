import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createModelSection,
  type ModelSectionData,
} from "../builtInSections/ModelSection";
import type { SectionState } from "../sectionTypes";

function createField(id: string, label: string, value: string) {
  return {
    id,
    label,
    kind: "text" as const,
    value,
  };
}

function renderModelSection(data: ModelSectionData) {
  const section = createModelSection({
    id: "order-model",
    appLabel: "store",
    modelName: "Order",
    columns: 2,
  });
  const state: SectionState<ModelSectionData> = {
    status: "success",
    data,
  };

  return render(
    <>
      {section.render({
        section,
        runtime: { entityId: "42" },
        state,
        data,
        actions: [],
        reload: async () => undefined,
      })}
    </>,
  );
}

describe("ModelSection render", () => {
  it("uses manifest section columns for responsive grid classes", () => {
    const fields = [
      createField("f1", "Field 1", "v1"),
      createField("f2", "Field 2", "v2"),
      createField("f3", "Field 3", "v3"),
      createField("f4", "Field 4", "v4"),
    ];
    const data: ModelSectionData = {
      groups: [
        {
          id: "main",
          title: "Main",
          columns: 4,
          fields,
        },
      ],
      allFields: fields,
    };

    const { container } = renderModelSection(data);
    const grid = container.querySelector("section div.grid.py-2");
    expect(grid).not.toBeNull();
    expect(grid?.className).toContain("lg:grid-cols-4");
  });

  it("falls back to section config columns when group columns are not set", () => {
    const fields = [createField("f1", "Field 1", "v1"), createField("f2", "Field 2", "v2")];
    const data: ModelSectionData = {
      groups: [
        {
          id: "main",
          title: "Main",
          fields,
        },
      ],
      allFields: fields,
    };

    const { container } = renderModelSection(data);
    const grid = container.querySelector("section div.grid.py-2");
    expect(grid).not.toBeNull();
    expect(grid?.className).toContain("sm:grid-cols-2");
  });
});
