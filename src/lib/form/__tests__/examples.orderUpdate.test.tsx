import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { modelFormSpy } = vi.hoisted(() => ({
  modelFormSpy: vi.fn(),
}));

vi.mock("@/lib/form", async () => {
  const actual = await vi.importActual<typeof import("@/lib/form")>(
    "@/lib/form",
  );
  return {
    ...actual,
    ModelForm: (props: Record<string, unknown>) => {
      modelFormSpy(props);
      return null;
    },
  };
});

import { StoreOrderUpdateModelFormExample } from "../examples";

describe("StoreOrderUpdateModelFormExample", () => {
  beforeEach(() => {
    modelFormSpy.mockClear();
  });

  it("renders Order update form wiring", () => {
    render(<StoreOrderUpdateModelFormExample objectId="42" />);

    expect(modelFormSpy).toHaveBeenCalledTimes(1);
    const props = modelFormSpy.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(props.app).toBe("store");
    expect(props.model).toBe("Order");
    expect(props.mode).toBe("UPDATE");
    expect(props.objectId).toBe("42");
    expect(props.nested).toEqual(["items"]);
    expect(props.runtimeOverrides).toEqual(
      expect.arrayContaining([
        {
          path: "payment_token",
          action: "UNSET",
        },
        {
          path: "metadata",
          action: "MERGE",
          value: {
            updated_from: "rail-react/src/lib/form/examples.tsx",
          },
        },
      ]),
    );
  });

  it("shows guidance text when objectId is missing", () => {
    render(<StoreOrderUpdateModelFormExample objectId="" />);

    expect(modelFormSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/objectId/)).toBeInTheDocument();
  });
});
