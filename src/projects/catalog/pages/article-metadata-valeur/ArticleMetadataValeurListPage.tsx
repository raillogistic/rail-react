import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/kit/dialog";
import { ModelDynamicDetail } from "@/widgets/model-details";
import { DynamicModelTable } from "@/widgets/model-table";

export function ArticleMetadataValeurListPage() {
  const [detailId, setDetailId] = useState<string | null>(null);

  return (
    <>
      <DynamicModelTable
        app="catalog"
        model="ArticleMetadataValeur"
        create={{ type: "drawer" }}
        update={{ type: "drawer" }}
        baseTable={{
          tableConfig: {
            title: "Valeurs de metadonnees",
          },
          columnActions: [
            {
              key: "details",
              label: "Details",
              onClick: ({ row }) => {
                const id = String(row.id ?? "");
                if (!id) return;
                setDetailId(id);
              },
            },
          ],
        }}
      />

      <Dialog open={Boolean(detailId)} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Detail valeur de metadonnee</DialogTitle>
          </DialogHeader>
          {detailId ? (
            <ModelDynamicDetail app="catalog" model="ArticleMetadataValeur" id={detailId} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ArticleMetadataValeurListPage;
