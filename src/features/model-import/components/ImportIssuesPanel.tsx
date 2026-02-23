import { useMemo, useState } from "react";
import { Download, AlertCircle, AlertTriangle, Info, Search, FileText, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/shared/ui/kit/card";
import { Input } from "@/shared/ui/kit/input";
import { Badge } from "@/shared/ui/kit/badge";
import { Separator } from "@/shared/ui/kit/separator";
import { ScrollArea } from "@/shared/ui/kit/scroll-area";
import { cn } from "@/shared/utils";
import type { ImportIssue } from "../types";

interface ImportIssuesPanelProps {
  issues: ImportIssue[];
  onDownloadReport?: () => Promise<string | null> | string | null;
}

export function ImportIssuesPanel({ issues, onDownloadReport }: ImportIssuesPanelProps) {
  const [filter, setFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"ALL" | "ERROR" | "WARNING">("ALL");
  const [downloading, setDownloading] = useState(false);

  const filtered = useMemo(() => {
    let result = issues;
    
    if (severityFilter !== "ALL") {
      result = result.filter(i => i.severity === severityFilter);
    }

    const token = filter.trim().toLowerCase();
    if (!token) return result;
    
    return result.filter((issue) => {
      const haystack = [
        issue.code,
        issue.message,
        issue.fieldPath ?? "",
        String(issue.rowNumber ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(token);
    });
  }, [filter, severityFilter, issues]);

  const blocking = issues.filter((issue) => issue.severity === "ERROR").length;
  const warnings = issues.filter((issue) => issue.severity === "WARNING").length;

  const handleDownload = async () => {
    if (!onDownloadReport) return;
    setDownloading(true);
    try {
      const url = await onDownloadReport();
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="shadow-lg border-primary/5 overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Journal des problèmes
            </CardTitle>
            <CardDescription className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Badge variant="destructive" className="h-5 px-1.5">{blocking}</Badge> bloquants
              </span>
              <span className="flex items-center gap-1">
                <Badge variant="secondary" className="h-5 px-1.5 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">{warnings}</Badge> avertissements
              </span>
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 shadow-sm"
            onClick={() => {
              void handleDownload();
            }}
            disabled={!onDownloadReport || downloading || issues.length === 0}
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Rapport complet
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Filtrer les problemes"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Rechercher par code, ligne, message..."
              className="pl-9 h-9"
            />
          </div>
          <div className="flex gap-1 bg-muted p-1 rounded-md h-9">
            {(["ALL", "ERROR", "WARNING"] as const).map((s) => (
              <Button
                key={s}
                variant={severityFilter === s ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "h-7 text-[10px] font-bold uppercase tracking-wider px-2",
                  severityFilter === s ? "bg-background shadow-sm" : "text-muted-foreground"
                )}
                onClick={() => setSeverityFilter(s)}
              >
                {s === "ALL" ? "Tout" : s === "ERROR" ? "Erreurs" : "Avert."}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="h-[300px] pr-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm italic">
              <Info className="h-8 w-8 opacity-20 mb-2" />
              <p>Aucun problème ne correspond à vos critères.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((issue) => (
                <div 
                  key={issue.id} 
                  className={cn(
                    "group relative overflow-hidden rounded-lg border p-3 transition-all hover:shadow-md",
                    issue.severity === "ERROR" 
                      ? "border-destructive/20 bg-destructive/5" 
                      : "border-yellow-500/20 bg-yellow-500/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "mt-0.5 rounded-full p-1",
                        issue.severity === "ERROR" ? "text-destructive" : "text-yellow-600"
                      )}>
                        {issue.severity === "ERROR" ? <AlertCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm leading-none">{issue.code}</p>
                          <Badge variant="outline" className="h-4 px-1 text-[10px] font-mono">
                            R{issue.rowNumber ?? "?"}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed">{issue.message}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-3 text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
                    <span className="flex items-center gap-1">
                      Champ: <span className="text-foreground">{issue.fieldPath ?? "Global"}</span>
                    </span>
                    <Separator orientation="vertical" className="h-2" />
                    <span className="flex items-center gap-1">
                      Étape: <span className="text-foreground">{issue.stage ?? "N/A"}</span>
                    </span>
                  </div>
                  
                  {issue.suggestedFix && (
                    <div className="mt-2 text-[10px] bg-background/50 p-1.5 rounded border border-dashed border-muted-foreground/20 italic">
                      💡 Suggestion : {issue.suggestedFix}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="bg-muted/30 border-t py-2 flex justify-center">
        <p className="text-[10px] text-muted-foreground italic">
          Cliquez sur un problème pour localiser la ligne correspondante dans la grille (bientôt).
        </p>
      </CardFooter>
    </Card>
  );
}
