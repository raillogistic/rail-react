import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { ClipboardList, AlertCircle, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/projects/inventory/config/routes";

export const InventoryHomePage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Inventaire</h1>
        <p className="text-muted-foreground">Gérez vos campagnes d'inventaire et suivez les écarts sur le terrain.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link to={ROUTES.INVENTORY_CAMPAIGN_LIST}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campagnes</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Consulter</div>
              <p className="text-xs text-muted-foreground">Liste des campagnes en cours et passées</p>
            </CardContent>
          </Card>
        </Link>

        <Link to={ROUTES.GAP_REPORT}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full border-warning/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Écarts</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rapport</div>
              <p className="text-xs text-muted-foreground">Visualiser les anomalies détectées</p>
            </CardContent>
          </Card>
        </Link>

        <Link to={ROUTES.INVENTORY_CAMPAIGN_CREATE}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nouvelle Campagne</CardTitle>
              <PlusCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Créer</div>
              <p className="text-xs text-muted-foreground">Lancer une nouvelle opération d'inventaire</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};
