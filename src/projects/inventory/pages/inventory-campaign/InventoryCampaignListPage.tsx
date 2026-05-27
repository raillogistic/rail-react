import type { InventoryInventoryCampaign } from "@/models";
import { ROUTES } from "@/projects/inventory/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";
import { Progress } from "@/shared/ui/kit/progress";
import { Badge } from "@/shared/ui/kit/badge";

export function InventoryCampaignListPage() {
  return (
    <DynamicModelTable<any>
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
        fields: {
          include: [
            "campaignCode",
            "name",
            "scopeType",
            "scopeReferenceId",
            "startDate",
            "endDate",
            "status",
            "progression",
          ],
          render: {
            status: (value) => {
              const status = value as string;
              const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
                draft: "secondary",
                prepared: "outline",
                open: "default",
                checking: "outline",
                to_close: "outline",
                closed: "default",
                cancelled: "destructive",
              };
              return (
                <Badge variant={variants[status] || "default"}>
                  {status}
                </Badge>
              );
            },
            progression: (value) => {
              const val = value as number;
              return (
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Progress value={val} className="h-2" />
                  <span className="text-xs font-medium">{val}%</span>
                </div>
              );
            },
          }
        },
        tableConfig: {
          title: "Campagnes d'inventaire",
        },
      }}
    />
  );
}

export default InventoryCampaignListPage;
