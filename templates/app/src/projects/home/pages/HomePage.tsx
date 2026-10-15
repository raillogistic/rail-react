import { PageHeader } from "@/shared/ui/common/PageHeader";

/**
 * Page d'accueil minimale générée pour le projet.
 *
 * @returns {React.ReactElement}
 */
export function HomePage() {
  return (
    <section className="space-y-3">
      <PageHeader
        title="Bienvenue"
        description="Votre application est prête. Ajoutez vos pages et vos modèles."
      />
    </section>
  );
}

export default HomePage;
