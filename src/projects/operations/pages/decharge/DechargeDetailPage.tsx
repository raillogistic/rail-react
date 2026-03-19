import type React from "react";
import { format } from "date-fns";
import { ArrowUpRight, ReceiptText } from "lucide-react";
import { Link, generatePath, useNavigate, useParams } from "react-router-dom";
import type { OperationsDecharge } from "@/models";
import { ROUTES } from "@/projects/operations/config/routes";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { useModelSingleQuery } from "@/shared/api/graphql/graphql";
import { CustomMutationAction } from "@/widgets/components/CustomMutationAction";
import { ModelDynamicDetail } from "@/widgets/model-details";
import { ProtectedFileCell } from "@/widgets/model-table/components/ProtectedFileCell";

const STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  validee: "Validee",
  partielle: "Partielle",
  cloturee: "Cloturee",
  annulee: "Annulee",
};

export function DechargeDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const detailQuery = useModelSingleQuery<OperationsDecharge>({
    app: "operations",
    model: "Decharge",
    id,
    fields: ["id", "restitutionId"],
  });

  return (
    <ModelDynamicDetail<OperationsDecharge>
      app="operations"
      model="Decharge"
      id={id}
      baseDetail={{
        header: {
          title: (data) =>
            data?.numero
              ? `Decharge ${data.numero}`
              : data?.libelle || "Detail decharge",
          frame: {
            description: (data) =>
              data?.beneficiaire?.name
                ? `Materiel remis a ${data.beneficiaire.name}.`
                : "Visualisez la decharge, son materiel et son etat de restitution.",
          },
          actions: ({ data }) => {
            const actions: Array<{
              position: number;
              render: () => React.ReactElement;
            }> = [];

            if (data?.restitutionId) {
              actions.push({
                position: 5,
                render: () => (
                  <Button asChild size="sm" variant="outline" className="gap-2">
                    <Link
                      to={generatePath(ROUTES.RESTITUTION_DETAIL, {
                        id: String(data.restitutionId),
                      })}
                    >
                      <ArrowUpRight className="size-4" />
                      Voir la restitution
                    </Link>
                  </Button>
                ),
              });
            }

            actions.push({
              position: 10,
              render: () => (
                <CustomMutationAction
                  data={{
                    app: "operations",
                    model: "Decharge",
                    funcName: "restituer",
                    objectId: id,
                  }}
                  button={{
                    label: "Creer une restitution",
                    icon: <ReceiptText className="size-4" />,
                    className: "gap-2",
                  }}
                  popup={{
                    title: "Nouvelle restitution",
                    description:
                      "Enregistrez immediatement le retour du materiel a partir de cette decharge.",
                    closeOnSuccess: true,
                  }}
                  form={{
                    defaults: {
                      dateRestitution: format(new Date(), "yyyy-MM-dd"),
                    },
                    fieldOverrides: {
                      dateRestitution: {
                        label: "Date de restitution",
                      },
                      recuPar: {
                        label: "Recu par",
                      },
                      etatRetourId: {
                        type: "select-query",
                        label: "Etat au retour",
                        placeholder: "Selectionner l'etat constate",
                        colSpan: 2,
                        graphql: {
                          relatedModel: "operations.Etat",
                          labelField: "libelle",
                          extraFields: ["libelle"],
                          limit: 50,
                        },
                      },
                      serialRetour: {
                        label: "Numero de serie au retour",
                      },
                      observation: {
                        colSpan: 2,
                      },
                      commentaire: {
                        colSpan: 2,
                        type: "textarea",
                      },
                    },
                    layout: {
                      columns: 2,
                    },
                    actions: {
                      submitLabel: "Creer la restitution",
                    },
                  }}
                  onSuccess={({}) => {
                    void detailQuery.refetch().then((result) => {
                      const responseRecord = (
                        result as {
                          data?: Record<string, OperationsDecharge | null>;
                        }
                      )?.data?.[detailQuery.queryName] as
                        | OperationsDecharge
                        | null
                        | undefined;
                      const restitutionId =
                        responseRecord?.restitutionId ||
                        detailQuery.data?.restitutionId;

                      if (!restitutionId) {
                        return;
                      }

                      navigate(
                        generatePath(ROUTES.RESTITUTION_DETAIL, {
                          id: String(restitutionId),
                        }),
                      );
                    });
                  }}
                />
              ),
            });

            return actions;
          },
        },
        actions: {
          permissions: {
            canRunMutation: (mutation) => mutation.methodName !== "restituer",
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
            garder: {
              render: ({ value }) => (value ? "Oui" : "Non"),
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
                  path: "statut",
                  label: "Statut",
                  render: ({ value }) => (
                    <Badge
                      variant={
                        value === "annulee" ? "destructive" : "secondary"
                      }
                    >
                      {STATUS_LABELS[String(value || "")] ||
                        String(value || "-")}
                    </Badge>
                  ),
                },
                "dateDecharge",
                {
                  path: "beneficiaire.name",
                  label: "Beneficiaire",
                },
                "site",
                "pieceJointeUrl",
              ],
            },
            {
              id: "article",
              title: "Materiel confie",
              columns: 3,
              fields: [
                "libelle",
                {
                  path: "etatSortie.libelle",
                  label: "Etat de sortie",
                },
                "garder",
                "codeInventaire",
                "serial",
              ],
            },
            {
              id: "notes",
              title: "Notes administratives",
              columns: 1,
              fields: ["customIntro", "commentaire"],
            },
          ],
          customSections: [
            {
              id: "restitution",
              title: "Restitution",
              order: 20,
              render: ({ data }) => {
                const restitutionLink = data?.restitutionId
                  ? generatePath(ROUTES.RESTITUTION_DETAIL, {
                      id: String(data.restitutionId),
                    })
                  : null;

                return (
                  <div className="rounded-2xl border bg-card/80 p-5 shadow-sm">
                    {data?.restitutionId ? (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Restitution enregistree
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Le retour de ce materiel est deja trace dans une
                              fiche de restitution.
                            </p>
                          </div>
                          {restitutionLink ? (
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="gap-2"
                            >
                              <Link to={restitutionLink}>
                                <ArrowUpRight className="size-4" />
                                Ouvrir la fiche
                              </Link>
                            </Button>
                          ) : null}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                          <div className="rounded-xl border bg-background/60 p-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Numero
                            </p>
                            <p className="mt-2 text-sm font-medium text-foreground">
                              {data.restitutionNumero || "-"}
                            </p>
                          </div>
                          <div className="rounded-xl border bg-background/60 p-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Date de restitution
                            </p>
                            <p className="mt-2 text-sm font-medium text-foreground">
                              {data.restitutionDateRestitution || "-"}
                            </p>
                          </div>
                          <div className="rounded-xl border bg-background/60 p-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Recu par
                            </p>
                            <p className="mt-2 text-sm font-medium text-foreground">
                              {data.restitutionRecuPar || "-"}
                            </p>
                          </div>
                          <div className="rounded-xl border bg-background/60 p-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Etat au retour
                            </p>
                            <p className="mt-2 text-sm font-medium text-foreground">
                              {data.restitutionEtatRetourLibelle || "-"}
                            </p>
                          </div>
                          <div className="rounded-xl border bg-background/60 p-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Statut
                            </p>
                            <p className="mt-2 text-sm font-medium text-foreground">
                              {STATUS_LABELS[data.restitutionStatut || ""] ||
                                data.restitutionStatut ||
                                "-"}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-xl border bg-background/60 p-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Observation
                            </p>
                            <p className="mt-2 text-sm text-foreground">
                              {data.restitutionObservation ||
                                "Aucune observation."}
                            </p>
                          </div>
                          <div className="rounded-xl border bg-background/60 p-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Commentaire
                            </p>
                            <p className="mt-2 text-sm text-foreground">
                              {data.restitutionCommentaire ||
                                "Aucun commentaire."}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-xl border bg-background/60 p-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Numero de serie au retour
                            </p>
                            <p className="mt-2 text-sm text-foreground">
                              {data.restitutionSerialRetour || "-"}
                            </p>
                          </div>
                          <div className="rounded-xl border bg-background/60 p-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Piece jointe
                            </p>
                            <div className="mt-2 text-sm text-foreground">
                              {data.restitutionPieceJointeUrl ? (
                                <ProtectedFileCell
                                  value={data.restitutionPieceJointeUrl}
                                />
                              ) : (
                                "Aucune piece jointe."
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed bg-background/40 p-5">
                        <p className="text-sm font-semibold text-foreground">
                          Aucune restitution enregistree
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Cette decharge n'a pas encore de fiche de retour
                          rattachee. Utilisez l'action de creation en haut de
                          page pour enregistrer la restitution sans quitter le
                          dossier.
                        </p>
                      </div>
                    )}
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

export default DechargeDetailPage;
