import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SectionHost from "../SectionHost";
import type { DetailsPageSchema } from "../sectionTypes";

describe("retry and abort behavior", () => {
  it("retries a failed section load when retry is clicked", async () => {
    const load = vi
      .fn<() => Promise<{ value: string }>>()
      .mockRejectedValueOnce(new Error("network-failure"))
      .mockResolvedValueOnce({ value: "loaded" });

    const schema: DetailsPageSchema = {
      header: [],
      body: [
        {
          id: "retry-section",
          kind: "general",
          load: async ({ abortSignal }) => {
            if (abortSignal.aborted) {
              throw new DOMException("Aborted", "AbortError");
            }
            return load();
          },
          render: ({ data }) => <div>{(data as { value: string }).value}</div>,
        },
      ],
    };

    render(
      <SectionHost
        schema={schema}
        runtime={{
          entityId: "1",
          entity: { id: "1" },
        }}
      />,
    );

    const retryButtonMatcher = /retry|attempt reconnect/i;

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: retryButtonMatcher }),
      ).toBeInTheDocument();
    });
    expect(load).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: retryButtonMatcher }));
    await waitFor(() => {
      expect(screen.getByText("loaded")).toBeInTheDocument();
    });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("aborts in-flight section loads on unmount", async () => {
    let aborted = false;
    const schema: DetailsPageSchema = {
      header: [],
      body: [
        {
          id: "slow-section",
          kind: "general",
          load: async ({ abortSignal }) =>
            new Promise((resolve, reject) => {
              const timeout = setTimeout(() => resolve({ ok: true }), 5000);
              const onAbort = () => {
                aborted = true;
                clearTimeout(timeout);
                reject(new DOMException("Aborted", "AbortError"));
              };
              abortSignal.addEventListener("abort", onAbort, { once: true });
            }),
          render: () => <div>slow</div>,
        },
      ],
    };

    const { unmount } = render(
      <SectionHost
        schema={schema}
        runtime={{
          entityId: "2",
          entity: { id: "2" },
        }}
      />,
    );

    unmount();
    await waitFor(() => {
      expect(aborted).toBe(true);
    });
  });
});
