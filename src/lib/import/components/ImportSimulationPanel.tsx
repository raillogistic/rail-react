import { FlaskConical, Play, CheckCircle2, Clock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/components/ui/card";
import { Badge } from "@/lib/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/lib/components/ui/alert";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import type {
  ImportIssue,
  ImportSimulationSummary,
  ImportValidationSummary,
} from "../types";
import { Progress } from "@/lib/components/ui/progress";

interface ImportSimulationPanelProps {
  disabled?: boolean;
  loading?: boolean;
  validationSummary?: ImportValidationSummary | null;
  simulationSummary?: ImportSimulationSummary | null;
  issues?: ImportIssue[];
  executionError?: string | null;
  onValidate: () => Promise<void> | void;
  onSimulate: () => Promise<void> | void;
}

export function ImportSimulationPanel({
  disabled,
  loading,
  validationSummary,
  simulationSummary,
  issues = [],
  executionError,
  onValidate,
  onSimulate,
}: ImportSimulationPanelProps) {
  const validationData = validationSummary
    ? [
        {
          name: "Valides",
          value: validationSummary.validRows,
          color: "#10b981",
        },
        {
          name: "Invalides",
          value: validationSummary.invalidRows,
          color: "#ef4444",
        },
      ]
    : [];

  const blockingIssues = issues.filter((issue) => issue.severity === "ERROR");
  const phaseBlockingIssues = blockingIssues.filter((issue) =>
    ["VALIDATE", "SIMULATE"].includes(String(issue.stage ?? "").toUpperCase()),
  );
  const displayBlockingIssues =
    phaseBlockingIssues.length > 0 ? phaseBlockingIssues : blockingIssues;
  const shownBlockingIssues = displayBlockingIssues.slice(0, 5);

  const simulationData = simulationSummary
    ? [
        {
          name: "Créations",
          value: simulationSummary.wouldCreate,
          color: "#3b82f6",
        },
        {
          name: "Mises à jour",
          value: simulationSummary.wouldUpdate,
          color: "#8b5cf6",
        },
      ]
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-lg border-primary/5">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-xl flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Validation des règles
          </CardTitle>
          <CardDescription>
            Vérification de la conformité des types et des contraintes.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6 space-y-6">
          <div className="flex justify-center">
            <Button
              size="lg"
              className="w-full sm:w-auto h-12 px-8 gap-2 shadow-md hover:shadow-lg transition-all"
              disabled={disabled || loading}
              onClick={() => {
                void onValidate();
              }}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-5 w-5" />
              )}
              Lancer la validation
            </Button>
          </div>

          {validationSummary && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-muted/20 text-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                    Taux de succès
                  </p>
                  <p className="text-2xl font-black text-primary">
                    {(
                      (validationSummary.validRows /
                        validationSummary.totalRows) *
                      100
                    ).toFixed(0)}
                    %
                  </p>
                </div>
                <div className="p-4 rounded-xl border bg-muted/20 text-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                    Bloquants
                  </p>
                  <p className="text-2xl font-black text-destructive">
                    {validationSummary.blockingIssues}
                  </p>
                </div>
              </div>

              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={validationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {validationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>Progression globale</span>
                  <span>
                    {validationSummary.validRows} /{" "}
                    {validationSummary.totalRows} lignes
                  </span>
                </div>
                <Progress
                  value={
                    (validationSummary.validRows /
                      validationSummary.totalRows) *
                    100
                  }
                  className="h-2 bg-muted"
                />
              </div>

              {executionError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Validation bloquee</AlertTitle>
                  <AlertDescription>{executionError}</AlertDescription>
                </Alert>
              )}

              {validationSummary.blockingIssues > 0 && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-destructive">
                      Details des erreurs bloquantes
                    </p>
                    <Badge variant="destructive">{validationSummary.blockingIssues}</Badge>
                  </div>

                  {shownBlockingIssues.length > 0 ? (
                    <div className="space-y-2">
                      {shownBlockingIssues.map((issue) => (
                        <div key={issue.id} className="text-xs leading-relaxed">
                          <p className="font-semibold">{issue.code}</p>
                          <p className="text-foreground/80">{issue.message}</p>
                          <p className="text-muted-foreground">
                            Ligne {issue.rowNumber ?? "?"}
                            {issue.fieldPath ? ` - Champ ${issue.fieldPath}` : ""}
                          </p>
                        </div>
                      ))}
                      {displayBlockingIssues.length > shownBlockingIssues.length && (
                        <p className="text-xs text-muted-foreground">
                          ... et {displayBlockingIssues.length - shownBlockingIssues.length} autre(s) erreur(s).
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Des erreurs bloquantes ont ete detectees. Ouvrez l'onglet Revision pour voir le detail complet.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg border-primary/5">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-xl flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-blue-500" />
            Simulation à blanc
          </CardTitle>
          <CardDescription>
            Aperçu des changements en base de données sans impact réel.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6 space-y-6">
          <div className="flex justify-center">
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto h-12 px-8 gap-2 shadow-md hover:shadow-lg transition-all"
              disabled={disabled || loading}
              onClick={() => {
                void onSimulate();
              }}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <FlaskConical className="h-5 w-5" />
              )}
              Démarrer la simulation
            </Button>
          </div>

          {simulationSummary && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-lg border bg-blue-500/5 text-center">
                  <p className="text-[9px] uppercase font-bold text-blue-600 mb-1">
                    Créer
                  </p>
                  <p className="text-xl font-bold">
                    {simulationSummary.wouldCreate}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-purple-500/5 text-center">
                  <p className="text-[9px] uppercase font-bold text-purple-600 mb-1">
                    MàJ
                  </p>
                  <p className="text-xl font-bold">
                    {simulationSummary.wouldUpdate}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-red-500/5 text-center">
                  <p className="text-[9px] uppercase font-bold text-red-600 mb-1">
                    Fautes
                  </p>
                  <p className="text-xl font-bold">
                    {simulationSummary.blockingIssues}
                  </p>
                </div>
              </div>

              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={simulationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {simulationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground">
                      Performance
                    </p>
                    <p className="text-sm font-semibold">
                      {simulationSummary.durationMs} ms
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    simulationSummary.canCommit ? "default" : "destructive"
                  }
                  className="h-8 px-4 text-xs font-bold uppercase tracking-wider"
                >
                  {simulationSummary.canCommit ? "Prêt pour Commit" : "Bloqué"}
                </Badge>
              </div>
            </div>
          )}

          {!simulationSummary && !loading && (
            <div className="flex flex-col items-center justify-center py-10 opacity-30">
              <FlaskConical className="h-16 w-16 mb-4" />
              <p className="text-sm italic">
                Aucune simulation n'a encore été effectuée.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
