import { useParams } from "react-router-dom";
import type { PatrimoineAsset } from "@/models";
import { ModelDynamicDetail } from "@/widgets/model-details";
import { ModelForm } from "@/widgets/model-form";
import { AmortizationChart } from "./AmortizationChart";
import { Card, CardContent } from "@/shared/ui/kit/card";
import { useModelSingleQuery } from "@/shared/api/graphql/graphql";

function FinanceTab({ assetId }: { assetId: string }) {
  const { data: asset, loading } = useModelSingleQuery<any>({
    app: "patrimoine",
    model: "Asset",
    id: assetId,
    fields: [
      "id",
      "assetType",
      "financialProfile { id depreciableBaseValue residualValue depreciationDurationMonths depreciationStartDate depreciationMethod resolvedDepreciationMethod resolvedDepreciationDuration }"
    ]
  });

  if (loading) return <div>Chargement du profil financier...</div>;

  const profile = asset?.financialProfile;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-muted rounded-md">
              <span className="text-sm text-muted-foreground">Type de bien (Lecture seule)</span>
              <p className="font-semibold">{asset?.assetType === 'investment' ? 'Investissement' : 'Extra-comptable'}</p>
            </div>
          </div>
          
          <ModelForm<any>
            app="patrimoine"
            model="AssetFinancialProfile"
            objectId={profile?.id}
            mode={profile?.id ? "UPDATE" : "CREATE"}
            state={!profile?.id ? { defaultValues: { asset: { connect: assetId } } } : undefined}
            onSubmitResult={(result) => {
              if (result.ok) {
                window.location.reload();
              }
            }}
          />
        </CardContent>
      </Card>

      {profile && profile.resolvedDepreciationMethod === 'linear' && (
        <AmortizationChart
          baseValue={profile.depreciableBaseValue || 0}
          residualValue={profile.residualValue || 0}
          durationMonths={profile.resolvedDepreciationDuration || 0}
          startDate={profile.depreciationStartDate || ""}
        />
      )}
    </div>
  );
}

export function AssetDetailPage() {
  const { id = "" } = useParams();
  return (
    <ModelDynamicDetail<PatrimoineAsset> 
      app="patrimoine" 
      model="Asset" 
      id={id} 
      baseDetail={{
        layout: {
          customSections: [
            {
              id: "finance",
              title: "Finance",
              render: () => <FinanceTab assetId={id} />
            }
          ]
        },
        actions: {
          customMutations: ({ data }) => {
            const status = data?.administrativeStatus;
            return {
              overrides: {
                reactivate: {
                  hidden: status !== "out_of_service",
                },
                set_out_of_service: {
                  hidden: status !== "active" && status !== "assigned",
                },
              },
            };
          },
        }
      }}
    />
  );
}

export default AssetDetailPage;
