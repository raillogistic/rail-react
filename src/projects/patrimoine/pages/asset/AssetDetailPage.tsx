import { useParams } from "react-router-dom";
import type { PatrimoineAsset } from "@/models";
import { ModelDynamicDetail } from "@/widgets/model-details";
import { 
  FileText, 
  Coins, 
  Activity, 
  GitBranch, 
  Tag, 
  MapPin, 
  User, 
  Info,
  History,
  Paperclip,
  TrendingDown
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, addMonths, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Composant pour afficher le graphique d'amortissement.
 */
const DepreciationChart = ({ asset }: { asset: PatrimoineAsset }) => {
  const profile = asset.financialProfile?.[0];
  if (!profile || !profile.depreciationDurationMonths || !profile.depreciationStartDate || !profile.depreciableBaseValue) {
    return <div className="text-muted-foreground text-sm italic p-4 text-center">Données d'amortissement incomplètes pour générer le graphique.</div>;
  }

  const base = Number(profile.depreciableBaseValue);
  const residual = Number(profile.residualValue || 0);
  const duration = profile.depreciationDurationMonths;
  const startDate = parseISO(profile.depreciationStartDate as unknown as string);

  const data = [];
  for (let i = 0; i <= duration; i++) {
    const date = addMonths(startDate, i);
    const value = Math.max(residual, base - ((base - residual) * i / duration));
    data.push({
      month: format(date, "MMM yyyy", { locale: fr }),
      valeur: value,
    });
  }

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 10 }} 
            interval={Math.floor(duration / 6)}
          />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip 
            formatter={(value: number) => [new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value), 'Valeur Nette']}
          />
          <Area type="monotone" dataKey="valeur" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Page de détail pour le modèle Asset (Bien).
 * Affiche les informations du bien organisées en onglets.
 */
export function AssetDetailPage() {
  const { id = "" } = useParams();

  return (
    <ModelDynamicDetail<PatrimoineAsset>
      app="patrimoine"
      model="Asset"
      id={id}
      baseDetail={{
        layout: {
          // T-2-13: Onglets général, métadonnées, finance, affectations, mouvements, documents
          tabs: [
            { id: "general", title: "Général", order: 10, icon: <Info className="h-4 w-4" /> },
            { id: "metadata", title: "Métadonnées", order: 20, icon: <Tag className="h-4 w-4" /> },
            { id: "finance", title: "Finance", order: 30, icon: <Coins className="h-4 w-4" /> },
            { id: "assignments", title: "Affectations", order: 40, icon: <User className="h-4 w-4" /> },
            { id: "movements", title: "Mouvements", order: 50, icon: <Activity className="h-4 w-4" /> },
            { id: "history", title: "Historique", order: 60, icon: <History className="h-4 w-4" /> },
            { id: "documents", title: "Documents", order: 70, icon: <Paperclip className="h-4 w-4" /> },
          ],
          sections: [
            {
              id: "general-info",
              title: "Informations générales",
              tabId: "general",
              order: 1,
              fields: [
                "inventoryCode",
                "name",
                "category",
                "family",
                "assetType",
                "administrativeStatus",
                "physicalCondition",
                "location",
              ],
            },
            {
              id: "identification",
              title: "Identification et Codes",
              tabId: "general",
              order: 2,
              fields: [
                "serialNumber",
                "brand",
                "modelName",
                "qrCodeValue",
                "legacyCode",
              ],
            },
            {
              id: "acquisition",
              title: "Acquisition",
              tabId: "general",
              order: 3,
              fields: [
                "acquisitionMethod",
                "acquisitionDate",
                "acquisitionValue",
                "supplier",
              ],
            },
            {
              id: "responsibility",
              title: "Responsabilité",
              tabId: "general",
              order: 4,
              fields: [
                "responsibleEmployee",
                "responsibleService",
              ],
            },
            {
              id: "ownership",
              title: "Propriété",
              tabId: "general",
              order: 5,
              fields: [
                "ownershipStatus",
                "actualOwnerType",
                "actualOwnerName",
                "actualOwnerSupplier",
              ],
            },
            {
              id: "finance-asset-info",
              title: "Classification Financière",
              tabId: "finance",
              order: 1,
              fields: [
                { path: "assetType", label: "Type de bien (Lecture seule)" },
              ],
            },
            {
              id: "exit-info",
              title: "Sortie du patrimoine",
              tabId: "general",
              order: 6,
              fields: [
                "exitMethod",
                "exitDate",
                "archivedAt",
              ],
              // Afficher uniquement si le bien est sorti ou archivé
              visible: ({ data }) => Boolean(data?.exitDate || data?.archivedAt || data?.administrativeStatus === 'disposed' || data?.administrativeStatus === 'archived'),
            },
            {
              id: "audit-info",
              title: "Audit",
              tabId: "history",
              fields: [
                "createdAt",
                "createdBy",
                "updatedAt",
                "updatedBy",
              ],
            }
          ],
          customSections: [
            {
              id: "depreciation-chart-section",
              title: "Plan d'amortissement",
              tabId: "finance",
              order: 10,
              render: ({ data }) => data ? <DepreciationChart asset={data} /> : null,
            }
          ]
        },
        nestedFields: {
          // T-2-13: Métadonnées dynamiques
          "metadataValues": {
            tabId: "metadata",
            title: "Valeurs de métadonnées",
            mode: "table",
          },
          // T-2-13: Finance (via Profil Financier)
          "financialProfile": {
            tabId: "finance",
            title: "Profil financier",
            mode: "object",
          },
          // T-3-08: Historique des affectations
          "assignments": {
            tabId: "assignments",
            title: "Historique des affectations",
            mode: "table",
          },
          // T-3-08: Historique des mouvements
          "movements": {
            tabId: "movements",
            title: "Historique des mouvements",
            mode: "table",
          },
          // T-4-07: Documents et pièces jointes
          "documents": {
            tabId: "documents",
            title: "Documents",
            mode: "attachments",
          }
        }
      }}
    />
  );
}

export default AssetDetailPage;
