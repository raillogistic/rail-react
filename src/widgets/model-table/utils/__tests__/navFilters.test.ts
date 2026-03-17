import { describe, expect, it } from "vitest";
import type { ModelTableNavFiltersConfig } from "../../config/types";
import {
  getActiveNavFilterCount,
  mergeModelTableQueryVariables,
  resolveInitialNavFilterSelections,
  resolveNavFilterVariables,
} from "../navFilters";

const navFilters: ModelTableNavFiltersConfig = {
  groups: [
    {
      key: "status",
      label: "Status",
      items: [
        { key: "all", label: "All", clear: true },
        {
          key: "validated",
          label: "Validated",
          variables: {
            where: { statut: { eq: "validee" } },
            presets: ["validated"],
          },
        },
      ],
    },
    {
      key: "period",
      label: "Period",
      items: [
        { key: "all", label: "All", clear: true },
        {
          key: "this_month",
          label: "This month",
          resolveVariables: () => ({
            where: { dateDecharge: { between: ["2026-03-01", "2026-03-31"] } },
            orderBy: ["-dateDecharge"],
          }),
        },
      ],
    },
  ],
};

describe("navFilters utils", () => {
  it("resolves initial selections from clear items", () => {
    expect(resolveInitialNavFilterSelections(navFilters)).toEqual({
      status: "all",
      period: "all",
    });
  });

  it("merges active nav filter variables across groups", () => {
    const variables = resolveNavFilterVariables(navFilters, {
      status: "validated",
      period: "this_month",
    });

    expect(variables).toEqual({
      where: {
        AND: [
          { statut: { eq: "validee" } },
          { dateDecharge: { between: ["2026-03-01", "2026-03-31"] } },
        ],
      },
      presets: ["validated"],
      orderBy: ["-dateDecharge"],
    });
  });

  it("merges nav filter variables with advanced filter variables", () => {
    const merged = mergeModelTableQueryVariables(
      {
        where: { beneficiaire: { id: { eq: "42" } } },
        presets: ["recent"],
        orderBy: ["numero"],
        customFlag: "base",
      },
      {
        where: { statut: { eq: "validee" } },
        presets: ["validated"],
        orderBy: ["-dateDecharge"],
        customFlag: "nav",
      },
    );

    expect(merged).toEqual({
      where: {
        AND: [
          { beneficiaire: { id: { eq: "42" } } },
          { statut: { eq: "validee" } },
        ],
      },
      presets: ["recent", "validated"],
      orderBy: ["-dateDecharge"],
      customFlag: "nav",
    });
  });

  it("counts only non-clear active groups", () => {
    expect(
      getActiveNavFilterCount(navFilters, {
        status: "validated",
        period: "all",
      }),
    ).toBe(1);
  });
});
