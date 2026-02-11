import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  FileText, 
  Table as TableIcon, 
  FlaskConical, 
  CheckCircle2, 
  AlertCircle,
  Database,
  ArrowRight
} from "lucide-react";
import {
  ImportCommitPanel,
  ImportIssuesPanel,
  ImportReviewGrid,
  ImportSimulationPanel,
  ImportUploadPanel,
  TemplateDownloadCard,
} from "../components";
import {
  useModelImportExecution,
  useModelImportReview,
  useModelImportTemplate,
} from "../hooks";
import { humanizeImportError } from "../error-messages";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/lib/components/ui/tabs";
import { Badge } from "@/lib/components/ui/badge";
import { Separator } from "@/lib/components/ui/separator";
import { Card, CardContent } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/lib/components/ui/alert";
import { cn } from "@/lib/utils";

const DEFAULT_APP = "test_app";
const DEFAULT_MODEL = "Product";

export function ModelImportPage() {
  const [searchParams] = useSearchParams();
  const appLabel = searchParams.get("app") || DEFAULT_APP;
  const modelName = searchParams.get("model") || DEFAULT_MODEL;

  const [activeTab, setActiveTab] = useState("preparation");

  const templateState = useModelImportTemplate(appLabel, modelName);
  const reviewState = useModelImportReview(appLabel, modelName);
  const executionState = useModelImportExecution();

  const batchId = reviewState.batch?.id ?? null;
  const batch = reviewState.batch;
  const busy =
    templateState.loading || reviewState.loading || executionState.loading;
  const issueSummary = reviewState.issueSummary;
  const pageError =
    reviewState.error ??
    executionState.error ??
    (templateState.error ? humanizeImportError(templateState.error) : null);
  
  const templateColumns = useMemo(() => {
    if (!templateState.template) {
      return undefined;
    }
    const names = new Set<string>();
    const ordered: string[] = [];
    for (const column of [
      ...templateState.template.requiredColumns,
      ...templateState.template.optionalColumns,
    ]) {
      const safeName = String(column.name).trim();
      if (!safeName || names.has(safeName)) {
        continue;
      }
      names.add(safeName);
      ordered.push(safeName);
    }
    return ordered;
  }, [templateState.template]);

  const steps = [
    { id: "preparation", title: "Préparation", icon: FileText },
    { id: "review", title: "Révision", icon: TableIcon, badge: batch?.totalRows },
    { id: "simulation", title: "Simulation", icon: FlaskConical },
    { id: "finalize", title: "Finalisation", icon: CheckCircle2 },
  ];

  return (
    <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Database className="h-4 w-4" />
            <span className="text-sm font-medium uppercase tracking-wider">{appLabel}</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">{modelName}</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Import de données</h1>
          <p className="text-lg text-muted-foreground">
            Suivez les étapes pour importer massivement vos données en toute sécurité.
          </p>
        </div>
        
        {batch && (
          <Card className="bg-muted/50 border-none">
            <CardContent className="p-4 flex items-center gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Statut du lot</p>
                <Badge variant={batch.status === "COMMITTED" ? "default" : "secondary"} className="font-semibold">
                  {batch.status}
                </Badge>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="space-y-1 text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase">Lignes</p>
                <p className="text-lg font-bold">{batch.totalRows}</p>
              </div>
              {issueSummary.blocking > 0 && (
                <>
                  <Separator orientation="vertical" className="h-10" />
                  <div className="space-y-1 text-right">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Erreurs</p>
                    <p className="text-lg font-bold text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {issueSummary.blocking}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {pageError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur d'import</AlertTitle>
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-1 bg-muted/30">
          {steps.map((step) => (
            <TabsTrigger 
              key={step.id} 
              value={step.id}
              className={cn(
                "py-3 flex items-center gap-2 transition-all",
                "data-[state=active]:bg-background data-[state=active]:shadow-sm"
              )}
            >
              <step.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{step.title}</span>
              {step.badge !== undefined && step.badge > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 min-w-[20px] text-[10px]">
                  {step.badge}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-8">
          <TabsContent value="preparation" className="space-y-6 animate-in slide-in-from-left-4 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TemplateDownloadCard
                template={templateState.template}
                loading={templateState.loading}
              />
              <ImportUploadPanel
                template={templateState.template}
                loading={busy}
                onUpload={async (file, format) => {
                  if (!templateState.template) return;
                  await reviewState.uploadFile(file, templateState.template, format);
                  setActiveTab("review");
                }}
              />
            </div>
            {batch && (
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab("review")} variant="outline" className="gap-2">
                  Continuer vers la révision <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="review" className="space-y-6 animate-in slide-in-from-left-4 duration-300">
            <div className="grid grid-cols-1 gap-6">
              <ImportReviewGrid
                rows={reviewState.rows}
                templateColumns={templateColumns}
                loading={busy}
                onPatchRows={async (patches) => {
                  if (!batchId) return;
                  await reviewState.patchRows(batchId, patches);
                  await reviewState.refreshBatch(batchId);
                }}
              />
              <ImportIssuesPanel
                issues={reviewState.issues}
                onDownloadReport={
                  batchId
                    ? async () => {
                        const report = await executionState.fetchErrorReport(batchId);
                        return report?.downloadUrl ?? null;
                      }
                    : undefined
                }
              />
            </div>
            <div className="flex justify-between">
              <Button onClick={() => setActiveTab("preparation")} variant="ghost">Retour</Button>
              <Button onClick={() => setActiveTab("simulation")} disabled={!batchId} className="gap-2">
                Simuler l'import <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="simulation" className="space-y-6 animate-in slide-in-from-left-4 duration-300">
            <ImportSimulationPanel
              disabled={!batchId}
              loading={busy}
              validationSummary={
                executionState.validationSummary ?? reviewState.batch?.lastValidation
              }
              simulationSummary={
                executionState.simulationSummary ?? reviewState.batch?.lastSimulation
              }
              issues={reviewState.issues}
              executionError={executionState.error}
              onValidate={async () => {
                if (!batchId) return;
                await executionState.validate(batchId);
                await reviewState.refreshBatch(batchId);
              }}
              onSimulate={async () => {
                if (!batchId) return;
                await executionState.simulate(batchId);
                await reviewState.refreshBatch(batchId);
              }}
            />
            <div className="flex justify-between">
              <Button onClick={() => setActiveTab("review")} variant="ghost">Retour</Button>
              <Button 
                onClick={() => setActiveTab("finalize")} 
                disabled={!batchId || (executionState.simulationSummary?.canCommit === false && reviewState.batch?.lastSimulation?.canCommit === false)}
                className="gap-2"
              >
                Passer à la finalisation <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="finalize" className="space-y-6 animate-in slide-in-from-left-4 duration-300">
            <ImportCommitPanel
              disabled={!batchId}
              loading={busy}
              simulationSummary={
                executionState.simulationSummary ?? reviewState.batch?.lastSimulation
              }
              commitSummary={executionState.commitSummary}
              onCommit={async () => {
                if (!batchId) return;
                await executionState.commit(batchId);
                await reviewState.refreshBatch(batchId);
              }}
              onDeleteBatch={async () => {
                if (!batchId) return;
                const payload = await executionState.removeBatch(batchId);
                if (payload.ok) {
                  reviewState.setBatch(null);
                  setActiveTab("preparation");
                }
              }}
            />
            <div className="flex justify-start">
              <Button onClick={() => setActiveTab("simulation")} variant="ghost">Retour</Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default ModelImportPage;
