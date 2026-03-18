import { useParams } from "react-router-dom";
import type { OperationsRestitution } from "@/models";
import { ModelForm } from "@/widgets/model-form";
import { now } from "@/widgets/model-form/inputs/datetime";

export function RestitutionFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <ModelForm<OperationsRestitution>
      app="operations"
      model="Restitution"
      objectId={isUpdate ? id : undefined}
      title={
        isUpdate ? "Modification de la restitution" : "Creation de restitution"
      }
      description="Centralisez la source, le constat de retour et les observations administratives dans un seul formulaire."
      mode={isUpdate ? "UPDATE" : "CREATE"}
      onlyFields={[
        "origine",
        "decharge",
        "legacySource",
        "dateRestitution",
        "recuPar",
        "etatRetour",
        "serialRetour",
        "pieceJointeUrl",
        "customIntro",
        "observation",
        "commentaire",
      ]}
      generatedSections={[
        {
          id: "source",
          title: "Source de restitution",
          description:
            "Identifiez l'origine du retour et le document de rattachement.",
          fields: ["origine", "decharge", "legacySource"],
        },
        {
          id: "return-state",
          title: "Constat de retour",
          description:
            "Renseignez les informations constatees lors de la reception du materiel.",
          fields: [
            "dateRestitution",
            "recuPar",
            "etatRetour",
            "serialRetour",
            "pieceJointeUrl",
          ],
        },
        {
          id: "notes",
          title: "Observations et contexte",
          description:
            "Ajoutez l'introduction personnalisee et les commentaires utiles au dossier.",
          fields: ["customIntro", "observation", "commentaire"],
        },
      ]}
      fieldOverrides={{
        origine: {
          description: "Choisissez le flux d'origine du materiel restitue.",
        },
        decharge: {
          colSpan: 2,
          visible: (values) => values.origine === "decharge",
        },
        legacySource: {
          colSpan: 2,
          visible: (values) => values.origine === "legacy",
        },
        dateRestitution: {
          description: "Date et heure effectives du retour.",
        },
        recuPar: {
          description: "Charge du patrimoine ou agent ayant recu le materiel.",
        },
        pieceJointeUrl: {
          colSpan: 2,
          description: "Ajoutez un PV, une photo ou tout justificatif de retour.",
        },
        customIntro: {
          colSpan: 3,
          label: "Introduction personnalisee",
        },
        observation: {
          colSpan: 3,
        },
        commentaire: {
          colSpan: 3,
        },
      }}
      layout={{
        columns: 3,
      }}
      state={{
        defaultValues: {
          origine: "decharge",
          dateRestitution: now(),
        },
      }}
      actions={{
        submitLabel: isUpdate
          ? "Enregistrer les modifications"
          : "Enregistrer la restitution",
        resetLabel: "Reinitialiser",
        position: "sticky-bottom",
        showDirtyIndicator: true,
        confirmSubmit: {
          enabled: true,
          title: isUpdate
            ? "Confirmer la modification"
            : "Confirmer la creation",
          message: isUpdate
            ? "Voulez-vous enregistrer les modifications de cette restitution ?"
            : "Voulez-vous enregistrer cette restitution ?",
        },
      }}
    />
  );
}

export default RestitutionFormPage;
