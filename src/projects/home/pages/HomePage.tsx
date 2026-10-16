import { PageHeader } from "@/shared/ui/common/PageHeader";

/** Empty application welcome page using the shared page frame. */
export function HomePage() {
  return (
    <section className="space-y-3">
      <PageHeader
        title="Plateforme de commandes"
        description="Votre espace de travail est prêt."
      />
    </section>
  );
}
