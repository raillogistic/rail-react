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
  Paperclip
} from "lucide-react";

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
          }
        }
      }}
    />
  );
}

export default AssetDetailPage;
