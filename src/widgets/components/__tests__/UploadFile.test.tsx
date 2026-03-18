import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Pen } from "lucide-react";
import { DropdownMenu, DropdownMenuContent } from "@/shared/ui/kit/dropdown-menu";
import { UploadFile } from "../UploadFile";

const executeMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/graphql/graphql/mutations/hooks", () => ({
  useModelUpdateMutation: () => ({
    execute: executeMock,
    loading: false,
  }),
}));

vi.mock("@/shared/ui/kit/sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

describe("UploadFile", () => {
  beforeEach(() => {
    executeMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  it("uploads the selected file with a dynamic field payload", async () => {
    executeMock.mockResolvedValue({
      data: {
        response: {
          ok: true,
          errors: [],
        },
      },
    });

    const onUploaded = vi.fn();

    render(
      <UploadFile
        title="Ajouter la piece jointe"
        model="Decharge"
        id={24}
        field="piece_jointe_url"
        onUploaded={onUploaded}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter la piece jointe" }),
    );

    const file = new File(["hello"], "piece.png", { type: "image/png" });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;

    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { files: [file] } });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(executeMock).toHaveBeenCalledTimes(1);
    });

    expect(executeMock).toHaveBeenCalledWith({
      id: 24,
      input: {
        piece_jointe_url: file,
      },
    });
    expect(onUploaded).toHaveBeenCalledWith({
      ok: true,
      errors: [],
    });
    expect(toastSuccessMock).toHaveBeenCalledWith("Fichier enregistre.");
  });

  it("shows a local error when submit is attempted without a file", async () => {
    render(<UploadFile model="Decharge" id={24} field="piece_jointe_url" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Televerser un fichier" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(
        screen.getByText("Selectionnez un fichier avant de continuer."),
      ).toBeInTheDocument();
    });

    expect(executeMock).not.toHaveBeenCalled();
  });

  it("renders as a dropdown menu item when menu is true", async () => {
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <UploadFile
            title="Modifier la piece jointe"
            model="Decharge"
            id={24}
            field="piece_jointe_url"
            menu
            icon={<Pen />}
          />
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const trigger = screen.getByText("Modifier la piece jointe");
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Selectionnez un fichier puis confirmez pour l'enregistrer sur cet element.",
        ),
      ).toBeInTheDocument();
    });
  });
});
