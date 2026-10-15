import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DynamicDetail from "../DynamicDetail";
import type { DetailsPageSchema } from "../sectionTypes";
import userEvent from "@testing-library/user-event";

describe("lazy loading and cache behavior", () => {
  it("does not load lazy tab sections until tab activation and avoids refetch on tab switch", async () => {
    const loadMain = vi.fn(async () => ({ message: "Main data" }));
    const loadRelated = vi.fn(async () => ({ message: "Related data" }));

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
              loadingStrategy: "lazy",
              load: async (ctx) => {
                if (ctx.abortSignal.aborted) {
                  throw new DOMException("Aborted", "AbortError");
                }
                return loadMain();
              },
              render: ({ data }) => <div>{(data as { message: string }).message}</div>,
            },
          ],
        },
        {
          id: "related",
          title: "Related",
          sections: [
            {
              id: "related-section",
              kind: "table",
              loadingStrategy: "lazy",
              load: async (ctx) => {
                if (ctx.abortSignal.aborted) {
                  throw new DOMException("Aborted", "AbortError");
                }
                return loadRelated();
              },
              render: ({ data }) => <div>{(data as { message: string }).message}</div>,
            },
          ],
        },
      ],
    };

    render(
      <DynamicDetail
        schema={schema}
        runtime={{
          entityId: "42",
          entity: { id: "42" },
        }}
      />,
    );

    await waitFor(() => {
      expect(loadMain).toHaveBeenCalledTimes(1);
    });
    expect(loadRelated).toHaveBeenCalledTimes(0);

    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Related" }));
    await waitFor(() => {
      expect(loadRelated).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole("tab", { name: "Main" }));
    await user.click(screen.getByRole("tab", { name: "Related" }));
    await waitFor(() => {
      expect(loadMain).toHaveBeenCalledTimes(1);
      expect(loadRelated).toHaveBeenCalledTimes(1);
    });
  });
});

