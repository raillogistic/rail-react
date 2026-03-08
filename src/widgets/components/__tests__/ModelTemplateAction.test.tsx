import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ModelTemplateAction } from "../ModelTemplateAction";

const useQueryMock = vi.hoisted(() => vi.fn());
const executeTemplateForRowsMock = vi.hoisted(() => vi.fn());
const dynamicFormSpy = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@apollo/client", async () => {
  const actual =
    await vi.importActual<typeof import("@apollo/client")>("@apollo/client");

  return {
    ...actual,
    useQuery: (...args: unknown[]) => useQueryMock(...args),
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
          onClick={() => behavior?.onSubmit?.({ locale: "fr" })}
        >
          fake-submit
        </button>
        <span>{actions?.submitLabel ?? "missing-submit"}</span>
        <span>{actions?.resetLabel ?? "missing-reset"}</span>
      </div>
    );
  },
}));

vi.mock("@/widgets/model-table/utils/templateExecution", async () => {
  const actual =
    await vi.importActual<
      typeof import("@/widgets/model-table/utils/templateExecution")
    >("@/widgets/model-table/utils/templateExecution");

  return {
    ...actual,
    executeTemplateForRows: (...args: unknown[]) =>
      executeTemplateForRowsMock(...args),
  };
});

describe("ModelTemplateAction", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    executeTemplateForRowsMock.mockReset();
    dynamicFormSpy.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  it("renders generated client-data form mode and executes the template", async () => {
    useQueryMock.mockReturnValue({
      data: {
        modelTemplate: {
          key: "print_summary",
          templateType: "pdf",
          title: "Print summary",
          description: "Generate the customer summary.",
          endpoint: "/api/v1/templates/sales/order/print_summary/<pk>/",
          urlPath: "/templates/sales/order/print_summary",
          allowed: true,
          denialReason: null,
          allowClientData: true,
          clientDataSchema: [{ name: "locale", type: "string" }],
          clientDataFields: [],
        },
      },
      loading: false,
      error: undefined,
    });
    executeTemplateForRowsMock.mockResolvedValue({
      templateType: "pdf",
      count: 1,
    });

    const onSuccess = vi.fn();

    render(
      <ModelTemplateAction
        data={{
          app: "sales",
          model: "Order",
          funcName: "print_summary",
          objectId: "42",
        }}
        popup={{ title: "Print summary" }}
        form={{
          defaults: {
            locale: "en",
          },
          fieldOverrides: {
            locale: {
              label: "Language override",
            },
          },
          actions: {
            submitLabel: "Generate now",
          },
        }}
        onSuccess={onSuccess}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Print summary" }));
    expect(
      screen.getByRole("heading", { name: "Print summary" }),
    ).toBeInTheDocument();

    const latestProps = dynamicFormSpy.mock.calls.at(-1)?.[0] as
      | {
          schema?: { fields?: Array<{ name?: string; label?: string }> };
          state?: { defaultValues?: Record<string, unknown> };
        }
      | undefined;
    expect(latestProps?.schema?.fields?.[0]?.label).toBe("Language override");
    expect(latestProps?.state?.defaultValues).toEqual({
      locale: "en",
    });

    fireEvent.click(screen.getByRole("button", { name: "fake-submit" }));

    await waitFor(() => {
      expect(executeTemplateForRowsMock).toHaveBeenCalledTimes(1);
    });

    expect(executeTemplateForRowsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "print_summary",
      }),
      ["42"],
      {
        locale: "fr",
      },
      expect.objectContaining({
        onPdfPreview: undefined,
      }),
    );
    expect(onSuccess).toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalledWith(
      'Template "Print summary" generated.',
    );
  });

  it("executes templates without client-data form directly from the trigger", async () => {
    useQueryMock.mockReturnValue({
      data: {
        modelTemplate: {
          key: "export_sheet",
          templateType: "excel",
          title: "Export sheet",
          description: "Download the workbook.",
          endpoint: "/api/v1/excel/sales/order/export_sheet/",
          urlPath: "/excel/sales/order/export_sheet",
          allowed: true,
          denialReason: null,
          allowClientData: false,
          clientDataSchema: [],
          clientDataFields: [],
        },
      },
      loading: false,
      error: undefined,
    });
    executeTemplateForRowsMock.mockResolvedValue({
      templateType: "excel",
      count: 1,
    });

    render(
      <ModelTemplateAction
        data={{
          app: "sales",
          model: "Order",
          funcName: "export_sheet",
          objectId: "9",
        }}
        button={{ label: "Export sheet" }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Export sheet" }));

    await waitFor(() => {
      expect(executeTemplateForRowsMock).toHaveBeenCalledTimes(1);
    });

    expect(executeTemplateForRowsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "export_sheet",
      }),
      ["9"],
      {},
      expect.objectContaining({
        onPdfPreview: undefined,
      }),
    );
    expect(toastSuccessMock).toHaveBeenCalledWith(
      'Template "Export sheet" downloaded.',
    );
  });
});
