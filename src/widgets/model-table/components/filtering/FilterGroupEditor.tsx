import * as React from "react";
import { Button } from "@/shared/ui/kit/button";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/kit/toggle-group";
import { Checkbox } from "@/shared/ui/kit/checkbox";
import { Label } from "@/shared/ui/kit/label";
import { Plus, X } from "lucide-react";
import { AdvancedFilteringController, FilterGroup } from "./types";
import { FilterConditionRow } from "./FilterConditionRow";

type Props = {
  controller: AdvancedFilteringController;
  group: FilterGroup;
  depth?: number;
};

export const FilterGroupEditor: React.FC<Props> = ({
  controller,
  group,
  depth = 0,
}) => {
  const isRoot = group.id === "root";

  return (
    <div
      className="space-y-3 rounded-lg border p-4"
      style={{ marginLeft: depth * 8 }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs uppercase text-muted-foreground">
            Operateur
          </Label>
          <ToggleGroup
            type="single"
            value={group.combinator}
            onValueChange={(value) =>
              value &&
              controller.setGroupOperator(group.id, value as "AND" | "OR")
            }
          >
            <ToggleGroupItem value="AND">ET</ToggleGroupItem>
            <ToggleGroupItem value="OR">OU</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={!!group.negated}
            onCheckedChange={() => controller.toggleGroupNegation(group.id)}
            id={`negate-${group.id}`}
          />
          <Label
            htmlFor={`negate-${group.id}`}
            className="text-xs text-muted-foreground"
          >
            NON
          </Label>
        </div>

        {!isRoot && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Supprimer le groupe"
            onClick={() => controller.removeGroup(group.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {group.conditions.map((condition) => (
          <FilterConditionRow
            key={condition.id}
            controller={controller}
            groupId={group.id}
            condition={condition}
          />
        ))}
        {group.conditions.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Aucune condition dans ce groupe.
          </p>
        )}
      </div>

      <div className="space-y-2">
        {group.groups.map((child) => (
          <FilterGroupEditor
            key={child.id}
            controller={controller}
            group={child}
            depth={depth + 1}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => controller.addCondition(group.id)}
        >
          <Plus className="mr-1 h-4 w-4" /> Condition
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => controller.addGroup(group.id)}
        >
          <Plus className="mr-1 h-4 w-4" /> Groupe
        </Button>
      </div>
    </div>
  );
};

