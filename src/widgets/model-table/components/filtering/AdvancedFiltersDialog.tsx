import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/kit/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/kit/drawer";
import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/utils";
import { Plus } from "lucide-react";
import { AdvancedFilteringController } from "./types";
import { FilterGroupEditor } from "./FilterGroupEditor";

/**
 * Props for {@link AdvancedFiltersDialog}.
 */
export type AdvancedFiltersDialogProps = {
  /** Controller returned by {@link useAdvancedFiltering}. */
  controller: AdvancedFilteringController;
  /**
   * Props forwarded to the Radix {@link Dialog} root.
   * Useful for advanced behaviors like `modal={false}`.
   */
  dialogProps?: Omit<React.ComponentProps<typeof Dialog>, "open" | "onOpenChange" | "children">;
  /**
   * Props forwarded to the Vaul {@link Drawer} root.
   * Useful for controlling drawer direction (e.g. `direction="right"`).
   */
  drawerProps?: Omit<React.ComponentProps<typeof Drawer>, "open" | "onOpenChange" | "children">;
  /**
   * Props forwarded to Radix {@link DialogContent} when `displayMode="dialog"`.
   * Use this to control sizing (width/height), scrolling, etc.
   */
  dialogContentProps?: Omit<React.ComponentProps<typeof DialogContent>, "children">;
  /**
   * Props forwarded to Vaul {@link DrawerContent} when `displayMode="drawer"`.
   * Use this to control sizing (width/height), direction classes, etc.
   */
  drawerContentProps?: Omit<React.ComponentProps<typeof DrawerContent>, "children">;
};

const BuilderBody: React.FC<{ controller: AdvancedFilteringController }> = ({
  controller,
}) => (
  <div className="space-y-4 py-2">
    <FilterGroupEditor controller={controller} group={controller.rootGroup} />
  </div>
);

export const AdvancedFiltersDialog: React.FC<AdvancedFiltersDialogProps> = ({
  controller,
  dialogProps,
  drawerProps,
  dialogContentProps,
  drawerContentProps,
}) => {
  if (!controller.filtersMeta.length) return null;
  const builderIsEmpty =
    controller.rootGroup.conditions.length === 0 &&
    controller.rootGroup.groups.length === 0;

  if (controller.displayMode === "drawer") {
    const mergedDrawerClassName = cn(drawerContentProps?.className);
    return (
      <Drawer
        {...drawerProps}
        open={controller.isOpen}
        onOpenChange={controller.setDialogOpen}
      >
        <DrawerContent
          {...drawerContentProps}
          className={mergedDrawerClassName}
        >
          <DrawerHeader>
            <div className="flex items-center justify-between gap-3">
              <DrawerTitle>{controller.title}</DrawerTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => controller.addCondition("root")}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Condition
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => controller.addGroup("root")}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Groupe
                </Button>
              </div>
            </div>
          </DrawerHeader>
          <div className="px-4">
            <BuilderBody controller={controller} />
          </div>
          <DrawerFooter>
            <Button variant="outline" onClick={controller.resetBuilder}>
              Reinitialiser
            </Button>
            <Button onClick={controller.applyFilters} disabled={builderIsEmpty}>
              Appliquer
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  const mergedDialogClassName = cn(
    "w-[95vw] md:max-w-[60vw] max-h-[60vh] overflow-y-auto",
    dialogContentProps?.className,
  );

  return (
    <Dialog
      {...dialogProps}
      open={controller.isOpen}
      onOpenChange={controller.setDialogOpen}
    >
      <DialogContent {...dialogContentProps} className={mergedDialogClassName}>
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 py-4">
            <DialogTitle>{controller.title}</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => controller.addCondition("root")}
              >
                <Plus className="mr-1 h-4 w-4" />
                Condition
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => controller.addGroup("root")}
              >
                <Plus className="mr-1 h-4 w-4" />
                Groupe
              </Button>
            </div>
          </div>
        </DialogHeader>
        <BuilderBody controller={controller} />
        <DialogFooter>
          <Button variant="outline" onClick={controller.resetBuilder}>
            Reinitialiser
          </Button>
          <Button onClick={controller.applyFilters} disabled={builderIsEmpty}>
            Appliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

