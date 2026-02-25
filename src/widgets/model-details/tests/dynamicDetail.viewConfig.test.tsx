import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DynamicDetail from "../DynamicDetail";
import type { DetailsPageSchema } from "../sectionTypes";

describe("DynamicDetail view config", () => {
  it("supports grouped tab controls through view config", async () => {
    const user = userEvent.setup();
    const onActiveTabChange = vi.fn();

    const schema: DetailsPageSchema = {
      header: [],
      tabs: [
        {
          id: "main",
          title: "Main",
          sections: [
            {
              id: "main-section",
              kind: "general",
              render: () => <div>Main Tab Content</div>,
            },
          ],
        },
        {
          id: "related",
          title: "Related",
          sections: [
            {
              id: "related-section",
              kind: "general",
              render: () => <div>Related Tab Content</div>,
            },
          ],
        },
      ],
    };

    render(
      <DynamicDetail
        schema={schema}
        runtime={{
          entityId: "1",
          entity: { id: "1" },
        }}
        view={{
          initialTabId: "related",
          onActiveTabChange,
        }}
      />,
    );

    expect(await screen.findByText("Related Tab Content")).toBeVisible();
    expect(screen.queryByText("Main Tab Content")).toBeNull();

    await user.click(screen.getByRole("tab", { name: "Main" }));
    await waitFor(() => {
      expect(screen.getByText("Main Tab Content")).toBeVisible();
      expect(onActiveTabChange).toHaveBeenCalledWith("main");
    });
  });

  it("uses grouped section container controls from view config", async () => {
    const schema: DetailsPageSchema = {
      header: [],
      body: [
        {
          id: "alpha",
          kind: "general",
          render: () => <div>Alpha Body</div>,
        },
        {
          id: "beta",
          kind: "general",
          render: () => <div>Beta Body</div>,
        },
      ],
    };

    render(
      <DynamicDetail
        schema={schema}
        runtime={{
          entityId: "2",
          entity: { id: "2" },
        }}
        view={{
          sectionColumns: 2,
          sectionsContainerClassName: "view-grid-container",
          resolveSectionContainer: (section) =>
            section.id === "alpha"
              ? { className: "view-alpha-container" }
              : undefined,
        }}
      />,
    );

    expect(await screen.findByText("Alpha Body")).toBeVisible();
    expect(await screen.findByText("Beta Body")).toBeVisible();

    const alphaSection = screen.getByTestId("section-alpha");
    const sectionsContainer = alphaSection.parentElement;
    expect(alphaSection.className).toContain("view-alpha-container");
    expect(sectionsContainer?.className ?? "").toContain("view-grid-container");
    expect(sectionsContainer?.className ?? "").toContain("md:grid-cols-2");
  });

  it("keeps top-level props precedence over view config", async () => {
    const schema: DetailsPageSchema = {
      header: [],
      tabs: [
        {
          id: "main",
          title: "Main",
          sections: [
            {
              id: "main-section",
              kind: "general",
              render: () => <div>Main Tab Content</div>,
            },
          ],
        },
        {
          id: "related",
          title: "Related",
          sections: [
            {
              id: "related-section",
              kind: "general",
              render: () => <div>Related Tab Content</div>,
            },
          ],
        },
      ],
    };

    render(
      <DynamicDetail
        schema={schema}
        runtime={{
          entityId: "3",
          entity: { id: "3" },
        }}
        initialTabId="main"
        view={{
          initialTabId: "related",
        }}
      />,
    );

    expect(await screen.findByText("Main Tab Content")).toBeVisible();
    expect(screen.queryByText("Related Tab Content")).toBeNull();
  });
});

