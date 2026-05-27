import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/kit/dialog";
import { ModelForm } from "@/widgets/model-form";

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
        <ModelForm<any>
          app="inventory"
          model="InventoryLine"
          objectId={lineId}
          mode="UPDATE"
          fieldOverrides={{
            campaign: { hidden: true },
            asset: { hidden: true },
            expectedLocation: { hidden: true },
            checkedBy: { hidden: true },
            checkedAt: { hidden: true }
          }}
          onSubmitResult={(result) => {
            if (result.ok) {
              onOpenChange(false);
              window.location.reload();
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
