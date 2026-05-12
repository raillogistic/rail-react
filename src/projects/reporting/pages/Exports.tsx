import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/kit/card";
import { Download } from "lucide-react";
import { Button } from "@/shared/ui/kit/button";

export function Exports() {
  const handleExport = (endpoint: string) => {
    window.open(`/api/reports/${endpoint}/`, "_blank");
  };

  const exportTypes = [
    {
      id: "biens",
      name: "Export Biens",
      description: "Liste des biens avec leurs attributs principaux (CSV).",
    },
    {
      id: "affectations",
      name: "Export Affectations",
      description: "Historique des affectations de biens (CSV).",
    },
    {
      id: "mouvements",
      name: "Export Mouvements",
      description: "Historique des déplacements (CSV).",
    },
    {
      id: "finance",
      name: "Export Financier",
      description: "Données financières et amortissements (CSV).",
    },
    {
      id: "inventaire",
      name: "Export Inventaire",
      description: "Résultats et écarts des campagnes d'inventaire (CSV).",
    },
    {
      id: "audit",
      name: "Export Audit",
      description: "Journal des actions sensibles (CSV).",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Exports de données</h1>
      <p className="text-gray-600">
        Sélectionnez le type de données que vous souhaitez exporter. Les exports
        dépassant 5000 lignes seront traités en tâche de fond.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportTypes.map((ext) => (
          <Card key={ext.id}>
            <CardHeader>
              <CardTitle>{ext.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{ext.description}</span>
              <Button onClick={() => handleExport(ext.id)} variant="outline">
                <Download className="w-4 h-4 mr-2" /> Exporter
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
