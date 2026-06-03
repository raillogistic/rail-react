import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { useModelSingleQuery } from "@/shared/api/graphql/graphql/hooks/useModelSingleQuery";
import type { PatrimoineAsset } from "@/models";
import { RestitutionForm } from "../../forms/RestitutionForm";

/**
 * Page de formulaire pour le modèle Restitution.
 */
export function RestitutionFormPage() {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const isUpdate = Boolean(id);
  const assetId = searchParams.get("assetId");

  // Fetch asset details to pre-fill the form with current status and condition
  const { data: assetData, loading: assetLoading } = useModelSingleQuery<PatrimoineAsset>({
    app: "patrimoine",
    model: "Asset",
    id: assetId || "",
    apollo: {
      skip: isUpdate || !assetId,
    }
  });

  const defaultValues = useMemo(() => {
    if (isUpdate) return undefined;
    
    const defaults: any = {
      restitutionDate: format(new Date(), "yyyy-MM-dd"),
    };

    if (assetId) {
      defaults.asset = assetId;
    }

    if (assetData) {
      // Use current asset state as defaults for the restitution
      // For status, we default to 'active' unless the asset was already in a special state
      // but the user wants to "load" the old status.
      if (assetData.administrativeStatus && ["active", "out_of_service", "reformed"].includes(assetData.administrativeStatus)) {
        defaults.administrativeStatus = assetData.administrativeStatus;
      } else {
        defaults.administrativeStatus = "active";
      }

      if (assetData.physicalCondition) {
        defaults.physicalCondition = assetData.physicalCondition;
      }
    }

    return defaults;
  }, [isUpdate, assetId, assetData]);

  if (!isUpdate && assetId && assetLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-muted-foreground animate-pulse font-medium">
          Chargement des détails du bien...
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <RestitutionForm 
        mode={isUpdate ? "UPDATE" : "CREATE"} 
        objectId={isUpdate ? id : undefined}
        state={{
          defaultValues
        }}
      />
    </section>
  );
}

export default RestitutionFormPage;
