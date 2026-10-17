/** Reusable Partners implementation using the host Rail runtime. */
import { useParams } from "react-router-dom";
import { PageHeader } from "@/shared/ui/common/PageHeader";
import { ModelDynamicDetail } from "@/widgets/model-details";
import type { AchatCrudViewConfig } from "../config/viewHelpers";

type AchatModelDetailPageProps = {
  app: string;
  model: string;
  title: string;
  description?: string;
  detailConfig: AchatCrudViewConfig["detailConfig"];
};

export function AchatModelDetailPage({
  app,
  model,
  title,
  description,
  detailConfig,
}: AchatModelDetailPageProps) {
  const { id = "" } = useParams();

  return (
    <section className="space-y-4">
      <PageHeader title={title} description={description} />
      <ModelDynamicDetail
        app={app}
        model={model}
        id={id}
        baseDetail={detailConfig}
      />
    </section>
  );
}

export default AchatModelDetailPage;
