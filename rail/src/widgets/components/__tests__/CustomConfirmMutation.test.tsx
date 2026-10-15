import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CustomConfirmMutation } from "../CustomConfirmMutation";

const useQueryMock = vi.hoisted(() => vi.fn());
const mutateMock = vi.hoisted(() => vi.fn());
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

describe("CustomConfirmMutation", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    mutateMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  it("renders confirm-only modal copy overrides and executes the mutation", async () => {
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
          successMessage: "Archived",
          action: {
            confirm_label: "Archive backend",
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
      <CustomConfirmMutation
        data={{
          app: "sales",
          model: "Order",
          funcName: "archive_order",
          objectId: "88",
        }}
        button={{ label: "Archive order" }}
        popup={{
          title: "Archive order",
          message: "Are you sure you want to archive this order?",
          description: "This action will hide it from active workflows.",
          confirmLabel: "Archive now",
          cancelLabel: "Keep order",
          confirmVariant: "destructive",
        }}
        onSuccess={onSuccess}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Archive order" }));

    expect(
      screen.getByRole("heading", { name: "Archive order" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to archive this order?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This action will hide it from active workflows."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Archive now" }));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledTimes(1);
    });

    expect(mutateMock.mock.calls[0]?.[0]?.variables).toEqual({
      id: "88",
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalledWith("Archived");
  });

  it("disables the trigger when the mutation requires form fields", () => {
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
            },
          ],
          inputType: "PublishOrderInput",
          allowed: true,
          reason: null,
          modelName: "Order",
          successMessage: null,
          action: null,
        },
      },
      loading: false,
      error: undefined,
    });

    render(
      <CustomConfirmMutation
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
    expect(trigger).toHaveAttribute(
      "title",
      "This mutation requires form inputs. Use CustomMutationAction instead.",
    );
  });
});
