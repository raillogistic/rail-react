import { useParams } from "react-router-dom";
import type { CatalogBenificiaire } from "@/models";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function BeneficiaireDetailPage() {
  const { id = "" } = useParams();
  return (
    <ModelDynamicDetail<CatalogBenificiaire>
      app="catalog"
      model="Benificiaire"
      id={id}
    />
  );
}

export default BeneficiaireDetailPage;
