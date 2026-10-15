import type { TypingAssetMovement } from "@/test/typingModels";
import { ModelForm } from "@/widgets/model-form";

const validDechargeForm = (
  <ModelForm<TypingAssetMovement>
    app="locations"
    model="AssetMovement"
    mode="CREATE"
    onlyFields={["status", "movementDate", "reason", "reference"]}
    state={{
      defaultValues: {
        status: "pending",
        movementDate: "2026-03-11",
        reason: "mouvement interne",
      },
    }}
    behavior={{
      dependencies: {
        status: {
          watch: ["reason"],
          effect: "clear",
        },
      },
    }}
    fieldOverrides={{
      reason: { colSpan: 2 },
    }}
    generatedSections={[
      {
        id: "main",
        fields: ["status", "movementDate", "reason"],
      },
    ]}
    layout={{
      ordering: {
        tailing: ["reason"],
        rules: [
          {
            field: "movementDate",
            place: "after",
            anchor: "status",
          },
        ],
      },
    }}
    nested={{
      toLocation: {
        onlyFields: ["name", "code", "address"],
        excludeFields: ["isActive"],
        customOrder: ["name", "code", "address"],
      },
    }}
  />
);

void validDechargeForm;

const invalidOnlyFields = (
  <ModelForm<TypingAssetMovement>
    app="locations"
    model="AssetMovement"
    mode="CREATE"
    // @ts-expect-error "etat" is not a field on TypingAssetMovement form values
    onlyFields={["etat"]}
  />
);

void invalidOnlyFields;

const invalidRelationDefaultValue = (
  <ModelForm<TypingAssetMovement>
    app="locations"
    model="AssetMovement"
    mode="CREATE"
    state={{
      defaultValues: {
        // @ts-expect-error relation-backed form values use scalar identifiers by default
        toLocation: { id: 1 },
      },
    }}
  />
);

void invalidRelationDefaultValue;

const invalidNestedRelationKey = (
  <ModelForm<TypingAssetMovement>
    app="locations"
    model="AssetMovement"
    mode="CREATE"
    // @ts-expect-error shorthand nested relation keys must exist on the form shape
    nested={["missingRelation"]}
  />
);

void invalidNestedRelationKey;

const invalidOrderingField = (
  <ModelForm<TypingAssetMovement>
    app="locations"
    model="AssetMovement"
    mode="CREATE"
    layout={{
      ordering: {
        // @ts-expect-error ordering field names must exist on TypingAssetMovement form values
        tailing: ["etat"],
      },
    }}
  />
);

void invalidOrderingField;

const invalidFieldOverrideKey = (
  <ModelForm<TypingAssetMovement>
    app="locations"
    model="AssetMovement"
    mode="CREATE"
    fieldOverrides={{
      // @ts-expect-error field override keys must exist on TypingAssetMovement form values
      etat: { colSpan: 2 },
    }}
  />
);

void invalidFieldOverrideKey;

const invalidNestedFieldOverrideKey = (
  <ModelForm<TypingAssetMovement>
    app="locations"
    model="AssetMovement"
    mode="CREATE"
    nested={{
      toLocation: {
        fieldOverrides: {
          // @ts-expect-error nested field override keys must exist on LocationsLocation form values
          missingField: { colSpan: 2 },
        },
      },
    }}
  />
);

void invalidNestedFieldOverrideKey;

const invalidNestedScalarField = (
  <ModelForm<TypingAssetMovement>
    app="locations"
    model="AssetMovement"
    mode="CREATE"
    nested={{
      // @ts-expect-error nested config keys must point to relation fields on TypingAssetMovement
      status: {
        onlyFields: ["nom"],
      },
    }}
  />
);

void invalidNestedScalarField;
