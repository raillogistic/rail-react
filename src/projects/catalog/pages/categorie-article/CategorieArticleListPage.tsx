import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/kit/dialog";
import { ModelDynamicDetail } from "@/widgets/model-details";
import { DynamicModelTable } from "@/widgets/model-table";

export function CategorieArticleListPage() {
  const [detailId, setDetailId] = useState<string | null>(null);

  return (
    <>
      <DynamicModelTable
        app="catalog"
        model="CategorieArticle"
        create={{ type: "drawer" }}
        update={{ type: "drawer" }}
        baseTable={{
          tableConfig: {
            title: "Categories d'article",
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
            <DialogTitle>Detail categorie d'article</DialogTitle>
          </DialogHeader>
          {detailId ? (
            <ModelDynamicDetail app="catalog" model="CategorieArticle" id={detailId} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CategorieArticleListPage;
