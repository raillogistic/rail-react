/** Reusable Partners implementation using the host Rail runtime. */
import { useParams } from "react-router-dom";
import { ModelForm, type ModelFormNestedConfig } from "@/widgets/model-form";
import type { AchatCrudViewConfig } from "../config/viewHelpers";
import type { ModelFormFieldOverrides } from "@/widgets/model-form/types.model";

type AchatModelFormPageProps = {
  app: string;
  model: string;
  title: string;
  description?: string;
  onlyFields: AchatCrudViewConfig["formOnlyFields"];
  generatedSections: AchatCrudViewConfig["formSections"];
  fieldOverrides?: ModelFormFieldOverrides<Record<string, unknown>>;
  nested?: ModelFormNestedConfig<Record<string, unknown>>;
};

export function AchatModelFormPage({
  app,
  model,
  title,
  description,
  onlyFields,
  generatedSections,
  fieldOverrides,
  nested,
}: AchatModelFormPageProps) {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="space-y-4">
      <ModelForm
        title={isUpdate ? `Modifier ${title}` : `Créer ${title}`}
        description={description}
        app={app}
        model={model}
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
        onlyFields={onlyFields}
        generatedSections={generatedSections}
        fieldOverrides={fieldOverrides}
        nested={nested}
      />
    </section>
  );
}

export default AchatModelFormPage;
