/**
 * Page de formulaire pour le modèle Asset (Bien).
 *
 * Orchestre le formulaire principal (AssetForm).
 *
 * @module patrimoine/pages/asset/AssetFormPage
 */
import { useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AssetForm } from "../../forms/AssetForm";

/**
 * Page de formulaire pour le modèle Asset (Bien).
 */
export function AssetFormPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const isUpdate = Boolean(id);

  const [formInstance, setFormInstance] = useState<any>(null);

  /**
   * Callback appelé quand le TanStack Form est initialisé.
   * Enregistre l'instance et lit les valeurs initiales.
   */
  const handleFormReady = useCallback((form: any) => {
    setFormInstance(form);
  }, []);

  const handleSuccess = useCallback(
    (data: any) => {
      // Navigation vers la page de détail après création réussie
      if (!isUpdate && data?.id) {
        navigate(`/patrimoine/asset/detail/${data.id}`);
      }
    },
    [isUpdate, navigate],
  );

  return (
    <section className="space-y-0">
      <AssetForm
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
        onFormReady={handleFormReady}
        onSuccess={handleSuccess}
      />
    </section>
  );
}

export default AssetFormPage;