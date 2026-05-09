import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ModelFormProps } from "@/widgets/model-form/types.model";
import type { ModelTableCreateConfig } from "../../config/types";
import { ModelTableDialogs } from "../content/ModelTableDialogs";
import { ModelTableTopActions } from "../content/ModelTableTopActions";
import { useModelTableContentController } from "../content/useModelTableContentController";

const mockUseMetadata = vi.fn();
const mockUseTable = vi.fn();
const mockNavigate = vi.fn();
const modelFormSpy = vi.hoisted(() => vi.fn());
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

vi.mock("@/shared/ui/kit/button", () => ({
 Button: (props: {
 children: React.ReactNode;
 disabled?: boolean;
 onClick?: () => void;
 title?: string;
 }) => (
 <button
 type="button"
 disabled={props.disabled}
 onClick={props.onClick}
 title={props.title}
 >
 {props.children}
 </button>
 ),
}));

vi.mock("../ModelTableOverlays", () => ({
 FormOverlay: (props: {
 mode: "modal" | "drawer";
 open: boolean;
 onOpenChange: (open: boolean) => void;
 title: React.ReactNode;
 children: React.ReactNode;
 }) =>
 props.open ? (
 <div data-testid={`create-overlay-${props.mode}`}>
 <div>{props.title}</div>
 <button type="button" onClick={() => props.onOpenChange(false)}>
 close-overlay
 </button>
 {props.children}
 </div>
 ) : null,
 PrintDialog: () => null,
 ActionDialog: () => null,
}));

vi.mock("@/widgets/model-form", () => ({
 ModelForm: (props: ModelFormProps<Record<string, unknown>>) => {
 modelFormSpy(props);
 return (
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
 submit-create
 </button>
 );
 },
}));

/**
 * Props consumed by the create-flow test harness.
 */
type CreateHarnessProps = {
 create?: ModelTableCreateConfig;
};

/**
 * Renders top-actions and dialogs with the shared content controller.
 */
function CreateHarness({ create }: CreateHarnessProps) {
 const controller = useModelTableContentController({ create });
 if (!controller.metadata) {
 return null;
 }
 return (
 <div>
 <ModelTableTopActions controller={controller} />
 <ModelTableDialogs controller={controller} />
 </div>
 );
}

describe("ModelTable top-action create flow", () => {
 beforeEach(() => {
 vi.clearAllMocks();
 mockUseMetadata.mockReturnValue({
 app: "store",
 model: "Order",
 actionBootstrapLoading: false,
 actionDetailsLoading: false,
 actionDetailsLoaded: true,
 ensureActionDetailsLoaded: vi.fn(),
 capabilitiesLoaded: true,
 metadata: {
 model: "Order",
 verboseName: "Commande",
 verboseNamePlural: "Commandes",
 templates: [],
 mutations: [{ name: "createOrder", operation: "create", allowed: true }],
 },
 });
 mockUseTable.mockReturnValue({
 data: [{ id: "1" }],
 queryPage: null,
 rowSelection: {},
 pagination: {
 total: 1,
 page: 1,
 perPage: 25,
 numPages: 1,
 hasNextPage: false,
 hasPreviousPage: false,
 totalKnown: true,
 },
 refresh: vi.fn(),
 loading: false,
 });
 });

 it("opens default drawer create form and enforces popup layout variant", async () => {
 render(<CreateHarness />);

 fireEvent.click(screen.getByRole("button", { name: /Ajouter/i }));

 await waitFor(() => {
 expect(screen.getByTestId("create-overlay-drawer")).toBeInTheDocument();
 });

 const latestProps = modelFormSpy.mock.calls.at(-1)?.[0] as ModelFormProps<
 Record<string, unknown>
 >;
 expect(latestProps.mode).toBe("create");
 expect(latestProps.layout?.variant).toBe("popup");
 });

 it("navigates to link page when create type is link", async () => {
 render(
 <CreateHarness create={{ type: "link", hrefTemplate: "/orders/create" }} />,
 );

 fireEvent.click(screen.getByRole("button", { name: /Ajouter/i }));

 await waitFor(() => {
 expect(mockNavigate).toHaveBeenCalledWith("/orders/create");
 });
 expect(screen.queryByTestId("create-overlay-drawer")).not.toBeInTheDocument();
 expect(screen.queryByTestId("create-overlay-modal")).not.toBeInTheDocument();
 });

 it("closes modal and refreshes table after successful create submit", async () => {
 const refresh = vi.fn();
 mockUseTable.mockReturnValue({
 data: [{ id: "1" }],
 queryPage: null,
 rowSelection: {},
 pagination: {
 total: 1,
 page: 1,
 perPage: 25,
 numPages: 1,
 hasNextPage: false,
 hasPreviousPage: false,
 totalKnown: true,
 },
 refresh,
 loading: false,
 });

 render(<CreateHarness create={{ type: "modal" }} />);

 fireEvent.click(screen.getByRole("button", { name: /Ajouter/i }));

 await waitFor(() => {
 expect(screen.getByTestId("create-overlay-modal")).toBeInTheDocument();
 });

 fireEvent.click(screen.getByRole("button", { name: "submit-create" }));

 await waitFor(() => {
 expect(refresh).toHaveBeenCalledTimes(1);
 expect(screen.queryByTestId("create-overlay-modal")).not.toBeInTheDocument();
 });
 });

 it("disables add top action when create permission is denied", () => {
 mockUseMetadata.mockReturnValue({
 app: "store",
 model: "Order",
 actionBootstrapLoading: false,
 actionDetailsLoading: false,
 actionDetailsLoaded: true,
 ensureActionDetailsLoaded: vi.fn(),
 capabilitiesLoaded: true,
 metadata: {
 model: "Order",
 verboseName: "Commande",
 verboseNamePlural: "Commandes",
 templates: [],
 mutations: [{ name: "createOrder", operation: "create", allowed: false }],
 },
 });

 render(<CreateHarness />);

 expect(screen.getByRole("button", { name: /Ajouter/i })).toBeDisabled();
 });

 it("keeps add top action visible while create capabilities are loading", () => {
 mockUseMetadata.mockReturnValue({
 app: "store",
 model: "Order",
 actionBootstrapLoading: true,
 actionDetailsLoading: false,
 actionDetailsLoaded: false,
 ensureActionDetailsLoaded: vi.fn(),
 capabilitiesLoaded: false,
 metadata: {
 model: "Order",
 verboseName: "Commande",
 verboseNamePlural: "Commandes",
 templates: [],
 mutations: [],
 },
 });

 render(<CreateHarness />);

 const addButton = screen.getByRole("button", { name: /Ajouter/i });
 expect(addButton).toBeDisabled();
 expect(addButton).toHaveAttribute(
 "title",
 "Chargement des capacites de creation...",
 );
 });
});
