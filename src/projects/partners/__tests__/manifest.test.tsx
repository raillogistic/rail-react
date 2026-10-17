/** Preserve the published Partners route and permission contract during extraction. */
import { describe, expect, it } from "vitest";
import { isValidElement, type ReactElement } from "react";
import { render } from "@testing-library/react";
import { PARTNERS_MANIFEST, createAppManifest } from "../manifest";
import { validateManifest } from "@/app/router/manifestValidation";
import { PARTNERS_MASTER_DATA_VIEWS } from "../config/masterDataViews";

describe("Partners manifest", () => {
  it("preserves routes, navigation and access requirements", () => {
    const contract = JSON.parse(JSON.stringify(PARTNERS_MANIFEST, (key, value) =>
      ["element", "icon", "badge"].includes(key) ? undefined : value,
    ));
    expect(contract).toMatchSnapshot();
  });

  it("registers a valid independent Rail app", () => {
    expect(validateManifest(PARTNERS_MANIFEST)).toEqual([]);
    expect(PARTNERS_MANIFEST.routes).toHaveLength(22);
    for (const view of Object.values(PARTNERS_MASTER_DATA_VIEWS)) {
      expect(Array.isArray(view.tableFields) ? view.tableFields.length : 0).toBeGreaterThan(0);
      expect(view.formOnlyFields.length).toBeGreaterThan(0);
      expect(view.detailConfig.layout?.includeFields?.length).toBeGreaterThan(0);
      expect(view.detailConfig.layout?.includeUnassignedFields).toBe(false);
    }
  });

  it("hides excluded CRUD links without changing permissions", () => {
    const id = "achat:suppliers:list";
    const manifest = createAppManifest({ routeIds: [id] });
    expect(manifest.routes.map(route => route.id)).toEqual([id]);
    expect(manifest.routes[0].access).toEqual(PARTNERS_MANIFEST.routes.find(route => route.id === id)?.access);
    expect(manifest.navigation[0].entries).toHaveLength(1);
    expect(manifest.navigation[0].entries[0].children).toEqual([]);
    const provider = manifest.routes[0].element as ReactElement<{ children: ReactElement }>;
    expect(isValidElement(provider)).toBe(true);
    expect(provider.props.children.props).toMatchObject({ createPath: undefined, editPath: undefined, detailPath: undefined });
  });

  it("supports a dashboard-only selection with no link to an excluded list", () => {
    const id = "achat:reports:supplier-dashboard";
    const manifest = createAppManifest({ routeIds: [id], defaultRouteId: id });
    const provider = manifest.routes[0].element as ReactElement<{ children: ReactElement<{ backPath?: string }> }>;
    expect(provider.props.children.props.backPath).toBeUndefined();
    expect(manifest.defaultRoute).toBe("/achat/rapports/achat_supplier_bi_overview");
  });

  it("rejects a selection that would remove an inherited navigation restriction", () => {
    expect(() => createAppManifest({ routeIds: ["achat:supplier-intake-batches:create"], defaultRouteId: "achat:supplier-intake-batches:create" }))
      .toThrow(/ancestor/);
  });

  it("never redirects a legacy page to an excluded destination", () => {
    const manifest = createAppManifest({ routeIds: ["achat:suppliers:list", "achat:legacy-business-sectors"] });
    const legacy = manifest.routes.find(route => route.id === "achat:legacy-business-sectors")!;
    const { getByText } = render(<>{legacy.element}</>);
    expect(getByText("Cette page n'est pas activée.")).toBeInTheDocument();
  });
});
