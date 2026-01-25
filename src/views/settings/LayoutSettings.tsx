import { useTheme } from "@/lib/theme";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/components/ui/card";
import { Label } from "@/lib/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/lib/components/ui/toggle-group";
import {
  IconLayoutSidebar,
  IconLayoutNavbar,
  IconLayoutDistributeHorizontal,
  IconLayoutGridAdd,
} from "@tabler/icons-react";

export function LayoutSettings() {
  const { layout, setLayout, sidebarCollapseMode, setSidebarCollapseMode } =
    useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disposition</CardTitle>
        <CardDescription>
          Choisissez comment vous souhaitez naviguer dans l'application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Navigation</Label>
          <div className="flex items-center space-x-4">
            <ToggleGroup
              type="single"
              value={layout}
              onValueChange={(value) => {
                if (value) setLayout(value as "vertical" | "horizontal");
              }}
            >
              <ToggleGroupItem value="vertical" aria-label="Vertical layout">
                <IconLayoutSidebar className="h-4 w-4 mr-2" />
                Verticale
              </ToggleGroupItem>
              <ToggleGroupItem value="horizontal" aria-label="Horizontal layout">
                <IconLayoutNavbar className="h-4 w-4 mr-2" />
                Horizontale
              </ToggleGroupItem>
              <ToggleGroupItem value="mixed" aria-label="Mixed layout">
                <IconLayoutNavbar className="h-4 w-4 mr-2" />
                Mixte
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        {layout === "vertical" && (
          <div className="space-y-2">
            <Label>Comportement de la barre latérale</Label>
            <ToggleGroup
              type="single"
              value={sidebarCollapseMode}
              onValueChange={(value) => {
                if (!value) return;
                setSidebarCollapseMode(value as "offcanvas" | "icon");
              }}
            >
              <ToggleGroupItem value="offcanvas" aria-label="Offcanvas">
                <IconLayoutDistributeHorizontal className="mr-2 h-4 w-4" />
                Offcanvas
              </ToggleGroupItem>
              <ToggleGroupItem value="icon" aria-label="Icône">
                <IconLayoutGridAdd className="mr-2 h-4 w-4" />
                Icône
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
