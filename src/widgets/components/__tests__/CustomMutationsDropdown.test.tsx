import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CustomMutationsDropdown } from "../CustomMutationsDropdown";

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

vi.mock("@/shared/ui/kit/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
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
          onClick={() => behavior?.onSubmit?.({ reason: "dropdown-form" })}
        >
          fake-submit
        </button>
        <span>{actions?.submitLabel ?? "missing-submit"}</span>
        <span>{actions?.resetLabel ?? "missing-reset"}</span>
      </div>
    );
  },
}));

describe("CustomMutationsDropdown", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    mutateMock.mockReset();
    dynamicFormSpy.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  it("opens a confirm mutation from the dropdown and executes it", async () => {
    useQueryMock.mockReturnValue({
      data: {
        customMutations: [
          {
            name: "archiveOrder",
            operation: "custom",
            description: "Archive the order.",
            methodName: "archive_order",
            inputFields: [],
            inputType: null,
            allowed: true,
            reason: null,
            modelName: "Order",
            successMessage: "Archived",
            action: null,
          },
        ],
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
      <CustomMutationsDropdown
        data={{
          app: "sales",
          model: "Order",
          objectId: "14",
        }}
        button={{ label: "Actions" }}
        actions={{
          overrides: {
            archive_order: {
              popup: {
                title: "Archive order",
                message: "Archive this order now?",
                confirmLabel: "Archive now",
                confirmVariant: "destructive",
              },
            },
          },
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Archive order" }));

    expect(
      screen.getByRole("heading", { name: "Archive order" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Archive this order now?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Archive now" }));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledTimes(1);
    });

    expect(mutateMock.mock.calls[0]?.[0]?.variables).toEqual({
      id: "14",
    });
    expect(toastSuccessMock).toHaveBeenCalledWith("Archived");
  });

  it("opens a form mutation from the dropdown and applies per-action form overrides", async () => {
    useQueryMock.mockReturnValue({
      data: {
        customMutations: [
          {
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
                defaultValue: '"ready"',
                description: "Why",
              },
            ],
            inputType: "PublishOrderInput",
            allowed: true,
            reason: null,
            modelName: "Order",
            successMessage: "Published",
            action: {
              submit_label: "Publish backend",
            },
          },
        ],
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
      <CustomMutationsDropdown
        data={{
          app: "sales",
          model: "Order",
          objectId: "77",
        }}
        button={{ label: "Actions" }}
        actions={{
          overrides: {
            publish_order: {
              form: {
                fieldOverrides: {
                  reason: {
                    label: "Publish reason override",
                  },
                },
                actions: {
                  submitLabel: "Publish now",
                },
              },
            },
          },
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Publish order" }));

    const latestProps = dynamicFormSpy.mock.calls.at(-1)?.[0] as
      | {
          schema?: { fields?: Array<{ label?: string }> };
          state?: { defaultValues?: Record<string, unknown> };
        }
      | undefined;
    expect(latestProps?.schema?.fields?.[0]?.label).toBe(
      "Publish reason override",
    );
    expect(latestProps?.state?.defaultValues).toEqual({
      reason: "ready",
    });

    fireEvent.click(screen.getByRole("button", { name: "fake-submit" }));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledTimes(1);
    });

    expect(mutateMock.mock.calls[0]?.[0]?.variables).toEqual({
      id: "77",
      input: {
        reason: "dropdown-form",
      },
    });
    expect(toastSuccessMock).toHaveBeenCalledWith("Published");
  });

  it("renders extra row actions even when no metadata mutations are available", () => {
    useQueryMock.mockReturnValue({
      data: {
        customMutations: [],
      },
      loading: false,
      error: undefined,
    });

    const extraActionSpy = vi.fn();

    render(
      <CustomMutationsDropdown
        data={{
          app: "sales",
          model: "Order",
          objectId: "14",
        }}
        extraActions={[
          {
            key: "flag",
            label: "Flag order",
            onClick: extraActionSpy,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Flag order" }));

    expect(extraActionSpy).toHaveBeenCalledTimes(1);
  });
});
