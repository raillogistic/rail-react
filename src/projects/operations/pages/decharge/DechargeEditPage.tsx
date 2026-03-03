import { useParams } from "react-router-dom";
import { ModelForm } from "@/widgets/model-form";

export function DechargeEditPage() {
  const { id = "" } = useParams();

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Modifier une decharge
        </h1>
      </header>
      <ModelForm app="operations" model="Decharge" mode="UPDATE" objectId={id} />
    </section>
  );
}

export default DechargeEditPage;
