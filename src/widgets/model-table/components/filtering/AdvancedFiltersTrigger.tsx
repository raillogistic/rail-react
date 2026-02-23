import * as React from "react";
import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/utils";
import { Filter } from "lucide-react";
import { AdvancedFilteringController } from "./types";

type AdvancedFiltersTriggerProps = {
  controller: AdvancedFilteringController;
  variant?: "icon" | "button";
  label?: string;
};

export const AdvancedFiltersTrigger: React.FC<AdvancedFiltersTriggerProps> = ({
  controller,
  variant = "icon",
  label = "Filtres avancÃ©s",
}) => {
  const handleClick = React.useCallback(
    () => controller.openDialog(),
    [controller]
  );
  const isActive = controller.hasActiveFilters;
  const activeCount = controller.chips.length;

  if (variant === "button") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        aria-pressed={isActive}
        className={cn("h-8", isActive && "border-primary text-primary")}
      >
        <Filter className="mr-2 h-4 w-4" />
        {label}
        {isActive ? (
          <span className="ml-2 rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
            {activeCount}
          </span>
        ) : null}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleClick}
      aria-pressed={isActive}
      className={cn("relative h-8 w-8", isActive && "border-primary text-primary")}
    >
      <Filter className="h-4 w-4" />
      {isActive ? (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-background">
          {Math.min(activeCount, 9)}
        </span>
      ) : null}
    </Button>
  );
};

