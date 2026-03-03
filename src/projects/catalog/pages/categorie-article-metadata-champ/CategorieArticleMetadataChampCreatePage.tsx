import { ModelForm } from "@/widgets/model-form";

export function CategorieArticleMetadataChampCreatePage() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Creer un champ de metadonnee
        </h1>
      </header>
      <ModelForm app="catalog" model="CategorieArticleMetadataChamp" mode="CREATE" />
    </section>
  );
}

export default CategorieArticleMetadataChampCreatePage;
