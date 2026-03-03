import { ModelForm } from "@/widgets/model-form";

export function RestitutionCreatePage() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Creer une restitution
        </h1>
      </header>
      <ModelForm
        app="operations"
        model="Restitution"
        mode="CREATE"
        layout={{ columns: 3 }}
      />
    </section>
  );
}

export default RestitutionCreatePage;
