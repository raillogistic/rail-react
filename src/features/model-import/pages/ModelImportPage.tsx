import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  FileText, 
  Table as TableIcon, 
  FlaskConical, 
  CheckCircle2, 
  AlertCircle,
  Database,
  ArrowRight,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Info
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/kit/tabs";
import { Badge } from "@/shared/ui/kit/badge";
import { Separator } from "@/shared/ui/kit/separator";
import { Card, CardContent } from "@/shared/ui/kit/card";
import { Button } from "@/shared/ui/kit/button";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/kit/alert";
import { cn } from "@/shared/utils";

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
    { id: "preparation", title: "Préparation", icon: FileText, desc: "Fichier & Modèle" },
    { id: "review", title: "Révision", icon: TableIcon, desc: "Données & Erreurs", badge: batch?.totalRows },
    { id: "simulation", title: "Simulation", icon: FlaskConical, desc: "Test d'intégrité" },
    { id: "finalize", title: "Finalisation", icon: CheckCircle2, desc: "Enregistrement" },
  ];

  return (
    <div className="flex-1 space-y-8 p-2 pt-0 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Assistant d'Importation</span>
          </div>
          
          <div className="flex flex-col">
            <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
              Import de données
              <Badge variant="outline" className="h-6 rounded-lg bg-muted/50 border-border/40 font-bold uppercase tracking-widest text-[9px] px-2">v2.0</Badge>
            </h1>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground font-medium">
              <Database className="h-4 w-4 opacity-50" />
              <span className="text-sm">{appLabel}</span>
              <ChevronRight className="h-3 w-3 opacity-30" />
              <span className="text-sm font-bold text-foreground/70">{modelName}</span>
            </div>
          </div>
        </div>
        
        {batch && (
          <Card className="rounded-3xl border-border/40 bg-card shadow-xl shadow-shadow/5 overflow-hidden">
            <CardContent className="p-5 flex items-center gap-8">
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-1.5">Statut</p>
                <div className="flex items-center gap-2">
                   <div className={cn(
                     "h-2 w-2 rounded-full animate-pulse",
                     batch.status === "COMMITTED" ? "bg-emerald-500" : "bg-primary"
                   )} />
                   <span className="text-sm font-extrabold tracking-tight">{batch.status}</span>
                </div>
              </div>
              <Separator orientation="vertical" className="h-10 opacity-50" />
              <div className="flex flex-col items-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-1">Enregistrements</p>
                <p className="text-xl font-black tracking-tighter">{batch.totalRows}</p>
              </div>
              {issueSummary.blocking > 0 && (
                <>
                  <Separator orientation="vertical" className="h-10 opacity-50" />
                  <div className="flex flex-col items-end">
                    <p className="text-[10px] font-black text-destructive uppercase tracking-[0.15em] mb-1">Erreurs Bloquantes</p>
                    <div className="flex items-center gap-2 text-destructive">
                      <span className="text-xl font-black tracking-tighter">{issueSummary.blocking}</span>
                      <AlertCircle className="h-4 w-4" />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {pageError && (
        <Alert variant="destructive" className="rounded-2xl border-destructive/20 bg-destructive/5 animate-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-black uppercase tracking-wider text-xs">Anomalie détectée</AlertTitle>
          <AlertDescription className="font-medium text-sm">{pageError}</AlertDescription>
        </Alert>
      )}

      {/* Modern Stepper */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-2 bg-muted/30 rounded-[2rem] border border-border/20 backdrop-blur-md">
          {steps.map((step, idx) => (
            <TabsTrigger 
              key={step.id} 
              value={step.id}
              className={cn(
                "py-4 flex flex-col items-center md:items-start gap-1 px-6 transition-all duration-500 rounded-2xl group",
                "data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-primary/10"
              )}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm",
                  activeTab === step.id ? "bg-primary text-primary-foreground scale-110" : "bg-muted/50 text-muted-foreground group-hover:bg-muted"
                )}>
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="hidden md:flex flex-col text-left flex-1 min-w-0">
                  <span className="text-xs font-black uppercase tracking-widest leading-none mb-1">Étape {idx + 1}</span>
                  <span className="text-sm font-bold tracking-tight truncate">{step.title}</span>
                </div>
                {step.badge !== undefined && step.badge > 0 && (
                  <Badge className="ml-auto hidden md:flex h-6 px-2 rounded-lg bg-primary/10 text-primary border-none font-black text-[10px]">
                    {step.badge}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="min-h-[500px]">
          <TabsContent value="preparation" className="space-y-8 m-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
            
            <Card className="rounded-[2.5rem] border-primary/10 bg-primary/5 border-dashed border-2">
               <CardContent className="p-8 flex items-center gap-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                     <Info className="size-7 text-primary" />
                  </div>
                  <div className="space-y-1">
                     <h4 className="text-lg font-black tracking-tight text-primary/80">Conseil d'expert</h4>
                     <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-2xl">
                        Assurez-vous que vos dates sont au format <code className="bg-primary/10 px-1.5 py-0.5 rounded text-primary font-bold">AAAA-MM-JJ</code> et que les colonnes obligatoires (marquées d'un astérisque) sont bien remplies pour éviter tout rejet lors de la simulation.
                     </p>
                  </div>
               </CardContent>
            </Card>

            {batch && (
              <div className="flex justify-end pt-4">
                <Button onClick={() => setActiveTab("review")} className="h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 gap-3 font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1">
                  Accéder à la révision <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="review" className="space-y-8 m-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 gap-8">
              <div className="rounded-[2rem] border border-border/40 bg-card shadow-2xl shadow-shadow/5 overflow-hidden">
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
              </div>
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
            <div className="flex justify-between pt-4">
              <Button onClick={() => setActiveTab("preparation")} variant="ghost" className="h-12 px-6 rounded-xl font-bold text-xs uppercase tracking-widest gap-2">
                <ArrowLeft className="h-4 w-4" /> Retour
              </Button>
              <Button onClick={() => setActiveTab("simulation")} disabled={!batchId} className="h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 gap-3 font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1">
                Lancer la simulation <FlaskConical className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="simulation" className="space-y-8 m-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            <div className="flex justify-between pt-4">
              <Button onClick={() => setActiveTab("review")} variant="ghost" className="h-12 px-6 rounded-xl font-bold text-xs uppercase tracking-widest gap-2">
                <ArrowLeft className="h-4 w-4" /> Retour
              </Button>
              <Button 
                onClick={() => setActiveTab("finalize")} 
                disabled={!batchId || (executionState.simulationSummary?.canCommit === false && reviewState.batch?.lastSimulation?.canCommit === false)}
                className="h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 gap-3 font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1"
              >
                Passer à la validation <CheckCircle2 className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="finalize" className="space-y-8 m-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            <div className="flex justify-start pt-4">
              <Button onClick={() => setActiveTab("simulation")} variant="ghost" className="h-12 px-6 rounded-xl font-bold text-xs uppercase tracking-widest gap-2">
                <ArrowLeft className="h-4 w-4" /> Retour
              </Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default ModelImportPage;