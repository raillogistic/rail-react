import { useParams } from "react-router-dom";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function ArticleDetailPage() {
  const { id = "" } = useParams();
  return <ModelDynamicDetail app="catalog" model="Article" id={id} />;
}

export default ArticleDetailPage;
