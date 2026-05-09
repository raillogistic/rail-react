import type { InventoryInventoryCampaign } from "@/models";
import { ROUTES } from "@/projects/inventory/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";
import { Progress } from "@/shared/ui/kit/progress";
import { Badge } from "@/shared/ui/kit/badge";

export function InventoryCampaignListPage() {
  return (
    <DynamicModelTable<InventoryInventoryCampaign>
      app="inventory"
      model="InventoryCampaign"
      create={{
        type: "link",
        hrefTemplate: ROUTES.INVENTORY_CAMPAIGN_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.INVENTORY_CAMPAIGN_EDIT,
      }}
      detail={{
        type: "link",
        hrefTemplate: ROUTES.INVENTORY_CAMPAIGN_DETAIL,
      }}
      baseTable={{
        tableConfig: {
          title: "Campagnes d'inventaire",
        },
        columnOverrides: {
          status: {
            cell: ({ getValue }) => {
              const status = getValue() as string;
              const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
                draft: "secondary",
                prepared: "outline",
                open: "success",
                checking: "warning",
                to_close: "warning",
                closed: "default",
                cancelled: "destructive",
              };
              return (
                <Badge variant={variants[status] || "default"}>
                  {status}
                </Badge>
              );
            },
          },
          progression: {
            header: "Progression",
            cell: ({ getValue }) => {
              const value = getValue() as number;
              return (
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Progress value={value} className="h-2" />
                  <span className="text-xs font-medium">{value}%</span>
                </div>
              );
            },
          },
        },
      }}
    />
  );
}

export default InventoryCampaignListPage;
