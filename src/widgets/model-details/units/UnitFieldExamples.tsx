import * as React from "react";
import { UnitFieldRenderer } from "./UnitFieldRenderer";
import { unitFieldExamples } from "./unitFieldExamples.data";

export function UnitFieldExamples() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {unitFieldExamples.map((field) => (
        <UnitFieldRenderer key={field.id} field={field} />
      ))}
    </div>
  );
}

export default UnitFieldExamples;
