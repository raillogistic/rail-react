import { ModelForm } from "@/widgets/model-form";

export function ArticleCreatePage() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Creer un article</h1>
      </header>
      <ModelForm app="catalog" model="Article" mode="CREATE" />
    </section>
  );
}

export default ArticleCreatePage;
