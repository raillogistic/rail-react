import { describe, expect, it } from "vitest";
import { pruneResolvedRequiredErrors } from "../common";

describe("pruneResolvedRequiredErrors", () => {
  it("removes stale required errors once the field has a value", () => {
    expect(
      pruneResolvedRequiredErrors(
        ["Ce champ est obligatoire", "Another error"],
        undefined,
      ),
    ).toEqual(["Another error"]);
  });

  it("keeps required errors while the field is still empty", () => {
    expect(
      pruneResolvedRequiredErrors(
        ["Ce champ est obligatoire"],
        "Ce champ est obligatoire",
      ),
    ).toEqual(["Ce champ est obligatoire"]);
  });
});
