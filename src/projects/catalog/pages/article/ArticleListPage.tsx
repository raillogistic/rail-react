import { useNavigate } from "react-router-dom";
import { DynamicModelTable } from "@/widgets/model-table";
import { ROUTES } from "@/projects/catalog/config/routes";

function replaceRouteId(pathTemplate: string, id: string): string {
  return pathTemplate.replace(":id", id);
}

export function ArticleListPage() {
  const navigate = useNavigate();

  return (
    <DynamicModelTable
      app="catalog"
      model="Article"
      create={{
        type: "link",
        hrefTemplate: ROUTES.ARTICLE_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.ARTICLE_EDIT,
      }}
      baseTable={{
        tableConfig: {
          title: "Articles",
        },
        columnActions: [
          {
            key: "details",
            label: "Details",
            onClick: ({ row }) => {
              const id = String(row.id ?? "");
              if (!id) return;
              navigate(replaceRouteId(ROUTES.ARTICLE_DETAIL, id));
            },
          },
        ],
      }}
    />
  );
}

export default ArticleListPage;
