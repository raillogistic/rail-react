/** An optional edit page must never become a broken post-create destination. */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SupplierIntakeBatchFormPage } from "../SupplierIntakeBatchFormPage";
import { PartnerRoutesContext } from "../../../routeSelection";

const { navigate, execute, success } = vi.hoisted(() => ({ navigate: vi.fn(), execute: vi.fn(), success: vi.fn() }));
vi.mock("react-router-dom", async () => ({
  ...await vi.importActual("react-router-dom"), useNavigate: () => navigate, useParams: () => ({}),
}));
vi.mock("@apollo/client", async () => ({
  ...await vi.importActual("@apollo/client"),
  useQuery: () => ({ data: undefined, loading: false }),
  useMutation: () => [vi.fn(), { loading: false }],
}));
vi.mock("@/shared/api/graphql/graphql/mutations/hooks", () => {
  const useMutation = () => ({ execute, mutationName: "createBatch", loading: false });
  return { useModelCreateMutation: useMutation, useModelUpdateMutation: useMutation, useModelDeleteMutation: useMutation };
});
vi.mock("@/shared/ui/kit/sonner", () => ({ toast: { success, error: vi.fn() } }));
vi.mock("@/widgets/model-form/inputs/form", () => ({
  default: ({ behavior }: { behavior?: { onSubmit: (values: Record<string, unknown>) => Promise<void> } }) =>
    <button onClick={() => void behavior?.onSubmit({ name: "Liste test", notes: "" })}>Creer la liste</button>,
}));

describe("Supplier intake creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    execute.mockResolvedValue({ data: { createBatch: { ok: true, object: { id: "batch-1" } } } });
  });

  it.each([true, false])("navigates after creation only when edit is enabled (%s)", async enabled => {
    render(<PartnerRoutesContext.Provider value={{ isRouteEnabled: () => enabled }}>
      <SupplierIntakeBatchFormPage />
    </PartnerRoutesContext.Provider>);
    fireEvent.click(screen.getByRole("button", { name: "Creer la liste" }));
    await waitFor(() => expect(success).toHaveBeenCalled());
    expect(execute).toHaveBeenCalledWith({ input: { name: "Liste test", notes: "" } });
    if (enabled) expect(navigate).toHaveBeenCalledWith("/achat/administration/listes-insertion/batch-1/modifier");
    else expect(navigate).not.toHaveBeenCalled();
  });
});
