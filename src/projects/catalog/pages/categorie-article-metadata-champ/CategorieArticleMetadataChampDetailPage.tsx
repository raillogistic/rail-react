import { useParams } from "react-router-dom";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function CategorieArticleMetadataChampDetailPage() {
  const { id = "" } = useParams();
  return <ModelDynamicDetail app="catalog" model="CategorieArticleMetadataChamp" id={id} />;
}

export default CategorieArticleMetadataChampDetailPage;
