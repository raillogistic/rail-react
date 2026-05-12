import { useParams } from "react-router-dom";
import { RestitutionForm } from "../../forms/RestitutionForm";

/**
 * Page de détail pour une restitution.
 * Affiche le formulaire en mode mise à jour (ou vue seule si configuré).
 */
export function RestitutionDetailPage() {
  const { id = "" } = useParams();

  return (
    <section className="space-y-4">
      <RestitutionForm mode="UPDATE" objectId={id} />
    </section>
  );
}

export default RestitutionDetailPage;
