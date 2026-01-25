import React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/lib/components/ui/tabs";
import { Badge } from "@/lib/components/ui/badge";
import {
  AccordionSectionsForm,
  AutosaveDraftForm,
  BranchingWizardForm,
  CrossSectionValidationForm,
  DrawerSubformForm,
  DynamicSectionsForm,
  MasterDetailPreviewForm,
  ModalSubformForm,
  MultiStepWizardForm,
  ReviewLockForm,
} from "./complex/shapes";
import type { FormSectionConfig, FormSchema } from "./inputs/types";

/**
 * Props accepted by {@link FormExample}.
 */
export type FormExampleProps = Record<string, never>;

type WorkOrderFormValues = {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "";
  status: "draft" | "scheduled" | "in_progress" | "done" | "";
  dueDate?: string;
  scheduledDate?: string;
  assignee?: { name: string; team: string };
  checklist: Array<{ label: string; done: boolean }>;
  parts: Array<{ name: string; quantity: number }>;
  customer?: string;
  qualityNotes?: string;
  budgetCap?: number;
};

const workOrderSections: FormSectionConfig<WorkOrderFormValues>[] = [
  {
    id: "details",
    title: "Détails de l'OT",
    fields: [
      { name: "title", type: "text", label: "Titre", required: true },
      {
        name: "description",
        type: "textarea",
        label: "Description",
        rows: 3,
      },
      {
        name: "priority",
        type: "select",
        label: "Priorité",
        required: true,
        options: [
          { label: "Basse", value: "low" },
          { label: "Moyenne", value: "medium" },
          { label: "Haute", value: "high" },
        ],
      },
      {
        name: "status",
        type: "select",
        label: "Statut",
        required: true,
        options: [
          { label: "Brouillon", value: "draft" },
          { label: "Planifié", value: "scheduled" },
          { label: "En cours", value: "in_progress" },
          { label: "Terminé", value: "done" },
        ],
      },
      { name: "customer", type: "text", label: "Client" },
    ],
  },
  {
    id: "scheduling",
    title: "Planification",
    columns: 2,
    fields: [
      {
        name: "scheduledDate",
        type: "datetime-local",
        label: "Date prévue",
      },
      { name: "dueDate", type: "datetime-local", label: "Échéance" },
    ],
  },
  {
    id: "resources",
    title: "Ressources",
    fields: [
      {
        name: "assignee",
        type: "object",
        label: "Affectation",
        columns: 2,
        fields: [
          { name: "name", type: "text", label: "Nom" },
          { name: "team", type: "text", label: "Équipe" },
        ],
      },
      {
        name: "parts",
        type: "list",
        label: "Pièces",
        addLabel: "Ajouter une pièce",
        itemLabel: "Pièce",
        minItems: 0,
        columns: 2,
        fields: [
          { name: "name", type: "text", label: "Libellé", required: true },
          {
            name: "quantity",
            type: "number",
            label: "Quantité",
            required: true,
            min: 1,
            defaultValue: 1,
          },
        ],
      },
    ],
  },
  {
    id: "checklist",
    title: "Checklist",
    fields: [
      {
        name: "checklist",
        type: "list",
        label: "Étapes",
        addLabel: "Ajouter une étape",
        itemLabel: "Étape",
        fields: [
          {
            name: "label",
            type: "text",
            label: "Libellé",
            required: true,
          },
          {
            name: "done",
            type: "checkbox",
            label: "Terminée",
            defaultValue: false,
          },
        ],
      },
    ],
  },
];

const qualitySection: FormSectionConfig<WorkOrderFormValues> = {
  id: "quality",
  title: "Qualité",
  fields: [
    {
      name: "qualityNotes",
      type: "textarea",
      label: "Notes qualité",
      rows: 3,
    },
    {
      name: "budgetCap",
      type: "number",
      label: "Plafond budget (€)",
      min: 0,
      step: 100,
    },
  ],
};

const mainSchema: FormSchema<WorkOrderFormValues> = {
  id: "workorder",
  sections: workOrderSections,
};

/**
 * Playground rendering every complex form shape via tabs.
 */
export default function FormExample(_: FormExampleProps) {
  const workOrderDefaults: Partial<WorkOrderFormValues> = {
    priority: "medium",
    status: "draft",
    checklist: [{ label: "Créer l'OT", done: true }],
    parts: [{ name: "Filtre", quantity: 1 }],
  };

  const branchingResolver = React.useCallback(
    (values: WorkOrderFormValues) => {
      const base = [workOrderSections[0], workOrderSections[1]].filter(
        Boolean
      ) as FormSectionConfig<WorkOrderFormValues>[];
      if (values.priority === "high") {
        base.push(qualitySection);
      }
      base.push(workOrderSections[2], workOrderSections[3]);
      return base.filter(Boolean) as FormSectionConfig<WorkOrderFormValues>[];
    },
    []
  );

  const validationSchema: FormSchema<WorkOrderFormValues> = {
    id: "validation",
    sections: [
      {
        ...workOrderSections[1],
        fields: workOrderSections[1].fields.map((field) =>
          field.type === "datetime-local" && field.name === "dueDate"
            ? {
                ...field,
                validators: [
                  (value, ctx) => {
                    const start = (ctx.values as WorkOrderFormValues)
                      .scheduledDate;
                    if (start && value && value < start) {
                      return "L'échéance doit être après la date prévue";
                    }
                    return undefined;
                  },
                ],
              }
            : field
        ),
      },
      qualitySection,
    ],
  };

  const loadQualitySections = React.useCallback(
    () =>
      Promise.resolve([
        {
          id: "qualite",
          title: "Qualité (chargée dynamiquement)",
          fields: [
            {
              name: "qualityNotes",
              type: "textarea",
              label: "Notes qualité",
            },
          ],
        },
      ]),
    []
  );

  const renderPreview = (values: WorkOrderFormValues) => (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{values.title || "Sans titre"}</p>
        <Badge variant="secondary">{values.status || "N/A"}</Badge>
      </div>
      <p className="text-muted-foreground">{values.description || "—"}</p>
      <div className="text-xs text-muted-foreground space-y-1">
        <p>Priorité: {values.priority || "—"}</p>
        <p>
          Planifié: {values.scheduledDate || "?"} → {values.dueDate || "?"}
        </p>
        <p>
          Assigné: {values.assignee?.name || "Non défini"} (
          {values.assignee?.team || "Équipe ?"})
        </p>
      </div>
      <div className="text-xs">
        <p className="font-semibold">Pièces</p>
        <ul className="list-disc pl-4 space-y-1">
          {(values.parts ?? []).map((part, index) => (
            <li key={`${part.name}-${index}`}>
              {part.name} × {part.quantity ?? 0}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const examples = [
    {
      value: "multi",
      label: "Multi-étapes",
      component: (
        <MultiStepWizardForm
          sections={workOrderSections}
          defaultValues={workOrderDefaults}
        />
      ),
    },
    {
      value: "branching",
      label: "Branchements",
      component: (
        <BranchingWizardForm
          resolveSections={branchingResolver}
          defaultValues={workOrderDefaults}
        />
      ),
    },
    {
      value: "accordion",
      label: "Accordion",
      component: (
        <AccordionSectionsForm
          sections={workOrderSections}
          defaultValues={workOrderDefaults}
        />
      ),
    },
    {
      value: "review",
      label: "Revue verrouillée",
      component: (
        <ReviewLockForm schema={mainSchema} defaultValues={workOrderDefaults} />
      ),
    },
    {
      value: "master-detail",
      label: "Master/Preview",
      component: (
        <MasterDetailPreviewForm
          schema={mainSchema}
          defaultValues={workOrderDefaults}
          renderPreview={renderPreview}
        />
      ),
    },
    {
      value: "modal",
      label: "Modal",
      component: (
        <ModalSubformForm
          schema={mainSchema}
          modalSchema={{
            id: "assignee-modal",
            sections: [
              {
                id: "assignee",
                title: "Affectation",
                fields: [
                  { name: "assignee.name", type: "text", label: "Nom" },
                  { name: "assignee.team", type: "text", label: "Équipe" },
                ],
              },
            ],
          }}
          defaultValues={workOrderDefaults}
          triggerLabel="Configurer l'affectation"
        />
      ),
    },
    {
      value: "drawer",
      label: "Drawer",
      component: (
        <DrawerSubformForm
          schema={{
            id: "drawer-parent",
            sections: workOrderSections.filter(
              (section) => section.id !== "resources"
            ),
          }}
          drawerSchema={{
            id: "parts-editor",
            sections: [
              {
                id: "parts",
                title: "Pièces",
                fields: workOrderSections.find(
                  (section) => section.id === "resources"
                )?.fields.filter((field) => field.name === "parts") ?? [],
              },
            ],
          }}
          defaultValues={workOrderDefaults}
          triggerLabel="Éditer les pièces"
        />
      ),
    },
    {
      value: "dynamic",
      label: "Sections dynamiques",
      component: (
        <DynamicSectionsForm
          baseSchema={mainSchema}
          defaultValues={workOrderDefaults}
          loadExtraSections={loadQualitySections}
        />
      ),
    },
    {
      value: "validation",
      label: "Validation croisée",
      component: (
        <CrossSectionValidationForm
          schema={validationSchema}
          defaultValues={workOrderDefaults}
          debug
        />
      ),
    },
    {
      value: "autosave",
      label: "Autosave",
      component: (
        <AutosaveDraftForm
          schema={mainSchema}
          defaultValues={workOrderDefaults}
          onDraftSave={(values) =>
            Promise.resolve().then(() => {
              if (typeof window === "undefined") return;
              window.localStorage.setItem(
                "workorder-draft",
                JSON.stringify(values, null, 2)
              );
            })
          }
        />
      ),
    },
  ];

  return (
    <Tabs defaultValue="multi" className="flex h-full flex-col gap-3">
      <TabsList>
        {examples.map((example) => (
          <TabsTrigger key={example.value} value={example.value}>
            {example.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {examples.map((example) => (
        <TabsContent key={example.value} value={example.value}>
          {example.component}
        </TabsContent>
      ))}
    </Tabs>
  );
}
