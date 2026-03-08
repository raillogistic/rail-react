import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CustomMutationAction } from "../CustomMutationAction";

const useQueryMock = vi.hoisted(() => vi.fn());
const mutateMock = vi.hoisted(() => vi.fn());
const dynamicFormSpy = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@apollo/client", async () => {
  const actual =
    await vi.importActual<typeof import("@apollo/client")>("@apollo/client");

  return {
    ...actual,
    useQuery: (...args: unknown[]) => useQueryMock(...args),
    useApolloClient: () => ({
      mutate: mutateMock,
    }),
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock("@/widgets/model-table/components/ModelTableOverlays", () => ({
  FormOverlay: ({
    open,
    title,
    children,
  }: {
    open: boolean;
    title: React.ReactNode;
    children: React.ReactNode;
  }) => (open ? <div><h2>{title}</h2>{children}</div> : null),
}));

vi.mock("@/widgets/model-form/inputs/form", () => ({
  default: (props: Record<string, unknown>) => {
    dynamicFormSpy(props);
    const behavior = props.behavior as
      | { onSubmit?: (values: Record<string, unknown>) => void | Promise<void> }
      | undefined;
    const actions = props.actions as
      | { submitLabel?: string; resetLabel?: string }
      | undefined;

    return (
      <div>
        <button
          type="button"
          onClick={() => behavior?.onSubmit?.({ reason: "from-form" })}
        >
          fake-submit
        </button>
        <span>{actions?.submitLabel ?? "missing-submit"}</span>
        <span>{actions?.resetLabel ?? "missing-reset"}</span>
      </div>
    );
  },
}));

describe("CustomMutationAction", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    mutateMock.mockReset();
    dynamicFormSpy.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  it("renders generated form mode and executes the custom mutation", async () => {
    useQueryMock.mockReturnValue({
      data: {
        customMutation: {
          name: "publishOrder",
          operation: "custom",
          description: "Publish the order.",
          methodName: "publish_order",
          inputFields: [
            {
              name: "reason",
              fieldName: "reason",
              fieldType: "String",
              graphqlType: "String",
              required: true,
              defaultValue: '"initial"',
              description: "Why",
              choices: [],
            },
          ],
          inputType: "PublishOrderInput",
          allowed: true,
          reason: null,
          modelName: "Order",
          successMessage: "Published",
          action: {
            submit_label: "Execute",
          },
        },
      },
      loading: false,
      error: undefined,
    });
    mutateMock.mockResolvedValue({
      data: {
        response: {
          ok: true,
          errors: [],
        },
      },
    });

    const onSuccess = vi.fn();

    render(
      <CustomMutationAction
        data={{
          app: "sales",
          model: "Order",
          funcName: "publish_order",
          objectId: "42",
        }}
        button={{ label: "Open publish" }}
        popup={{ title: "Publish order" }}
        form={{
          fieldOverrides: {
            reason: {
              label: "Reason override",
            },
          },
          actions: {
            submitLabel: "Submit now",
          },
        }}
        onSuccess={onSuccess}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open publish" }));
    expect(
      screen.getByRole("heading", { name: "Publish order" }),
    ).toBeInTheDocument();

    const latestProps = dynamicFormSpy.mock.calls.at(-1)?.[0] as
      | {
          schema?: { fields?: Array<{ name?: string; label?: string }> };
          state?: { defaultValues?: Record<string, unknown> };
        }
      | undefined;
    expect(latestProps?.schema?.fields?.[0]?.label).toBe("Reason override");
    expect(latestProps?.state?.defaultValues).toEqual({
      reason: "initial",
    });

    fireEvent.click(screen.getByRole("button", { name: "fake-submit" }));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledTimes(1);
    });

    expect(mutateMock.mock.calls[0]?.[0]?.variables).toEqual({
      id: "42",
      input: {
        reason: "from-form",
      },
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalledWith("Published");
  });

  it("renders confirm mode and executes without a form payload", async () => {
    useQueryMock.mockReturnValue({
      data: {
        customMutation: {
          name: "archiveOrder",
          operation: "custom",
          description: "Archive the order.",
          methodName: "archive_order",
          inputFields: [],
          inputType: null,
          allowed: true,
          reason: null,
          modelName: "Order",
          successMessage: null,
          action: {
            mode: "confirm",
            message: "Archive this order?",
            confirm_label: "Archive now",
          },
        },
      },
      loading: false,
      error: undefined,
    });
    mutateMock.mockResolvedValue({
      data: {
        response: {
          ok: true,
          errors: [],
        },
      },
    });

    render(
      <CustomMutationAction
        data={{
          app: "sales",
          model: "Order",
          funcName: "archive_order",
          objectId: "9",
        }}
        button={{ label: "Archive order" }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Archive order" }));

    expect(screen.getByText("Archive this order?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Archive now" }));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledTimes(1);
    });

    expect(mutateMock.mock.calls[0]?.[0]?.variables).toEqual({
      id: "9",
    });
    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Action executed successfully.",
    );
  });

  it("keeps the trigger disabled when the backend denies the mutation", () => {
    useQueryMock.mockReturnValue({
      data: {
        customMutation: {
          name: "publishOrder",
          operation: "custom",
          description: "Publish the order.",
          methodName: "publish_order",
          inputFields: [],
          inputType: null,
          allowed: false,
          reason: "Permission required.",
          modelName: "Order",
          successMessage: null,
          action: null,
        },
      },
      loading: false,
      error: undefined,
    });

    render(
      <CustomMutationAction
        data={{
          app: "sales",
          model: "Order",
          funcName: "publish_order",
          objectId: "42",
        }}
        button={{ label: "Publish order" }}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Publish order" });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute("title", "Permission required.");
  });
});
