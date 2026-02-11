import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportCommitPanel } from "../components/ImportCommitPanel";
import { ImportSimulationPanel } from "../components/ImportSimulationPanel";

describe("ModelImport commit flow", () => {
  it("runs validate/simulate/commit callbacks when summary allows commit", async () => {
    const user = userEvent.setup();
    const validateSpy = vi.fn(async () => undefined);
    const simulateSpy = vi.fn(async () => undefined);
    const commitSpy = vi.fn(async () => undefined);
    const deleteSpy = vi.fn(async () => undefined);

    render(
      <div>
        <ImportSimulationPanel
          onValidate={validateSpy}
          onSimulate={simulateSpy}
          validationSummary={{
            totalRows: 2,
            validRows: 2,
            invalidRows: 0,
            blockingIssues: 0,
            warnings: 0,
          }}
          simulationSummary={{
            canCommit: true,
            wouldCreate: 2,
            wouldUpdate: 0,
            blockingIssues: 0,
            warnings: 0,
            durationMs: 12,
          }}
        />
        <ImportCommitPanel
          simulationSummary={{
            canCommit: true,
            wouldCreate: 2,
            wouldUpdate: 0,
            blockingIssues: 0,
            warnings: 0,
            durationMs: 12,
          }}
          onCommit={commitSpy}
          onDeleteBatch={deleteSpy}
        />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: /^valider$/i }));
    await user.click(screen.getByRole("button", { name: /simuler/i }));
    await user.click(screen.getByRole("button", { name: /commiter le lot/i }));
    await user.click(screen.getByRole("button", { name: /supprimer le lot/i }));

    expect(validateSpy).toHaveBeenCalledTimes(1);
    expect(simulateSpy).toHaveBeenCalledTimes(1);
    expect(commitSpy).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalledTimes(1);
  });

  it("blocks commit while simulation reports blocking issues", () => {
    render(
      <ImportCommitPanel
        simulationSummary={{
          canCommit: false,
          wouldCreate: 0,
          wouldUpdate: 0,
          blockingIssues: 2,
          warnings: 0,
          durationMs: 20,
        }}
        onCommit={async () => undefined}
        onDeleteBatch={async () => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: /commiter le lot/i })).toBeDisabled();
    expect(screen.getByText(/le commit est bloque/i)).toBeInTheDocument();
  });
});
