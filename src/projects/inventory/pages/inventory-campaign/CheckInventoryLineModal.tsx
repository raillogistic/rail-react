import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/kit/dialog";
import { ModelDynamicForm } from "@/widgets/model-form";

interface CheckInventoryLineModalProps {
  lineId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckInventoryLineModal({ lineId, open, onOpenChange }: CheckInventoryLineModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Saisie Résultat Inventaire</DialogTitle>
        </DialogHeader>
        <ModelDynamicForm<any>
          app="inventory"
          model="InventoryLine"
          id={lineId}
          mode="update"
          fieldOverrides={{
            campaign: { hidden: true },
            asset: { hidden: true },
            expectedLocation: { hidden: true },
            checkedBy: { hidden: true },
            checkedAt: { hidden: true }
          }}
          onSuccess={() => {
            onOpenChange(false);
            window.location.reload();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
