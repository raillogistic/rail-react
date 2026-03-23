import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const lightModelTableSpy = vi.fn();

vi.mock("@/widgets/model-table", () => ({
  LightModelTable: (props: unknown) => {
    lightModelTableSpy(props);
    return null;
  },
}));

describe("DechargeListPage", () => {
  it("passes the expected LightModelTable props", async () => {
    lightModelTableSpy.mockClear();
    const { DechargeListPageTabs } = await import("./DechargeListPage");
    render(<DechargeListPageTabs />);

    expect(lightModelTableSpy).toHaveBeenCalledTimes(1);
    const props = lightModelTableSpy.mock.calls[0]?.[0] as {
      app?: string;
      model?: string;
      fields?: string[];
      displayToolbar?: boolean;
    };

    expect(props.app).toBe("operations");
    expect(props.model).toBe("Decharge");
    expect(props.displayToolbar).toBe(true);
    expect(props.fields).toEqual([
      "libelle",
      "beneficiaire.name",
      "dateDecharge",
      "pieceJointeUrl",
      "statut",
      "site",
      "codeInventaire",
      "serial",
      "etatSortie.libelle",
      "garder",
      "customIntro",
      "commentaire",
    ]);
  });
});
