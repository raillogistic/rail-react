import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssetAssignmentForm } from "@/projects/operations/forms/AssetAssignmentForm";
import { RestitutionForm } from "@/projects/operations/forms/RestitutionForm";
import { AssetForm } from "../AssetForm";
import { AssetMovementForm } from "../AssetMovementForm";
import { LocationForm } from "../LocationForm";

let latestModelFormProps: any = null;

vi.mock("@/widgets/model-form", () => ({
  ModelForm: (props: any) => {
    latestModelFormProps = props;
    return <div data-testid="model-form-props" />;
  },
}));

describe("domain form guards", () => {
  beforeEach(() => {
    latestModelFormProps = null;
  });

  it("filters assignment beneficiaries and assets to active, allowed choices", () => {
    render(<AssetAssignmentForm />);

    expect(latestModelFormProps.fieldOverrides.asset.graphql.where).toEqual({
      AND: [{ isAssignable: true }, { isActive: { eq: true } }],
    });

    const employeeField = latestModelFormProps.fieldOverrides.assignedToEmployee({
      graphql: {},
    });
    expect(
      employeeField.graphql.where({ values: { assignedToService: "svc-1" } }),
    ).toEqual({
      AND: [{ isActive: { eq: true } }, { service: { eq: "svc-1" } }],
    });

    expect(latestModelFormProps.fieldOverrides.assignedToService.graphql.where).toEqual({
      isActive: { eq: true },
    });
  });

  it("only allows assigned assets and active locations for restitutions", () => {
    render(<RestitutionForm />);

    expect(latestModelFormProps.fieldOverrides.asset.graphql.where).toEqual({
      AND: [
        { administrativeStatus: { eq: "assigned" } },
        { isActive: { eq: true } },
      ],
    });
    expect(latestModelFormProps.fieldOverrides.location.graphql.where).toEqual({
      isActive: { eq: true },
    });
  });

  it("blocks same-location moves and filters non-movable assets", () => {
    render(<AssetMovementForm />);

    expect(latestModelFormProps.fieldOverrides.asset.graphql.where).toEqual({
      AND: [
        { isActive: { eq: true } },
        {
          administrativeStatus: {
            notIn: ["reformed", "disposed", "archived", "lost"],
          },
        },
      ],
    });
    expect(latestModelFormProps.fieldOverrides.toLocation.graphql.where).toEqual({
      isActive: { eq: true },
    });
    expect(
      latestModelFormProps.behavior.validate({
        fromLocation: "loc-1",
        toLocation: "loc-1",
      }),
    ).toEqual({
      toLocation:
        "La nouvelle localisation doit être différente de l'ancienne.",
    });
  });

  it("keeps asset referential choices on active records only", () => {
    render(<AssetForm />);

    expect(latestModelFormProps.fieldOverrides.category.graphql.where).toEqual({
      isActive: { eq: true },
    });
    expect(latestModelFormProps.fieldOverrides.location.graphql.where).toEqual({
      isActive: { eq: true },
    });
    expect(latestModelFormProps.fieldOverrides.supplier.graphql.where).toEqual({
      isActive: { eq: true },
    });
    expect(
      latestModelFormProps.fieldOverrides.actualOwnerSupplier.graphql.where,
    ).toEqual({
      isActive: { eq: true },
    });

    const familyField = latestModelFormProps.fieldOverrides.family({
      graphql: {},
    });
    expect(
      familyField.graphql.where({ values: { category: "cat-1" } }),
    ).toEqual({
      AND: [{ isActive: { eq: true } }, { category: { eq: "cat-1" } }],
    });

    const responsibleEmployeeField =
      latestModelFormProps.fieldOverrides.responsibleEmployee({
        graphql: {},
      });
    expect(
      responsibleEmployeeField.graphql.where({
        values: { responsibleService: "svc-1" },
      }),
    ).toEqual({
      AND: [{ isActive: { eq: true } }, { service: { eq: "svc-1" } }],
    });

    expect(
      latestModelFormProps.fieldOverrides.responsibleService.graphql.where,
    ).toEqual({
      isActive: { eq: true },
    });
  });

  it("restricts location parents to active nodes with valid hierarchy levels", () => {
    render(<LocationForm />);

    const parentField = latestModelFormProps.fieldOverrides.parent({
      graphql: {},
    });

    expect(parentField.visible({ level: "site" })).toBe(false);
    expect(parentField.visible({ level: "building" })).toBe(true);
    expect(parentField.graphql.where({ values: { level: "zone" } })).toEqual({
      AND: [
        { isActive: { eq: true } },
        { level: { in: ["office", "room"] } },
      ],
    });
  });
});
