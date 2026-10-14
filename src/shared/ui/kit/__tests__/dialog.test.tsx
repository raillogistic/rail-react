/** Focus regression for controlled dialogs without a Radix trigger. */
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../dialog";

/** Represent the reception dialogs' externally controlled opening behavior. */
function ControlledDialog() {
  const [open, setOpen] = useState(false);
  return <>
    <button onClick={() => setOpen(true)}>Historique des réceptions</button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent restoreFocusToOpener>
        <DialogTitle>Réceptions</DialogTitle>
        <DialogDescription>Historique du dossier</DialogDescription>
        <button onClick={() => setOpen(false)}>Fermer</button>
      </DialogContent>
    </Dialog>
  </>;
}

describe("Controlled dialog focus", () => {
  it.each(["button", "escape"])("restores the opener after closing with %s", async (method) => {
    const user = userEvent.setup();
    render(<ControlledDialog />);
    const opener = screen.getByRole("button", { name: "Historique des réceptions" });
    await user.click(opener);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    if (method === "escape") await user.keyboard("{Escape}");
    else await user.click(screen.getByRole("button", { name: "Fermer" }));
    await waitFor(() => expect(opener).toHaveFocus());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
