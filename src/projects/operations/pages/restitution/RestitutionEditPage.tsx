import { useParams } from "react-router-dom";
import { ModelForm } from "@/widgets/model-form";

export function RestitutionEditPage() {
  const { id = "" } = useParams();

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Modifier une restitution
        </h1>
      </header>
      <ModelForm app="operations" model="Restitution" mode="UPDATE" objectId={id} />
    </section>
  );
}

export default RestitutionEditPage;
