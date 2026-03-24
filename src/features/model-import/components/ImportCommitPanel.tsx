import { CheckCircle2, Trash2, AlertCircle, Database, ArrowRight, Loader2, Info } from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/shared/ui/kit/card";
import { Badge } from "@/shared/ui/kit/badge";
import { Separator } from "@/shared/ui/kit/separator";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/kit/alert";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/kit/alert-dialog";
import { cn } from "@/shared/utils";
import type { ImportCommitSummary, ImportSimulationSummary } from "../types";

interface ImportCommitPanelProps {
  disabled?: boolean;
  loading?: boolean;
  simulationSummary?: ImportSimulationSummary | null;
  commitSummary?: ImportCommitSummary | null;
  onCommit: () => Promise<void> | void;
  onDeleteBatch: () => Promise<void> | void;
}

export function ImportCommitPanel({
  disabled,
  loading,
  simulationSummary,
  commitSummary,
  onCommit,
  onDeleteBatch,
}: ImportCommitPanelProps) {
  const hasSimulation = !!simulationSummary;
  const commitBlockedBySimulation = hasSimulation && simulationSummary?.canCommit === false;
  const commitBlockedByMissingSimulation = !hasSimulation;
  const commitBlocked =
    !!disabled || commitBlockedBySimulation || commitBlockedByMissingSimulation;
  const isCommitted = !!commitSummary;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className={cn(
        "shadow-2xl border-2 overflow-hidden",
        isCommitted ? "border-green-500/30" : commitBlocked ? "border-muted" : "border-primary/30"
      )}>
        <CardHeader className={cn(
          "pb-8 text-center",
          isCommitted ? "bg-green-500/5" : commitBlocked ? "bg-muted/30" : "bg-primary/5"
        )}>
          <div className="flex justify-center mb-4">
            <div className={cn(
              "h-16 w-16 rounded-full flex items-center justify-center shadow-lg",
              isCommitted ? "bg-green-500 text-white" : commitBlocked ? "bg-muted text-muted-foreground" : "bg-primary text-white"
            )}>
              {isCommitted ? <CheckCircle2 className="h-10 w-10" /> : <Database className="h-10 w-10" />}
            </div>
          </div>
          <CardTitle className="text-2xl font-black">
            {isCommitted ? "Importation réussie !" : "Validation finale et commit"}
          </CardTitle>
          <CardDescription className="text-base max-w-md mx-auto">
            {isCommitted 
              ? "Vos données ont été intégrées avec succès dans la base de données." 
              : "Vérifiez une dernière fois les chiffres avant de rendre les changements permanents."}
          </CardDescription>
        </CardHeader>

        <CardContent className="py-8 space-y-8 px-8 sm:px-12">
          {!isCommitted && simulationSummary && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Opérations de création</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-blue-600">{simulationSummary.wouldCreate}</span>
                  <span className="text-sm text-muted-foreground font-medium">enregistrements</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Opérations de mise à jour</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-purple-600">{simulationSummary.wouldUpdate}</span>
                  <span className="text-sm text-muted-foreground font-medium">enregistrements</span>
                </div>
              </div>
            </div>
          )}

          {isCommitted && commitSummary && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/30 p-4 rounded-2xl text-center border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total traité</p>
                  <p className="text-2xl font-black">{commitSummary.totalRows}</p>
                </div>
                <div className="bg-green-500/10 p-4 rounded-2xl text-center border border-green-500/20">
                  <p className="text-[10px] uppercase font-bold text-green-600 mb-1">Succès</p>
                  <p className="text-2xl font-black text-green-600">{commitSummary.committedRows}</p>
                </div>
                <div className="bg-yellow-500/10 p-4 rounded-2xl text-center border border-yellow-500/20">
                  <p className="text-[10px] uppercase font-bold text-yellow-600 mb-1">Ignorés</p>
                  <p className="text-2xl font-black text-yellow-600">{commitSummary.skippedRows}</p>
                </div>
              </div>
              
              <div className="p-4 bg-muted/20 rounded-xl border border-dashed flex items-center gap-4">
                <div className="h-10 w-10 bg-background rounded-full flex items-center justify-center text-primary shadow-sm border">
                  <Info className="h-5 w-5" />
                </div>
                <div className="text-sm">
                  <p className="font-bold">Détails de l'intégration</p>
                  <p className="text-muted-foreground">
                    {commitSummary.createRows} créations effectives et {commitSummary.updateRows} mises à jour appliquées.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isCommitted && commitBlocked && (
            <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="font-black uppercase tracking-tight text-xs">Commit Bloqué</AlertTitle>
              <AlertDescription className="text-sm">
                {commitBlockedByMissingSimulation
                  ? "Lancez d'abord la simulation pour autoriser la finalisation."
                  : "L'importation ne peut pas être finalisée tant que des erreurs bloquantes persistent dans le lot de données."}
              </AlertDescription>
            </Alert>
          )}

          {!isCommitted && !commitBlocked && (
            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 space-y-4">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="font-black text-lg">Prêt pour l'intégration</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Toutes les validations ont été passées avec succès. Le commit sera atomique : soit tout est importé, soit rien n'est modifié.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-muted/30 border-t p-8 flex flex-col sm:flex-row gap-4 justify-center">
          {!isCommitted ? (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="lg"
                    className="h-14 px-8 gap-2 font-bold min-w-[200px]"
                    disabled={loading}
                  >
                    <Trash2 className="h-5 w-5" />
                    Abandonner le lot
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera définitivement le lot de données actuel et toutes les corrections que vous avez apportées.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void onDeleteBatch()} className="bg-destructive hover:bg-destructive/90">
                      Supprimer définitivement
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                size="lg"
                className="h-14 px-12 gap-3 font-black text-lg shadow-xl shadow-primary/20 min-w-[240px]"
                disabled={commitBlocked || loading}
                onClick={() => {
                  void onCommit();
                }}
              >
                {loading ? <Loader2 className="h-6 w-6" /> : <Database className="h-6 w-6" />}
                Confirmer l'importation
                {!loading && <ArrowRight className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-12 gap-3 font-bold"
              onClick={() => window.location.reload()}
            >
              Fermer et recommencer
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {!isCommitted && !commitBlocked && (
        <p className="text-center text-xs text-muted-foreground">
          L'opération peut prendre quelques secondes selon le volume de données.
        </p>
      )}
    </div>
  );
}
