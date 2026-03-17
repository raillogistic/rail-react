import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const dynamicModelTableSpy = vi.fn(() => null);

vi.mock("@/widgets/model-table", () => ({
  DynamicModelTable: (props: unknown) => dynamicModelTableSpy(props),
}));

describe("DechargeListPage", () => {
  it("passes the direct navFilters prop to DynamicModelTable", async () => {
    dynamicModelTableSpy.mockClear();
    const { DechargeListPageTabs } = await import("./DechargeListPage");
    render(<DechargeListPageTabs />);

    expect(dynamicModelTableSpy).toHaveBeenCalledTimes(1);
    const props = dynamicModelTableSpy.mock.calls[0]?.[0] as {
      navFilters?: {
        groups: Array<{
          key: string;
          items: Array<{ key: string; label: string }>;
        }>;
      };
    };

    expect(props.navFilters?.groups).toHaveLength(2);
    expect(props.navFilters?.groups[0]).toMatchObject({
      key: "status",
      items: [
        { key: "all" },
        { key: "brouillon" },
        { key: "validated" },
        { key: "canceled" },
      ],
    });
    expect(props.navFilters?.groups[1]).toMatchObject({
      key: "period",
      items: [
        { key: "all" },
        { key: "today" },
        { key: "this_week" },
        { key: "this_month" },
        { key: "this_year" },
      ],
    });
  });
});
