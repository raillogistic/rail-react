import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SectionHost from "../SectionHost";
import type { DetailsPageSchema } from "../sectionTypes";
import { waitFor } from "@testing-library/react";

describe("section visibility and permissions", () => {
  it("hides sections and tabs when permissions fail", async () => {
    const schema: DetailsPageSchema = {
      header: [],
      tabs: [
        {
          id: "allowed-tab",
          title: "Allowed",
          permissions: ["detail.read"],
          sections: [
            {
              id: "allowed-section",
              kind: "general",
              permissions: ["detail.read"],
              render: () => <div>Visible section</div>,
            },
          ],
        },
        {
          id: "denied-tab",
          title: "Denied",
          permissions: ["admin.read"],
          sections: [
            {
              id: "denied-section",
              kind: "general",
              render: () => <div>Hidden section</div>,
            },
          ],
        },
      ],
    };

    render(
      <SectionHost
        schema={schema}
        runtime={{
          entityId: "1",
          entity: { id: "1" },
          permissions: ["detail.read"],
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Visible section")).toBeInTheDocument();
    });
    expect(screen.queryByText("Hidden section")).toBeNull();
    expect(screen.queryByText("Denied")).toBeNull();
  });

  it("respects visibleIf on section level", async () => {
    const schema: DetailsPageSchema = {
      header: [
        {
          id: "header-visible",
          kind: "header",
          visibleIf: () => false,
          render: () => <div>Should not render</div>,
        },
      ],
      body: [
        {
          id: "body-visible",
          kind: "general",
          visibleIf: () => true,
          render: () => <div>Body visible</div>,
        },
      ],
    };

    render(
      <SectionHost
        schema={schema}
        runtime={{
          entityId: "2",
          entity: { id: "2" },
        }}
      />,
    );

    expect(screen.queryByText("Should not render")).toBeNull();
    await waitFor(() => {
      expect(screen.getByText("Body visible")).toBeInTheDocument();
    });
  });

  it("renders body sections when tabs are present", async () => {
    const schema: DetailsPageSchema = {
      header: [],
      body: [
        {
          id: "body-summary",
          kind: "general",
          render: () => <div>Body summary</div>,
        },
      ],
      tabs: [
        {
          id: "related",
          title: "Related",
          sections: [
            {
              id: "tab-section",
              kind: "general",
              render: () => <div>Tab content</div>,
            },
          ],
        },
      ],
    };

    render(
      <SectionHost
        schema={schema}
        runtime={{
          entityId: "3",
          entity: { id: "3" },
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Body summary")).toBeInTheDocument();
    });
    expect(screen.getByText("Tab content")).toBeInTheDocument();
  });
});
