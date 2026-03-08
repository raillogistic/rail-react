import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ModelDynamicDetailProps } from "@/widgets/model-details/config/types";
import type { ModelFormProps } from "@/widgets/model-form/types.model";
import { RowActions } from "../row/RowActions";

const mockUseMetadata = vi.fn();
const mockUseTable = vi.fn();
const mockNavigate = vi.fn();
const modelFormSpy = vi.hoisted(() => vi.fn());
const modelDetailSpy = vi.hoisted(() => vi.fn());
const customMutationsDropdownSpy = vi.hoisted(() => vi.fn());
const modelTemplateActionSpy = vi.hoisted(() => vi.fn());
const modelTemplatesDropdownSpy = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => ({
 success: vi.fn(),
 error: vi.fn(),
 info: vi.fn(),
}));

vi.mock("../../context/MetadataContext", () => ({
 useMetadata: () => mockUseMetadata(),
}));

vi.mock("../../context/TableContext", () => ({
 useTable: () => mockUseTable(),
}));

vi.mock("@apollo/client", () => ({
 gql: (parts: TemplateStringsArray, ...values: unknown[]) =>
 parts.reduce(
 (acc, chunk, index) =>`${acc}${chunk}${String(values[index] ?? "")}`,
 "",
 ),
 useMutation: () => [vi.fn(), { loading: false }],
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
 toast: toastMock,
}));

vi.mock("@/shared/ui/kit/tooltip", () => ({
 TooltipProvider: ({ children }: { children: React.ReactNode }) => (
 <div>{children}</div>
 ),
 Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
 TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
 <>{children}</>
 ),
 TooltipContent: ({ children }: { children: React.ReactNode }) => (
 <div>{children}</div>
 ),
}));

vi.mock("@/shared/ui/kit/button", () => ({
 Button: (props: {
 children: React.ReactNode;
 disabled?: boolean;
 onClick?: () => void;
 className?: string;
 "aria-label"?: string;
 }) => (
 <button
 type="button"
 disabled={props.disabled}
 className={props.className}
 aria-label={props["aria-label"]}
 onClick={props.onClick}
 >
 {props.children}
 </button>
 ),
}));

vi.mock("@/shared/ui/kit/dropdown-menu", () => ({
 DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
 DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
 <>{children}</>
 ),
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
 onClick?: () => void;
 }) => (
 <button type="button" disabled={props.disabled} onClick={props.onClick}>
 {props.children}
 </button>
 ),
}));

vi.mock("@/shared/ui/kit/alert-dialog", () => ({
 AlertDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
 AlertDialogAction: ({
 children,
 onClick,
 }: {
 children: React.ReactNode;
 onClick?: () => void;
 }) => (
 <button type="button" onClick={onClick}>
 {children}
 </button>
 ),
 AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
 <button type="button">{children}</button>
 ),
 AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
 <div>{children}</div>
 ),
 AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
 <div>{children}</div>
 ),
 AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
 <div>{children}</div>
 ),
 AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
 <div>{children}</div>
 ),
 AlertDialogTitle: ({ children }: { children: React.ReactNode }) => (
 <div>{children}</div>
 ),
}));

vi.mock("@/shared/ui/kit/badge", () => ({
 Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("../ModelTableOverlays", () => ({
 FormOverlay: (props: {
 mode: "modal" | "drawer";
 open: boolean;
 title: React.ReactNode;
 children: React.ReactNode;
 }) =>
 props.open ? (
 <div data-testid={`update-overlay-${props.mode}`}>
 <div>{props.title}</div>
 {props.children}
 </div>
 ) : null,
 ActionDialog: () => null,
 PrintDialog: () => null,
}));

vi.mock("@/widgets/model-form", () => ({
 ModelForm: (props: ModelFormProps<Record<string, unknown>>) => {
 modelFormSpy(props);
 return (
 <div>
 <button
 type="button"
 onClick={() =>
 props.onSubmitResult?.({
 ok: true,
 conflict: false,
 formErrorKey: "form",
 errors: [],
 })
 }
 >
 submit-update
 </button>
 </div>
 );
 },
}));

vi.mock("@/widgets/model-details", () => ({
 ModelDynamicDetail: (props: ModelDynamicDetailProps) => {
 modelDetailSpy(props);
 return <div data-testid="model-dynamic-detail">{String(props.id)}</div>;
 },
}));

vi.mock("@/widgets/components/CustomMutationsDropdown", () => ({
  CustomMutationsDropdown: (props: Record<string, unknown>) => {
    customMutationsDropdownSpy(props);
    return <div data-testid="custom-mutations-dropdown" />;
  },
}));

vi.mock("@/widgets/components/ModelTemplateAction", () => ({
  ModelTemplateAction: (props: Record<string, unknown>) => {
    modelTemplateActionSpy(props);
    return <div data-testid="model-template-action" />;
  },
}));

vi.mock("@/widgets/components/ModelTemplatesDropdown", () => ({
  ModelTemplatesDropdown: (props: Record<string, unknown>) => {
    modelTemplatesDropdownSpy(props);
    return <div data-testid="model-templates-dropdown" />;
  },
}));

describe("RowActions update integration", () => {
 beforeEach(() => {
 vi.clearAllMocks();
 mockUseMetadata.mockReturnValue({
 app: "store",
 model: "Order",
 metadata: {
 model: "Order",
 verboseName: "Commande",
 mutations: [
 { name: "updateOrder", operation: "update", allowed: true },
 { name: "deleteOrder", operation: "delete", allowed: false },
 ],
 templates: [],
 },
 });
 mockUseTable.mockReturnValue({
 refresh: vi.fn(),
 });
 });

 it("opens default drawer update form and wires id + popup layout", async () => {
 render(
 <RowActions
 row={{ id: 42, name: "Order 42" }}
 data={[{ id: 42, name: "Order 42" }]}
 />,
 );

 fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

 await waitFor(() => {
 expect(screen.getByTestId("update-overlay-drawer")).toBeInTheDocument();
 });

 await waitFor(() => {
 expect(modelFormSpy).toHaveBeenCalled();
 });
 const latestProps = modelFormSpy.mock.calls.at(-1)?.[0] as ModelFormProps<
 Record<string, unknown>
 >;
 expect(latestProps.mode).toBe("update");
 expect(latestProps.objectId).toBe("42");
 expect(latestProps.layout?.variant).toBe("popup");
 });

  it("navigates using href template when update type is link", async () => {
    render(
      <RowActions
        row={{ id: 77 }}
 data={[{ id: 77 }]}
 update={{
 type: "link",
 hrefTemplate: "/orders/:id/edit",
 }}
 />,
 );

 fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

 await waitFor(() => {
 expect(mockNavigate).toHaveBeenCalledWith("/orders/77/edit");
 });
  expect(screen.queryByTestId("update-overlay-drawer")).not.toBeInTheDocument();
  expect(screen.queryByTestId("update-overlay-modal")).not.toBeInTheDocument();
  });

  it("renders detail action before update action in the row toolbar", () => {
    render(
      <RowActions
        row={{ id: 19 }}
        data={[{ id: 19 }]}
      />,
    );

    const detailButton = screen.getByRole("button", { name: "Details" });
    const updateButton = screen.getByRole("button", { name: "Modifier" });
    const order = detailButton.compareDocumentPosition(updateButton);

    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("wires row-scoped metadata dropdown through CustomMutationsDropdown", () => {
    mockUseMetadata.mockReturnValue({
      app: "store",
      model: "Order",
      metadata: {
        model: "Order",
        verboseName: "Commande",
        mutations: [
          { name: "archiveOrder", operation: "custom", allowed: true },
        ],
        templates: [],
      },
    });

    render(
      <RowActions
        row={{ id: 55 }}
        data={[{ id: 55 }]}
      />,
    );

    expect(screen.getByTestId("custom-mutations-dropdown")).toBeInTheDocument();
    const latestProps = customMutationsDropdownSpy.mock.calls.at(-1)?.[0] as
      | {
          data?: { app?: string; model?: string; objectId?: string };
        }
      | undefined;
    expect(latestProps?.data).toEqual({
      app: "store",
      model: "Order",
      objectId: "55",
    });
  });

  it("keeps detail action visible when retrieve is denied but update link mode is enabled", async () => {
    mockUseMetadata.mockReturnValue({
      app: "store",
      model: "Order",
      metadata: {
        model: "Order",
        verboseName: "Commande",
        mutations: [
          { name: "updateOrder", operation: "update", allowed: true },
        ],
        templates: [],
        permissions: {
          canList: true,
          canRetrieve: false,
          canCreate: true,
          canUpdate: true,
          canDelete: false,
          canBulkCreate: false,
          canBulkUpdate: false,
          canBulkDelete: false,
          canExport: false,
        },
      },
    });

    render(
      <RowActions
        row={{ id: 106 }}
        data={[{ id: 106 }]}
        update={{
          type: "link",
          hrefTemplate: "/orders/:id/edit",
        }}
        detail={{
          hrefTemplate: "/orders/:id",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Details" }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/orders/106");
    });
  });

  it("opens detail popup and renders ModelDynamicDetail with resolved overrides", async () => {
    render(
      <RowActions
        row={{ id: 42, externalId: "row-42" }}
        data={[{ id: 42, externalId: "row-42" }]}
        detail={{
          type: "modal",
          title: ({ rowId }) => `Details ${rowId}`,
          resolveObjectId: ({ row }) => String(row.externalId ?? ""),
          form: { title: "Inline edit" },
          resolveBaseDetail: ({ rowId }) => ({
            className: `detail-${rowId}`,
          }),
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Details" }));

    await waitFor(() => {
      expect(screen.getByText("Details 42")).toBeInTheDocument();
      expect(modelDetailSpy).toHaveBeenCalled();
    });

    const latestProps = modelDetailSpy.mock.calls.at(-1)?.[0] as ModelDynamicDetailProps;
    expect(latestProps.app).toBe("store");
    expect(latestProps.model).toBe("Order");
    expect(latestProps.id).toBe("row-42");
    expect(latestProps.baseDetail?.className).toBe("detail-42");
    expect(
      latestProps.baseDetail?.actions?.updateForm?.modelFormProps?.title,
    ).toBe("Inline edit");
  });

  it("uses detail link navigation when clicking detail and update.type is link", async () => {
    render(
      <RowActions
        row={{ id: 105 }}
        data={[{ id: 105 }]}
        update={{
          type: "link",
          hrefTemplate: "/orders/:id/edit",
        }}
        detail={{
          type: "link",
          hrefTemplate: "/orders/:id",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Details" }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/orders/105");
    });
  });

  it("closes popup and refetches table after successful update submit", async () => {
    const refetch = vi.fn().mockResolvedValue(undefined);

 render(
 <RowActions
 row={{ id: 90 }}
 data={[{ id: 90 }]}
 refetch={refetch}
 update={{ type: "modal" }}
 />,
 );

 fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

 await waitFor(() => {
 expect(screen.getByTestId("update-overlay-modal")).toBeInTheDocument();
 });

 fireEvent.click(screen.getByRole("button", { name: "submit-update" }));

 await waitFor(() => {
 expect(refetch).toHaveBeenCalledTimes(1);
 expect(
 screen.queryByTestId("update-overlay-modal"),
 ).not.toBeInTheDocument();
 });
 });

 it("wires a single row template through ModelTemplateAction", () => {
 mockUseMetadata.mockReturnValue({
 app: "store",
 model: "Order",
 metadata: {
 model: "Order",
 verboseName: "Commande",
 mutations: [{ name: "updateOrder", operation: "update", allowed: true }],
 templates: [
 {
 key: "invoice_pdf",
 title: "Invoice",
 endpoint: "/api/templates/store/order/invoice_pdf/<pk>/",
 templateType: "pdf",
 allowed: true,
 },
 ],
 },
 });

 render(
 <RowActions
 row={{ id: 12 }}
 data={[{ id: 12 }]}
 />,
 );

 expect(screen.getByTestId("model-template-action")).toBeInTheDocument();
 const latestProps = modelTemplateActionSpy.mock.calls.at(-1)?.[0] as
   | {
       data?: {
         app?: string;
         model?: string;
         funcName?: string;
         objectId?: string;
       };
       onPdfPreview?: unknown;
     }
   | undefined;
 expect(latestProps?.data).toEqual({
   app: "store",
   model: "Order",
   funcName: "invoice_pdf",
   objectId: "12",
 });
 expect(latestProps?.onPdfPreview).toBeUndefined();
 });

 it("wires multiple row templates through ModelTemplatesDropdown", () => {
 mockUseMetadata.mockReturnValue({
 app: "store",
 model: "Order",
 metadata: {
 model: "Order",
 verboseName: "Commande",
 mutations: [{ name: "updateOrder", operation: "update", allowed: true }],
 templates: [
 {
 key: "invoice_pdf",
 title: "Invoice",
 endpoint: "/api/templates/store/order/invoice_pdf/<pk>/",
 templateType: "pdf",
 allowed: true,
 },
 {
 key: "invoice_excel",
 title: "Invoice XLSX",
 endpoint: "/api/templates/store/order/invoice_excel/<pk>/",
 templateType: "excel",
 allowed: true,
 },
 ],
 },
 });

 render(
 <RowActions
 row={{ id: 12 }}
 data={[{ id: 12 }]}
 />,
 );

 expect(screen.getByTestId("model-templates-dropdown")).toBeInTheDocument();
 const latestProps = modelTemplatesDropdownSpy.mock.calls.at(-1)?.[0] as
   | {
       data?: {
         app?: string;
         model?: string;
         objectId?: string;
       };
       onPdfPreview?: unknown;
     }
   | undefined;
 expect(latestProps?.data).toEqual({
   app: "store",
   model: "Order",
   objectId: "12",
 });
 expect(latestProps?.onPdfPreview).toBeUndefined();
 });
});
