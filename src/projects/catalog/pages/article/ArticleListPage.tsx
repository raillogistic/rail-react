import { CategorieArticleListPage } from "@/projects/catalog/pages/categorie-article/CategorieArticleListPage";
import { DynamicModelTable } from "@/widgets/model-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/kit/tabs";

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
  return (
    <DynamicModelTable
      app="catalog"
      model="Article"
      // create={{
      //   type: "link",
      //   hrefTemplate: ROUTES.ARTICLE_CREATE,
      // }}
      // update={{
      //   type: "link",
      //   hrefTemplate: ROUTES.ARTICLE_EDIT,
      // }}
      // detail={{
      //   type: "link",
      //   hrefTemplate: ROUTES.ARTICLE_DETAIL,
      // }}
      // detail={{
      //   type: "modal",
      // }}
      baseTable={{
        tableConfig: {
          title: "Articles",
        },
      }}
    />
  );
}

export default ArticleListPage;
