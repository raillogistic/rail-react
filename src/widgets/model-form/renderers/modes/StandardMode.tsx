/**
 * Standard mode: renders sections sequentially in a vertical stack.
 */
import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import type { FormSectionConfig } from "../../types/schema";
import { SectionRenderer } from "../SectionRenderer";

export type StandardModeProps<TValues> = {
 sections: FormSectionConfig[];
 form: UseFormReturn<TValues>;
 columns: number;
 defaultColSpan?: number;
 showHeaders: boolean;
 variant: "default" | "compact" | "popup";
 hiddenFields?: Set<string>;
 hiddenSections?: Set<string>;
 globalReadOnly?: boolean;
 globalDisabled?: boolean;
};

export const StandardMode = <TValues extends Record<string, any>>({
 sections,
  form,
  columns,
  defaultColSpan,
  showHeaders,
  variant,
 hiddenFields,
 hiddenSections,
 globalReadOnly,
 globalDisabled,
}: StandardModeProps<TValues>) => {
 return (
 <div className="flex flex-col gap-8 animate-in fade-in duration-500">
 {sections.map((section, index) => {
 const sectionId = section.id ??`__section_${index}`;
 if (hiddenSections?.has(sectionId)) return null;

 return (
 <div 
 key={sectionId}
 className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out"
 style={{ animationDelay:`${index * 100}ms`, animationFillMode: 'both' }}
 >
         <SectionRenderer
           section={section}
           form={form}
           columns={section.columns ?? columns}
           defaultColSpan={defaultColSpan}
           showHeaders={showHeaders}
           variant={variant}
           hiddenFields={hiddenFields}
 globalReadOnly={globalReadOnly}
 globalDisabled={globalDisabled}
 />
 </div>
 );
 })}
 </div>
 );
};

