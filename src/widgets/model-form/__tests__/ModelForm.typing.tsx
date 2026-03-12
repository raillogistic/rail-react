import type { OperationsDecharge } from "@/models";
import { ModelForm } from "@/widgets/model-form";

const validDechargeForm = (
  <ModelForm<OperationsDecharge>
    app="operations"
    model="Decharge"
    mode="CREATE"
    onlyFields={["beneficiaire", "dateDecharge", "etatSortie", "commentaire"]}
    state={{
      defaultValues: {
        beneficiaire: 1,
        dateDecharge: "2026-03-11",
        site: "Rouiba",
      },
    }}
    behavior={{
      dependencies: {
        serial: {
          watch: ["beneficiaire"],
          effect: "clear",
        },
      },
    }}
    fieldOverrides={{
      commentaire: { colSpan: 2 },
    }}
  generatedSections={[
      {
        id: "main",
        fields: ["beneficiaire", "dateDecharge", "commentaire"],
      },
    ]}
    layout={{
      ordering: {
        tailing: ["commentaire"],
        rules: [
          {
            field: "dateDecharge",
            place: "after",
            anchor: "beneficiaire",
          },
        ],
      },
    }}
    nested={{
      restitutions: {
        onlyFields: ["commentaire", "dateRestitution", "etatRetour"],
        excludeFields: ["legacySource"],
        customOrder: ["dateRestitution", "etatRetour", "commentaire"],
      },
    }}
  />
);

void validDechargeForm;

const invalidOnlyFields = (
  <ModelForm<OperationsDecharge>
    app="operations"
    model="Decharge"
    mode="CREATE"
    // @ts-expect-error "etat" is not a field on OperationsDecharge form values
    onlyFields={["etat"]}
  />
);

void invalidOnlyFields;

const invalidRelationDefaultValue = (
  <ModelForm<OperationsDecharge>
    app="operations"
    model="Decharge"
    mode="CREATE"
    state={{
      defaultValues: {
        // @ts-expect-error relation-backed form values use scalar identifiers by default
        beneficiaire: { id: 1 },
      },
    }}
  />
);

void invalidRelationDefaultValue;

const invalidNestedRelationKey = (
  <ModelForm<OperationsDecharge>
    app="operations"
    model="Decharge"
    mode="CREATE"
    // @ts-expect-error shorthand nested relation keys must exist on the form shape
    nested={["missingRelation"]}
  />
);

void invalidNestedRelationKey;

const invalidOrderingField = (
  <ModelForm<OperationsDecharge>
    app="operations"
    model="Decharge"
    mode="CREATE"
    layout={{
      ordering: {
        // @ts-expect-error ordering field names must exist on OperationsDecharge form values
        tailing: ["etat"],
      },
    }}
  />
);

void invalidOrderingField;
