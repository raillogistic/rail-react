import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ModelFormProps } from "@/widgets/model-form/types.model";
import { RowActions } from "../row/RowActions";

const mockUseMetadata = vi.fn();
const mockUseTable = vi.fn();
const mockNavigate = vi.fn();
const modelFormSpy = vi.hoisted(() => vi.fn());
const executeTemplateForRowsMock = vi.hoisted(() => vi.fn());
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
 useApolloClient: () => ({
 mutate: vi.fn(),
 }),
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

vi.mock("../../utils/templateExecution", async () => {
 const actual = await vi.importActual<typeof import("../../utils/templateExecution")>(
 "../../utils/templateExecution",
 );
 return {
 ...actual,
 executeTemplateForRows: executeTemplateForRowsMock,
 };
});

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

describe("RowActions update integration", () => {
 beforeEach(() => {
 vi.clearAllMocks();
 executeTemplateForRowsMock.mockResolvedValue({ templateType: "pdf", count: 1 });
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

 it("renders a direct printer button when exactly one template is available", async () => {
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

 fireEvent.click(screen.getByRole("button", { name: "Template: Invoice" }));

 await waitFor(() => {
 expect(executeTemplateForRowsMock).toHaveBeenCalledWith(
 expect.objectContaining({ key: "invoice_pdf" }),
 ["12"],
 {},
 );
 });
 expect(screen.queryByText("Extractions")).not.toBeInTheDocument();
 });

 it("keeps template dropdown when multiple templates are available", () => {
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

 expect(screen.getByText("Extractions")).toBeInTheDocument();
 });
});
