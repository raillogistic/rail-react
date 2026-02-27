import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/shared/ui/kit/tooltip";
import { ModelTableBulkActionsBar } from "../content/ModelTableBulkActionsBar";
import { ModelTableDialogs } from "../content/ModelTableDialogs";
import { ModelTableHeader } from "../content/ModelTableHeader";
import { ModelTableToolbarSection } from "../content/ModelTableToolbarSection";
import { ModelTableTopActions } from "../content/ModelTableTopActions";
import { useModelTableContentController } from "../content/useModelTableContentController";

const mockUseMetadata = vi.fn();
const mockUseTable = vi.fn();
const mockNavigate = vi.fn();
const printDialogSpy = vi.fn();
const sonnerToast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  info: vi.fn(),
}));

vi.mock("../../context/MetadataContext", () => ({
  useMetadata: () => mockUseMetadata(),
}));

vi.mock("../../context/TableContext", () => ({
  useTable: () => mockUseTable(),
}));

vi.mock("../TableToolbar", () => ({
  TableToolbar: (props: { extraActions?: React.ReactNode }) => (
    <div data-testid="table-toolbar">{props.extraActions}</div>
  ),
}));

vi.mock("@/shared/ui/kit/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuItem: (props: {
    children: React.ReactNode;
    disabled?: boolean;
    title?: string;
    onClick?: () => void;
  }) => (
    <button
      type="button"
      disabled={props.disabled}
      title={props.title}
      data-disabled={props.disabled ? "" : undefined}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  ),
}));

vi.mock("../ModelTableOverlays", () => ({
  FormOverlay: (props: {
    open: boolean;
    children: React.ReactNode;
  }) => (props.open ? <div>{props.children}</div> : null),
  PrintDialog: (props: {
    open: boolean;
    title: string;
    onSubmit: (values: Record<string, unknown>) => void;
    onCancel: () => void;
  }) => {
    printDialogSpy(props);
    if (!props.open) return null;
    return (
      <div data-testid="print-dialog">
        <span>{props.title}</span>
        <button type="button" onClick={() => props.onSubmit({ notes: "client" })}>
          submit-dialog
        </button>
        <button type="button" onClick={props.onCancel}>
          cancel-dialog
        </button>
      </div>
    );
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("sonner", () => ({
  toast: sonnerToast,
}));

vi.mock("@/shared/api/auth/token-storage", () => ({
  getAuthorizationHeader: () => "Bearer test-token",
  getSecureHeaders: () => ({
    "X-CSRFToken": "csrf-token",
  }),
}));

async function openPdfTemplatesDropdown() {
  fireEvent.click(screen.getByTestId("templates-pdf-dropdown-trigger"));
  await waitFor(() => {
    expect(screen.getByText("Templates PDF")).toBeInTheDocument();
  });
}

async function openExcelTemplatesDropdown() {
  fireEvent.click(screen.getByTestId("templates-excel-dropdown-trigger"));
  await waitFor(() => {
    expect(screen.getByText("Templates Excel")).toBeInTheDocument();
  });
}

function DynamicContentSectionsHarness() {
  const controller = useModelTableContentController({});
  if (!controller.metadata) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div>
        <ModelTableHeader
          controller={controller}
          TopActionsComponent={ModelTableTopActions}
        />
        <ModelTableToolbarSection controller={controller} />
        <ModelTableBulkActionsBar controller={controller} />
        <ModelTableDialogs controller={controller} />
      </div>
    </TooltipProvider>
  );
}

describe("Dynamic section composition template actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    if (!window.URL.createObjectURL) {
      Object.defineProperty(window.URL, "createObjectURL", {
        writable: true,
        value: vi.fn(() => "blob:template"),
      });
    } else {
      vi.spyOn(window.URL, "createObjectURL").mockReturnValue("blob:template");
    }
    if (!window.URL.revokeObjectURL) {
      Object.defineProperty(window.URL, "revokeObjectURL", {
        writable: true,
        value: vi.fn(),
      });
    } else {
      vi.spyOn(window.URL, "revokeObjectURL").mockImplementation(() => undefined);
    }
    vi.spyOn(window, "open").mockReturnValue({} as Window);
  });

  it("opens a client-data modal for template actions requiring extra fields", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      blob: async () => new Blob(["pdf"], { type: "application/pdf" }),
      headers: new Headers(),
    } as Response);

    mockUseMetadata.mockReturnValue({
      app: "store",
      model: "Order",
      metadata: {
        model: "Order",
        verboseNamePlural: "Orders",
        mutations: [{ name: "createOrder", operation: "create", allowed: true }],
        templates: [
          {
            key: "store/order/invoice_pdf",
            templateType: "pdf",
            title: "Order invoice",
            endpoint: "/api/templates/store/order/invoice_pdf/%3Cpk%3E/",
            allowed: true,
            clientDataFields: ["notes"],
          },
        ],
      },
    });
    mockUseTable.mockReturnValue({
      data: [{ id: 1, desc: "Order #1" }],
      rowSelection: { "1": true },
    });

    render(<DynamicContentSectionsHarness />);

    await openPdfTemplatesDropdown();
    fireEvent.click(screen.getByText(/Order invoice/i));
    const printDialog = screen.queryByTestId("print-dialog");
    if (printDialog) {
      fireEvent.click(screen.getByRole("button", { name: /submit-dialog/i }));
    }

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [requestUrl, options] = fetchMock.mock.calls[0] ?? [];
    expect(String(requestUrl)).toContain("/api/v1/templates/store/order/invoice_pdf/1/");
    if (printDialog) {
      expect(String(requestUrl)).toContain("notes=client");
    }
    expect(options).toMatchObject({
      method: "GET",
      credentials: "include",
      headers: expect.objectContaining({
        Authorization: "Bearer test-token",
        "X-CSRFToken": "csrf-token",
      }),
    });
  });

  it("calls excel template endpoint directly with selected row id", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      blob: async () =>
        new Blob(["excel"], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      headers: new Headers({
        "content-disposition": 'attachment; filename="orders.xlsx"',
      }),
    } as Response);

    mockUseMetadata.mockReturnValue({
      app: "store",
      model: "Order",
      metadata: {
        model: "Order",
        verboseNamePlural: "Orders",
        mutations: [{ name: "createOrder", operation: "create", allowed: true }],
        templates: [
          {
            key: "store/order/export_excel",
            templateType: "excel",
            title: "Order export",
            endpoint: "/api/excel/store/order/export_excel/",
            allowed: true,
          },
        ],
      },
    });
    mockUseTable.mockReturnValue({
      data: [{ id: 1, desc: "Order #1" }],
      rowSelection: { "1": true },
    });

    render(<DynamicContentSectionsHarness />);

    await openExcelTemplatesDropdown();
    fireEvent.click(screen.getByText(/Order export/i));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [requestUrl, options] = fetchMock.mock.calls[0] ?? [];
    expect(String(requestUrl)).toContain("/api/v1/excel/store/order/export_excel/");
    expect(String(requestUrl)).toContain("pk=1");
    expect(options).toMatchObject({
      method: "GET",
      credentials: "include",
      headers: expect.objectContaining({
        Authorization: "Bearer test-token",
        "X-CSRFToken": "csrf-token",
      }),
    });
    expect(screen.queryByTestId("print-dialog")).not.toBeInTheDocument();
  });

  it("sends one merged PDF request for multiple selected rows in table order", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      blob: async () => new Blob(["pdf"], { type: "application/pdf" }),
      headers: new Headers(),
    } as Response);

    mockUseMetadata.mockReturnValue({
      app: "store",
      model: "Order",
      metadata: {
        model: "Order",
        verboseNamePlural: "Orders",
        mutations: [{ name: "createOrder", operation: "create", allowed: true }],
        templates: [
          {
            key: "store/order/invoice_pdf",
            templateType: "pdf",
            title: "Order invoice",
            endpoint: "/api/templates/store/order/invoice_pdf/<pk>/",
            allowed: true,
          },
        ],
      },
    });
    mockUseTable.mockReturnValue({
      data: [{ id: 4 }, { id: 2 }, { id: 9 }],
      rowSelection: { "9": true, "2": true },
    });

    render(<DynamicContentSectionsHarness />);

    await openPdfTemplatesDropdown();
    fireEvent.click(screen.getByText(/Order invoice/i));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [requestUrl] = fetchMock.mock.calls[0] ?? [];
    const url = String(requestUrl);
    expect(url).toContain("/api/v1/templates/store/order/invoice_pdf/2/");
    expect(url).toMatch(/merge_pks=2(%2C|,)9/);
  });

  it("keeps denied template actions visible and disabled with denial reason", async () => {
    mockUseMetadata.mockReturnValue({
      app: "store",
      model: "Product",
      metadata: {
        model: "Product",
        verboseNamePlural: "Products",
        mutations: [{ name: "createProduct", operation: "create", allowed: true }],
        templates: [
          {
            key: "store/product/fact_sheet_pdf",
            templateType: "pdf",
            title: "Product fact sheet (PDF)",
            endpoint: "/api/templates/store/product/fact_sheet_pdf/<pk>/",
            allowed: false,
            denialReason: "Missing permission to generate this document.",
          },
        ],
      },
    });
    mockUseTable.mockReturnValue({
      data: [{ id: 1, name: "Product #1" }],
      rowSelection: {},
    });

    render(<DynamicContentSectionsHarness />);

    await openPdfTemplatesDropdown();
    const actionItem = screen.getByRole("button", {
      name: /Product fact sheet/i,
    });
    expect(actionItem).toHaveAttribute("data-disabled");
    expect(actionItem).toHaveAttribute(
      "title",
      "Missing permission to generate this document.",
    );
  });
});
