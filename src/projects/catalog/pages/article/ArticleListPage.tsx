import { useNavigate } from "react-router-dom";
import { CategorieArticleListPage } from "@/projects/catalog/pages/categorie-article/CategorieArticleListPage";
import { DynamicModelTable } from "@/widgets/model-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/kit/tabs";
import { ROUTES } from "@/projects/catalog/config/routes";

function replaceRouteId(pathTemplate: string, id: string): string {
  return pathTemplate.replace(":id", id);
}

export function ArticleListPage() {
  return (
    <Tabs defaultValue="articles" className="w-full">
      <div className="mb-4 overflow-x-auto">
        <TabsList className="w-full justify-start sm:w-auto">
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="articles" className="mt-0">
        <ArticleTable />
      </TabsContent>

      <TabsContent value="categories" className="mt-0">
        <CategorieArticleListPage />
      </TabsContent>
    </Tabs>
  );
}

function ArticleTable() {
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
