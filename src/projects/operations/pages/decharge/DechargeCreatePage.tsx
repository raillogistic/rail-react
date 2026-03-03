import { useState } from "react";
import {
  ModelForm,
  type ModelFormMutationOutcome,
  type ModelFormProps,
} from "@/widgets/model-form";

type DechargeCreateValues = {
  lignes?: Array<Record<string, unknown>>;
};

type SubmitFeedbackTone = "success" | "error";

type SubmitFeedback = {
  tone: SubmitFeedbackTone;
  message: string;
};

const DECHARGE_NESTED_CONFIG: NonNullable<
  ModelFormProps<DechargeCreateValues>["nested"]
> = {
  lignes: {
    title: "Lignes de decharge",
    description: "Ajoutez au moins une ligne article + quantite + etat.",
    itemLabel: "Ligne",
    onlyFields: [
      "article",
      "qteSortie",
      "etatSortie",
      "serial",
      // "metadata_snapshot",
    ],
    customOrder: [
      "article",
      "qteSortie",
      "etatSortie",
      "serial",
      "metadataSnapshot",
    ],
    fieldsOrder: "custom",
    columns: 4,

    collapsible: true,

    addButton: {
      enabled: true,
      label: "Ajouter une ligne",
    },
    sortable: {
      enabled: true,
      mode: "buttons",
    },
  },
};

function resolveSubmitFeedback(
  result: ModelFormMutationOutcome,
): SubmitFeedback {
  if (result.ok && !result.conflict) {
    return {
      tone: "success",
      message: "Decharge enregistree avec succes.",
    };
  }

  if (result.conflict) {
    return {
      tone: "error",
      message:
        "Conflit detecte pendant la creation. Rechargez les donnees puis reessayez.",
    };
  }

  return {
    tone: "error",
    message:
      result.errors[0]?.message ??
      "La decharge n'a pas pu etre enregistree. Verifiez les champs saisis.",
  };
}

export function DechargeCreatePage() {
  const [submitFeedback, setSubmitFeedback] = useState<SubmitFeedback | null>(
    null,
  );

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Creer une decharge
        </h1>
      </header>
      {submitFeedback ? (
        <div
          className={
            submitFeedback.tone === "success"
              ? "rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700"
              : "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          }
        >
          {submitFeedback.message}
        </div>
      ) : null}
      <ModelForm
        app="operations"
        model="Decharge"
        mode="CREATE"
        description="Saisissez les informations de la decharge puis ajoutez les lignes d'articles."
        onlyFields={[
          "beneficiaire",
          "dateDecharge",
          "site",
          "commentaire",
          "pieceJointeUrl",
          "lignes",
        ]}
        includeNested
        nested={DECHARGE_NESTED_CONFIG}
        state={{
          persistKey: "operations.decharge.create.draft",
        }}
        behavior={{
          validate: (values) => {
            const lines = values.lignes;
            if (Array.isArray(lines) && lines.length > 0) return undefined;
            return { lignes: "Ajoutez au moins une ligne de decharge." };
          },
        }}
        layout={{
          columns: 4,
          showSectionHeaders: true,
          ordering: {
            enabled: true,
            tailing: ["lignes"],
          },
        }}
        actions={{
          submitLabel: "Enregistrer la decharge",
          resetLabel: "Reinitialiser",
          position: "sticky-bottom",
          showDirtyIndicator: true,
          confirmSubmit: {
            enabled: true,
            title: "Confirmer la creation",
            message: "Voulez-vous enregistrer cette decharge et ses lignes ?",
          },
        }}
        onSubmitResult={(result) => {
          setSubmitFeedback(resolveSubmitFeedback(result));
        }}
        loadingFallback={
          <div className="rounded-md border p-3 text-sm text-muted-foreground">
            Chargement du formulaire de creation de decharge...
          </div>
        }
        emptySchemaFallback={
          <div className="rounded-md border p-3 text-sm text-muted-foreground">
            Aucun champ disponible pour la creation de decharge.
          </div>
        }
      />
    </section>
  );
}

export default DechargeCreatePage;
