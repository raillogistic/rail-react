import { useParams } from "react-router-dom";
import { ModelForm } from "@/widgets/model-form";

export function ArticleEditPage() {
  const { id = "" } = useParams();

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Modifier un article</h1>
      </header>
      <ModelForm app="catalog" model="Article" mode="UPDATE" objectId={id} />
    </section>
  );
}

export default ArticleEditPage;
