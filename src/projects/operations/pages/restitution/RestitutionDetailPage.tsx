import type React from "react";
import { ArrowUpRight } from "lucide-react";
import { Link, generatePath, useParams } from "react-router-dom";
import type { OperationsRestitution } from "@/models";
import { ROUTES } from "@/projects/operations/config/routes";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { ModelDynamicDetail } from "@/widgets/model-details";
import { ProtectedFileCell } from "@/widgets/model-table/components/ProtectedFileCell";

const STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  validee: "Validee",
  annulee: "Annulee",
};

const ORIGIN_LABELS: Record<string, string> = {
  decharge: "Decharge",
  legacy: "Legacy",
};

export function RestitutionDetailPage() {
  const { id = "" } = useParams();

  return (
    <ModelDynamicDetail<OperationsRestitution>
      app="operations"
      model="Restitution"
      id={id}
      baseDetail={{
        header: {
          title: (data) =>
            data?.numero
              ? `Restitution ${data.numero}`
              : data?.desc || "Detail restitution",
          frame: {
            description: (data) =>
              data?.decharge?.numero
                ? `Retour rattache a la decharge ${data.decharge.numero}.`
                : "Suivi detaille du retour materiel et de son constat administratif.",
          },
          actions: ({ data }) => {
            const sourceDechargeId = data?.decharge?.id;
            if (!sourceDechargeId) {
              return [];
            }

            return [
              {
                position: 5,
                render: () => (
                  <Button asChild size="sm" variant="outline" className="gap-2">
                    <Link
                      to={generatePath(ROUTES.DECHARGE_DETAIL, {
                        id: String(sourceDechargeId),
                      })}
                    >
                      <ArrowUpRight className="size-4" />
                      Voir la decharge
                    </Link>
                  </Button>
                ),
              },
            ] satisfies Array<{
              position: number;
              render: () => React.ReactElement;
            }>;
          },
        },
        layout: {
          includeUnassignedFields: false,
          fieldOverrides: {
            pieceJointeUrl: {
              render: ({ value }) =>
                typeof value === "string" && value.trim() ? (
                  <ProtectedFileCell value={value} />
                ) : (
                  "-"
                ),
            },
            recuPar: {
              emptyText: "Non renseigne",
            },
          },
          sections: [
            {
              id: "overview",
              title: "Vue d'ensemble",
              columns: 3,
              fields: [
                "numero",
                {
                  path: "origine",
                  label: "Origine",
                  render: ({ value }) => (
                    <Badge variant="outline">
                      {ORIGIN_LABELS[String(value || "")] || String(value || "-")}
                    </Badge>
                  ),
                },
                {
                  path: "statut",
                  label: "Statut",
                  render: ({ value }) => (
                    <Badge
                      variant={value === "annulee" ? "destructive" : "secondary"}
                    >
                      {STATUS_LABELS[String(value || "")] || String(value || "-")}
                    </Badge>
                  ),
                },
                "dateRestitution",
                "recuPar",
                {
                  path: "etatRetour",
                  label: "Etat au retour",
                  render: ({ record }) => record.etatRetour?.libelle || "-",
                },
              ],
            },
            {
              id: "condition",
              title: "Constat du retour",
              columns: 2,
              fields: ["serialRetour", "pieceJointeUrl", "customIntro"],
            },
            {
              id: "notes",
              title: "Observations",
              columns: 1,
              fields: ["observation", "commentaire"],
            },
          ],
          customSections: [
            {
              id: "source-summary",
              title: "Document source",
              order: 15,
              render: ({ data }) => {
                const sourceLink = data?.decharge?.id
                  ? generatePath(ROUTES.DECHARGE_DETAIL, {
                      id: String(data.decharge.id),
                    })
                  : null;

                return (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border bg-card/70 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Source
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {data?.decharge?.numero ||
                          data?.legacySource?.referenceDechargeLegacy ||
                          data?.legacySource?.libelle ||
                          "Aucune source rattachee"}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {data?.desc || "Le descriptif de la restitution sera affiche ici."}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-card/70 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Beneficiaire / provenance
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {data?.decharge?.beneficiaire?.name ||
                          data?.legacySource?.beneficiaire?.name ||
                          "-"}
                      </p>
                      {sourceLink ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          La decharge source reste accessible depuis l'action de navigation en haut de page.
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              },
            },
          ],
        },
      }}
    />
  );
}

export default RestitutionDetailPage;
