import { gql, useApolloClient, useQuery } from "@apollo/client";
import React from "react";

import {
  MODEL_FORM_CONTRACT_QUERY,
  MODEL_FORM_INITIAL_DATA_QUERY,
} from "@/graphql/modelFormContract";
import {
  DynamicForm,
  ModelForm,
  buildGeneratedMutationDocument,
  resolveGeneratedMutationOperation,
  useGeneratedFormMetrics,
  useGeneratedModelForm,
  useGeneratedValidators,
} from "@/lib/form";
import type {
  ModelFormContract,
  ModelFormInitialData,
  ModelFormMode,
  ModelFormRuntimeOverride,
} from "@/lib/form/types/generatedContract";
import { normalizeGeneratedErrorsForForm } from "@/lib/form/utils/errors";
import { serializeRuntimeOverridesForQuery } from "@/lib/form/utils/jsonCoercion";
import { buildNestedMutationPayload } from "@/lib/form/utils/nestedMutationPayload";
import { ModelTableV2 } from "@/lib/table";
import type { FormSchema } from "@/lib/form";
import { Button } from "@/lib/components/ui/button";

// ─── 1. Simple Contact Form ─────────────────────────────────────────────────
// Flat fields, basic submit, custom action buttons, dirty indicator.

const contactSchema: FormSchema = {
  fields: [
    { name: "firstName", type: "text", label: "First Name", required: true },
    { name: "lastName", type: "text", label: "Last Name", required: true },
    {
      name: "email",
      type: "email",
      label: "Email",
      placeholder: "you@example.com",
    },
    {
      name: "phone",
      type: "text",
      label: "Phone",
      placeholder: "+1 (555) 000-0000",
    },
    {
      name: "message",
      type: "textarea",
      label: "Message",
      rows: 4,
      colSpan: 2,
    },
  ],
};

export const ContactForm = () => (
  <DynamicForm
    schema={contactSchema}
    behavior={{
      onSubmit: async (values) => {
        console.log("Contact submitted:", values);
      },
    }}
    layout={{ columns: 2, variant: "default" }}
    actions={{
      submitLabel: "Send Message",
      resetLabel: "Clear",
      showDirtyIndicator: true,
      extra: (
        <Button type="button" variant="outline">
          Cancel
        </Button>
      ),
    }}
  />
);

// ─── 2. Settings Form with Conditions & Computed ─────────────────────────────
// Multi-section, accordion mode, conditional visibility, computed fields.

type SettingsValues = {
  enableNotifications: boolean;
  notifyEmail: string;
  notifyFrequency: string;
  enableApi: boolean;
  apiKey: string;
  rateLimit: number;
  estimatedCost: number;
};

const settingsSchema: FormSchema<SettingsValues> = {
  sections: [
    {
      id: "notifications",
      title: "Notifications",
      description: "Configure how you receive alerts.",
      fields: [
        {
          name: "enableNotifications",
          type: "switch",
          label: "Enable Notifications",
          defaultValue: false,
        },
        {
          name: "notifyEmail",
          type: "email",
          label: "Notification Email",
          placeholder: "alerts@company.com",
        },
        {
          name: "notifyFrequency",
          type: "select",
          label: "Frequency",
          options: [
            { label: "Instant", value: "instant" },
            { label: "Hourly Digest", value: "hourly" },
            { label: "Daily Digest", value: "daily" },
          ],
        },
      ],
    },
    {
      id: "api",
      title: "API Access",
      description: "Manage your API credentials and limits.",
      fields: [
        {
          name: "enableApi",
          type: "switch",
          label: "Enable API Access",
          defaultValue: false,
        },
        {
          name: "apiKey",
          type: "text",
          label: "API Key",
          readOnly: true,
          defaultValue: "sk_live_xxxxxxxxxxxxxxxx",
        },
        {
          name: "rateLimit",
          type: "slider",
          label: "Rate Limit (req/min)",
          min: 10,
          max: 1000,
          step: 10,
          defaultValue: 100,
        },
        {
          name: "estimatedCost",
          type: "number",
          label: "Estimated Monthly Cost ($)",
          readOnly: true,
        },
      ],
    },
  ],
};

export const SettingsForm = () => (
  <DynamicForm<SettingsValues>
    schema={settingsSchema}
    behavior={{
      onSubmit: async (values) => {
        console.log("Settings saved:", values);
      },
      conditions: {
        notifyEmail: (v) => v.enableNotifications,
        notifyFrequency: (v) => v.enableNotifications,
        apiKey: (v) => v.enableApi,
        rateLimit: (v) => v.enableApi,
        estimatedCost: (v) => v.enableApi,
      },
      computed: {
        estimatedCost: (v) => Math.round(v.rateLimit * 0.05 * 100) / 100,
      },
    }}
    layout={{
      columns: 2,
      mode: {
        type: "accordion",
        defaultExpanded: "first",
        allowMultiple: true,
      },
    }}
    actions={{ submitLabel: "Save Settings" }}
  />
);

// ─── 3. Multi-Step Wizard ────────────────────────────────────────────────────
// Wizard mode with step validation, progress bar, and conditional branching.

type OnboardingValues = {
  fullName: string;
  email: string;
  accountType: string;
  companyName: string;
  companySize: string;
  bio: string;
  agreeTerms: boolean;
};

const onboardingSchema: FormSchema<OnboardingValues> = {
  sections: [
    {
      id: "identity",
      title: "Your Identity",
      step: {
        label: "Identity",
        canAdvance: (v) => !!v.fullName && !!v.email,
      },
      fields: [
        { name: "fullName", type: "text", label: "Full Name", required: true },
        {
          name: "email",
          type: "email",
          label: "Email Address",
          required: true,
        },
        {
          name: "accountType",
          type: "radio",
          label: "Account Type",
          options: [
            { label: "Personal", value: "personal" },
            { label: "Business", value: "business" },
          ],
          defaultValue: "personal",
        },
      ],
    },
    {
      id: "company",
      title: "Company Details",
      step: { label: "Company", optional: true },
      visible: (v) => v.accountType === "business",
      fields: [
        {
          name: "companyName",
          type: "text",
          label: "Company Name",
          required: true,
        },
        {
          name: "companySize",
          type: "select",
          label: "Company Size",
          options: [
            { label: "1-10", value: "small" },
            { label: "11-50", value: "medium" },
            { label: "51-200", value: "large" },
            { label: "200+", value: "enterprise" },
          ],
        },
      ],
    },
    {
      id: "profile",
      title: "Profile",
      step: { label: "Profile" },
      fields: [
        {
          name: "bio",
          type: "textarea",
          label: "Short Bio",
          placeholder: "Tell us about yourself...",
          rows: 3,
          colSpan: 2,
        },
      ],
    },
    {
      id: "confirm",
      title: "Confirm & Agree",
      step: {
        label: "Confirm",
        canAdvance: (v) => v.agreeTerms === true,
      },
      fields: [
        {
          name: "agreeTerms",
          type: "checkbox",
          label: "I agree to the Terms of Service and Privacy Policy",
          defaultValue: false,
        },
      ],
    },
  ],
};

export const OnboardingWizard = () => (
  <DynamicForm<OnboardingValues>
    schema={onboardingSchema}
    behavior={{
      onSubmit: async (values) => {
        console.log("Onboarding complete:", values);
      },
    }}
    layout={{
      columns: 2,
      mode: { type: "wizard", showProgress: true, allowSkip: false },
    }}
  />
);

// ─── 4. Invoice Form with Master-Detail Preview ─────────────────────────────
// Master-detail mode, list fields for line items, computed totals, nested objects.

type InvoiceValues = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  client: { name: string; email: string; address: string };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  taxRate: number;
  total: number;
  notes: string;
};

const invoiceSchema: FormSchema<InvoiceValues> = {
  sections: [
    {
      id: "header",
      title: "Invoice Details",
      columns: 3,
      fields: [
        {
          name: "invoiceNumber",
          type: "text",
          label: "Invoice #",
          defaultValue: "INV-001",
        },
        { name: "issueDate", type: "date", label: "Issue Date" },
        { name: "dueDate", type: "date", label: "Due Date" },
      ],
    },
    {
      id: "client",
      title: "Client",
      fields: [
        {
          name: "client",
          type: "object",
          label: "Client Information",
          columns: 2,
          fields: [
            { name: "name", type: "text", label: "Client Name" },
            { name: "email", type: "email", label: "Client Email" },
            {
              name: "address",
              type: "textarea",
              label: "Address",
              rows: 2,
              colSpan: 2,
            },
          ],
        },
      ],
    },
    {
      id: "items",
      title: "Line Items",
      fields: [
        {
          name: "lineItems",
          type: "list",
          label: "Items",
          addLabel: "Add Line Item",
          minItems: 1,
          maxItems: 20,
          columns: 3,
          fields: [
            {
              name: "description",
              type: "text",
              label: "Description",
              required: true,
            },
            {
              name: "quantity",
              type: "number",
              label: "Qty",
              min: 1,
              defaultValue: 1,
            },
            {
              name: "unitPrice",
              type: "decimal",
              label: "Unit Price",
              min: 0,
              step: 0.01,
              defaultValue: 0,
            },
          ],
        },
      ],
    },
    {
      id: "totals",
      title: "Totals",
      columns: 3,
      fields: [
        {
          name: "subtotal",
          type: "decimal",
          label: "Subtotal",
          readOnly: true,
        },
        {
          name: "taxRate",
          type: "number",
          label: "Tax %",
          min: 0,
          max: 100,
          defaultValue: 10,
        },
        { name: "total", type: "decimal", label: "Total", readOnly: true },
      ],
    },
    {
      id: "notes",
      title: "Notes",
      fields: [
        {
          name: "notes",
          type: "textarea",
          label: "Notes / Payment Terms",
          rows: 3,
          colSpan: 2,
          placeholder: "Payment due within 30 days...",
        },
      ],
    },
  ],
};

const InvoicePreview = ({ values }: { values: InvoiceValues }) => (
  <div className="space-y-4 text-sm">
    <div className="flex justify-between">
      <div>
        <p className="text-lg font-bold">{values.invoiceNumber || "INV-..."}</p>
        <p className="text-muted-foreground">
          {values.issueDate || "—"} &rarr; {values.dueDate || "—"}
        </p>
      </div>
      <div className="text-right">
        <p className="font-medium">{values.client?.name || "Client"}</p>
        <p className="text-muted-foreground">{values.client?.email}</p>
      </div>
    </div>
    <table className="w-full text-left text-xs">
      <thead>
        <tr className="border-b">
          <th className="pb-1">Item</th>
          <th className="pb-1 text-right">Qty</th>
          <th className="pb-1 text-right">Price</th>
          <th className="pb-1 text-right">Line</th>
        </tr>
      </thead>
      <tbody>
        {(values.lineItems ?? []).map((item, i) => (
          <tr key={i} className="border-b border-dashed">
            <td className="py-1">{item.description || "—"}</td>
            <td className="py-1 text-right">{item.quantity}</td>
            <td className="py-1 text-right">
              ${(item.unitPrice ?? 0).toFixed(2)}
            </td>
            <td className="py-1 text-right">
              ${((item.quantity ?? 0) * (item.unitPrice ?? 0)).toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="flex justify-end">
      <div className="w-48 space-y-1 text-right">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${(values.subtotal ?? 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Tax ({values.taxRate ?? 0}%)</span>
          <span>
            $
            {(((values.subtotal ?? 0) * (values.taxRate ?? 0)) / 100).toFixed(
              2,
            )}
          </span>
        </div>
        <div className="flex justify-between border-t pt-1 font-bold">
          <span>Total</span>
          <span>${(values.total ?? 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  </div>
);

export const InvoiceForm = () => (
  <DynamicForm<InvoiceValues>
    schema={invoiceSchema}
    behavior={{
      onSubmit: async (values) => {
        console.log("Invoice created:", values);
      },
      computed: {
        subtotal: (v) =>
          (v.lineItems ?? []).reduce(
            (sum, item) => sum + (item.quantity ?? 0) * (item.unitPrice ?? 0),
            0,
          ),
        total: (v) => {
          const sub = (v.lineItems ?? []).reduce(
            (sum, item) => sum + (item.quantity ?? 0) * (item.unitPrice ?? 0),
            0,
          );
          return Math.round(sub * (1 + (v.taxRate ?? 0) / 100) * 100) / 100;
        },
      },
      validate: (v) => {
        if (v.dueDate && v.issueDate && v.dueDate < v.issueDate) {
          return { dueDate: "Due date must be after issue date" };
        }
        return undefined;
      },
    }}
    layout={{
      columns: 2,
      mode: {
        type: "master-detail",
        splitRatio: [55, 45],
        renderPreview: (values) => <InvoicePreview values={values} />,
      },
    }}
    actions={{
      submitLabel: "Create Invoice",
      confirmSubmit: {
        enabled: true,
        title: "Create Invoice",
        message: "This will finalize the invoice. Continue?",
      },
    }}
  />
);

// ─── 5. Review & Approval Form ──────────────────────────────────────────────
// Review mode with lock/unlock, autosave, field dependencies, devtools.

type ApplicationValues = {
  applicantName: string;
  applicantEmail: string;
  department: string;
  role: string;
  startDate: string;
  salary: number;
  currency: string;
  salaryDisplay: string;
  justification: string;
  approved: boolean;
};

const applicationSchema: FormSchema<ApplicationValues> = {
  sections: [
    {
      id: "applicant",
      title: "Applicant Information",
      icon: "👤",
      fields: [
        {
          name: "applicantName",
          type: "text",
          label: "Full Name",
          required: true,
        },
        {
          name: "applicantEmail",
          type: "email",
          label: "Email",
          required: true,
        },
      ],
    },
    {
      id: "position",
      title: "Position Details",
      icon: "💼",
      fields: [
        {
          name: "department",
          type: "select",
          label: "Department",
          options: [
            { label: "Engineering", value: "engineering" },
            { label: "Design", value: "design" },
            { label: "Marketing", value: "marketing" },
            { label: "Sales", value: "sales" },
          ],
        },
        {
          name: "role",
          type: "select",
          label: "Role",
          options: [
            { label: "Junior", value: "junior" },
            { label: "Mid-Level", value: "mid" },
            { label: "Senior", value: "senior" },
            { label: "Lead", value: "lead" },
          ],
        },
        { name: "startDate", type: "date", label: "Proposed Start Date" },
      ],
    },
    {
      id: "compensation",
      title: "Compensation",
      icon: "💰",
      fields: [
        {
          name: "salary",
          type: "number",
          label: "Annual Salary",
          min: 0,
        },
        {
          name: "currency",
          type: "select",
          label: "Currency",
          options: [
            { label: "USD ($)", value: "USD" },
            { label: "EUR (€)", value: "EUR" },
            { label: "GBP (£)", value: "GBP" },
          ],
          defaultValue: "USD",
        },
        {
          name: "salaryDisplay",
          type: "text",
          label: "Formatted Salary",
          readOnly: true,
        },
      ],
    },
    {
      id: "review",
      title: "Review Decision",
      icon: "✅",
      fields: [
        {
          name: "justification",
          type: "textarea",
          label: "Justification / Notes",
          rows: 4,
          colSpan: 2,
          placeholder: "Provide reasoning for the hiring decision...",
        },
        {
          name: "approved",
          type: "switch",
          label: "Approve Application",
          defaultValue: false,
        },
      ],
    },
  ],
};

const currencySymbol: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const ApplicationSummary = ({ values }: { values: ApplicationValues }) => (
  <div className="space-y-3 text-sm">
    <h4 className="font-semibold">Application Summary</h4>
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
      <dt className="text-muted-foreground">Name</dt>
      <dd>{values.applicantName || "—"}</dd>
      <dt className="text-muted-foreground">Department</dt>
      <dd>{values.department || "—"}</dd>
      <dt className="text-muted-foreground">Role</dt>
      <dd>{values.role || "—"}</dd>
      <dt className="text-muted-foreground">Start Date</dt>
      <dd>{values.startDate || "—"}</dd>
      <dt className="text-muted-foreground">Salary</dt>
      <dd>{values.salaryDisplay || "—"}</dd>
      <dt className="text-muted-foreground">Status</dt>
      <dd className={values.approved ? "text-green-600" : "text-amber-600"}>
        {values.approved ? "Approved" : "Pending"}
      </dd>
    </dl>
    {values.justification && (
      <div>
        <p className="text-muted-foreground">Justification</p>
        <p className="mt-1 rounded bg-muted p-2 text-xs">
          {values.justification}
        </p>
      </div>
    )}
  </div>
);

export const ApplicationReviewForm = () => (
  <DynamicForm<ApplicationValues>
    schema={applicationSchema}
    behavior={{
      onSubmit: async (values) => {
        console.log("Application decision:", values);
      },
      computed: {
        salaryDisplay: (v) => {
          if (!v.salary) return "";
          const sym = currencySymbol[v.currency] ?? "$";
          return `${sym}${v.salary.toLocaleString()}/yr`;
        },
      },
      dependencies: {
        role: { watch: ["department"], effect: "clear" },
      },
      autosave: {
        enabled: true,
        debounceMs: 2000,
        onSave: async (values) => {
          console.log("Draft saved:", values);
        },
      },
      validate: (v) => {
        if (v.approved && !v.justification?.trim()) {
          return { justification: "Justification is required when approving" };
        }
        return undefined;
      },
    }}
    layout={{
      columns: 2,
      mode: {
        type: "review",
        renderSummary: (values) => <ApplicationSummary values={values} />,
      },
    }}
    actions={{
      submitLabel: "Submit Decision",
      showDirtyIndicator: true,
      confirmSubmit: {
        enabled: true,
        title: "Submit Decision",
        message: "This action cannot be undone. Proceed?",
      },
    }}
    devtools={{ enabled: true, showDiagnostics: true, logChanges: true }}
  />
);

// ─── 6. Advanced Features ──────────────────────────────────────────────────────
// Demonstrates Undo/Redo, LocalStorage persistence, Rich Text, Drag & Drop lists, and Groups.

type AdvancedValues = {
  projectTitle: string;
  description: string;
  tasks: Array<{ title: string; order: number }>;
  metadata: {
    author: string;
    tags: string;
  };
  settings: {
    isPublic: boolean;
    allowComments: boolean;
  };
};

const advancedSchema: FormSchema<AdvancedValues> = {
  fields: [
    {
      name: "projectTitle",
      type: "text",
      label: "Project Title",
      placeholder: "My Awesome Project",
      required: true,
    },
    {
      name: "description",
      type: "rich-text",
      label: "Project Description",
      minHeight: "150px",
      toolbar: ["bold", "italic", "heading", "list", "link"],
    },
    {
      name: "tasks",
      type: "list",
      label: "Prioritized Tasks (Drag to Reorder)",
      ordering: { activate: true, toField: "order" },
      columns: 1,
      fields: [
        { name: "title", type: "text", label: "Task Name" },
        // 'order' field is managed automatically but can be hidden or shown if needed
        { name: "order", type: "number", label: "Order", hidden: true },
      ],
      defaultValue: [
        { title: "Research", order: 0 },
        { title: "Design", order: 1 },
        { title: "Implementation", order: 2 },
      ],
    },
    {
      name: "metadata",
      type: "group",
      label: "Metadata (Card Group)",
      collapsible: true,
      ui: { variant: "card" },
      fields: [
        { name: "author", type: "text", label: "Author Name" },
        { name: "tags", type: "text", label: "Tags (comma separated)" },
      ],
    },
    {
      name: "settings",
      type: "group",
      label: "Settings (Fieldset Group)",
      ui: { variant: "fieldset" },
      fields: [
        { name: "isPublic", type: "switch", label: "Public Project" },
        { name: "allowComments", type: "checkbox", label: "Allow Comments" },
      ],
    },
  ],
};

export const AdvancedFeaturesForm = () => (
  <DynamicForm<AdvancedValues>
    schema={advancedSchema}
    // Enable LocalStorage Persistence
    state={{
      persistKey: "rail-react-advanced-example",
    }}
    // Enable Undo/Redo
    actions={{
      undoRedo: {
        enabled: true,
        showInActionBar: true,
      },
      submitLabel: "Save Project",
      resetLabel: "Reset All",
    }}
    behavior={{
      onSubmit: async (values) => {
        console.log("Advanced form submitted:", values);
      },
    }}
  />
);

type StoreModelName = "Product" | "Order";

type ContractQueryData = {
  modelFormContract: ModelFormContract | null;
};

type ContractQueryVariables = {
  appLabel: string;
  modelName: StoreModelName;
  mode: ModelFormMode;
  includeNested: boolean;
};

type InitialDataQueryData = {
  modelFormInitialData: ModelFormInitialData | null;
};

type InitialDataQueryVariables = {
  appLabel: string;
  modelName: StoreModelName;
  objectId: string;
  includeNested: boolean;
  runtimeOverrides?: ModelFormRuntimeOverride[];
};

type SubmissionState = {
  status: "idle" | "saving" | "success" | "error";
  message: string | null;
  conflict: boolean;
  errors: Array<{ field?: string | null; message: string }>;
};

type GeneratedMutationResponse = {
  ok?: boolean;
  errors?: unknown;
  conflict?: boolean;
};

const INITIAL_SUBMISSION_STATE: SubmissionState = {
  status: "idle",
  message: null,
  conflict: false,
  errors: [],
};

const PRODUCT_CREATE_RUNTIME_OVERRIDES: ModelFormRuntimeOverride[] = [
  {
    path: "metadata",
    action: "MERGE",
    value: {
      created_from: "StoreProductCreateModelFormExample",
    },
  },
];

const PRODUCT_UPDATE_RUNTIME_OVERRIDES: ModelFormRuntimeOverride[] = [
  {
    path: "metadata",
    action: "MERGE",
    value: {
      updated_from: "StoreProductUpdateModelFormExample",
    },
  },
];

const ORDER_RUNTIME_OVERRIDES: ModelFormRuntimeOverride[] = [
  { path: "payment_token", action: "UNSET" },
  {
    path: "metadata",
    action: "MERGE",
    value: { updated_from: "rail-react/src/lib/form/examples.tsx" },
  },
];

function getMutationResponse(
  data: Record<string, unknown> | null | undefined,
): GeneratedMutationResponse {
  if (!data || typeof data !== "object") {
    return {};
  }
  const response = (data as { response?: unknown }).response;
  if (!response || typeof response !== "object") {
    return {};
  }
  return response as GeneratedMutationResponse;
}

function toSubmissionErrors(errors: unknown): SubmissionState["errors"] {
  return normalizeGeneratedErrorsForForm(errors).map((item) => ({
    field: item.field,
    message: item.message,
  }));
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Request failed.";
}

function useStoreGeneratedForm(options: {
  modelName: StoreModelName;
  mode: ModelFormMode;
  objectId?: string;
  includeNested?: boolean;
  runtimeOverrides?: ModelFormRuntimeOverride[];
}) {
  const {
    modelName,
    mode,
    objectId,
    includeNested = false,
    runtimeOverrides = [],
  } = options;

  const contractQuery = useQuery<ContractQueryData, ContractQueryVariables>(
    MODEL_FORM_CONTRACT_QUERY,
    {
      variables: {
        appLabel: "store",
        modelName,
        mode,
        includeNested,
      },
      fetchPolicy: "cache-and-network",
    },
  );

  const shouldFetchInitialData = mode === "UPDATE" && Boolean(objectId);
  const runtimeOverridesForQuery = React.useMemo(
    () => serializeRuntimeOverridesForQuery(runtimeOverrides),
    [runtimeOverrides],
  );

  const initialDataQuery = useQuery<
    InitialDataQueryData,
    InitialDataQueryVariables
  >(MODEL_FORM_INITIAL_DATA_QUERY, {
    variables: {
      appLabel: "store",
      modelName,
      objectId: objectId ?? "",
      includeNested,
      runtimeOverrides: runtimeOverridesForQuery,
    },
    skip: !shouldFetchInitialData,
    fetchPolicy: "network-only",
  });

  const contract = contractQuery.data?.modelFormContract ?? null;
  const initialData = shouldFetchInitialData
    ? (initialDataQuery.data?.modelFormInitialData ?? null)
    : null;

  const generatedForm = useGeneratedModelForm({
    contract,
    initialData,
    runtimeOverrides,
    generatedEnabled: true,
  });

  const { formValidator } = useGeneratedValidators(contract);

  return {
    contract,
    schema: generatedForm.schema,
    buildSubmissionValues: generatedForm.buildSubmissionValues,
    relations: contract?.relations ?? [],
    formValidator,
    loading: contractQuery.loading || initialDataQuery.loading,
    error: contractQuery.error ?? initialDataQuery.error,
  };
}

export function StoreProductCreateGeneratedFormExample() {
  const client = useApolloClient();
  const metrics = useGeneratedFormMetrics();

  const [submission, setSubmission] = React.useState<SubmissionState>(
    INITIAL_SUBMISSION_STATE,
  );

  const generated = useStoreGeneratedForm({
    modelName: "Product",
    mode: "CREATE",
    runtimeOverrides: [
      {
        path: "metadata",
        action: "MERGE",
        value: { created_from: "generated-form-example" },
      },
    ],
  });

  console.log(generated);

  const onSubmit = React.useCallback(
    async (values: Record<string, unknown>) => {
      if (!generated.contract) return;

      setSubmission({
        status: "saving",
        message: "Submitting product create mutation...",
        conflict: false,
        errors: [],
      });

      const operationName = resolveGeneratedMutationOperation(
        generated.contract.mutationBindings,
        "create",
        "Product",
      );

      const mutation = gql(
        buildGeneratedMutationDocument(
          "create",
          operationName,
          "Product",
          "id sku name",
        ),
      );

      try {
        const result = await client.mutate<{
          response?: GeneratedMutationResponse;
        }>({
          mutation,
          variables: {
            input: generated.buildSubmissionValues(values),
          },
        });

        const response = getMutationResponse(
          result.data as Record<string, unknown> | null | undefined,
        );
        const errors = toSubmissionErrors(response.errors);
        const ok = Boolean(response.ok) && errors.length === 0;

        metrics.recordAttempt({
          ok,
          hadValidationErrors: errors.length > 0,
        });

        setSubmission(
          ok
            ? {
                status: "success",
                message: "Product created successfully.",
                conflict: false,
                errors: [],
              }
            : {
                status: "error",
                message: "Product create failed.",
                conflict: Boolean(response.conflict),
                errors,
              },
        );
      } catch (error) {
        metrics.recordAttempt({
          ok: false,
          hadValidationErrors: false,
        });
        setSubmission({
          status: "error",
          message: toErrorMessage(error),
          conflict: false,
          errors: [],
        });
      }
    },
    [client, generated, metrics],
  );

  if (generated.loading) {
    return <p>Loading generated Product form contract...</p>;
  }

  if (generated.error) {
    return <p>Failed to load Product contract: {generated.error.message}</p>;
  }

  const snapshot = metrics.getSnapshot();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        Store Product Create (Generated Form)
      </h2>
      <DynamicForm
        schema={generated.schema}
        behavior={{
          validate: generated.formValidator,
          onSubmit,
        }}
        actions={{
          submitLabel: "Create Product",
          resetLabel: "Reset",
          showDirtyIndicator: true,
        }}
      />
      {submission.status !== "idle" ? (
        <div className="rounded border border-border p-3 text-sm">
          <p>{submission.message}</p>
          {submission.conflict ? (
            <p className="mt-1 text-destructive">
              Update conflict detected. Reload contract and try again.
            </p>
          ) : null}
          {submission.errors.length > 0 ? (
            <ul className="mt-2 list-disc pl-5">
              {submission.errors.map((item, index) => (
                <li key={`${item.field ?? "__all__"}-${index}`}>
                  {item.field ? `${item.field}: ` : ""}
                  {item.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Submission attempts: {snapshot.totalSubmissions}, correction success
        rate: {Math.round(snapshot.correctionRate * 100)}%
      </p>
    </section>
  );
}

export function StoreProductCreateModelFormExample() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        Store Product Create (ModelForm)
      </h2>
      <ModelForm
        app="store"
        model="Product"
        mode="CREATE"
        runtimeOverrides={PRODUCT_CREATE_RUNTIME_OVERRIDES}
        description="Auto-wired create example: Save runs generated createOperation with no manual mutation wiring."
        formProps={{
          layout: { columns: 2, showSectionHeaders: true },
          actions: {
            submitLabel: "Create Product",
            resetLabel: "Reset",
            showDirtyIndicator: true,
          },
        }}
      />
    </section>
  );
}

type StoreProductUpdateModelFormExampleProps = {
  objectId: string;
};

export function StoreProductUpdateModelFormExample({
  objectId,
}: StoreProductUpdateModelFormExampleProps) {
  if (!objectId) {
    return <p>Pass a valid `objectId` to load the Product update ModelForm.</p>;
  }
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        Store Product Update (ModelForm)
      </h2>
      <ModelForm
        app="store"
        model="Product"
        mode="UPDATE"
        objectId={objectId}
        // excludeFields={["order_items"]}
        // nested={{
        //   order_items: {
        //     sortable: { enabled: true, mode: "buttons" },
        //   },
        // }}
        runtimeOverrides={PRODUCT_UPDATE_RUNTIME_OVERRIDES}
        description="Auto-wired update example: initial values load from modelFormInitialData and Save runs generated updateOperation."
        formProps={{
          layout: {
            columns: 4,

            showSectionHeaders: true,
          },
          actions: {
            submitLabel: "Update Product",
            resetLabel: "Reset",
            showDirtyIndicator: true,
          },
        }}
      />
    </section>
  );
}

type StoreOrderViewModelFormExampleProps = {
  objectId: string;
};

export function StoreOrderViewModelFormExample({
  objectId,
}: StoreOrderViewModelFormExampleProps) {
  if (!objectId) {
    return <p>Pass a valid `objectId` to load the Order view ModelForm.</p>;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Store Order View (ModelForm)</h2>
      <ModelForm
        app="store"
        model="Order"
        mode="VIEW"
        objectId={objectId}
        description="Read-only order details with contract-driven field visibility."
      />
    </section>
  );
}

export function StoreOrderCreateModelFormExample() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Store Order Create (ModelForm)</h2>
      <ModelForm
        app="store"
        model="Order"
        mode="CREATE"
        nested={["customer", "items"]}
        excludeFields={["payment_token", "raw_payload"]}
        description="Create order form with nested customer/items enabled."
        behavior={{
          onSubmit: async (values) => {
            console.log("Order create values:", values);
          },
        }}
      />
    </section>
  );
}

export function StoreOrderItemCreateModelFormExample() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        Store OrderItem Create (ModelForm)
      </h2>
      <ModelForm
        app="store"
        model="OrderItem"
        mode="CREATE"
        description="Contract-driven create form for order line items."
        formProps={{
          layout: { columns: 2, showSectionHeaders: true },
          actions: { submitLabel: "Create Order Item", resetLabel: "Reset" },
        }}
        behavior={{
          onSubmit: async (values) => {
            console.log("OrderItem create values:", values);
          },
        }}
      />
    </section>
  );
}

type StoreOrderUpdateGeneratedFormExampleProps = {
  objectId: string;
};

export function StoreOrderUpdateGeneratedFormExample({
  objectId,
}: StoreOrderUpdateGeneratedFormExampleProps) {
  const client = useApolloClient();
  const metrics = useGeneratedFormMetrics();
  const [submission, setSubmission] = React.useState<SubmissionState>(
    INITIAL_SUBMISSION_STATE,
  );

  const generated = useStoreGeneratedForm({
    modelName: "Order",
    mode: "UPDATE",
    objectId,
    includeNested: true,
    runtimeOverrides: ORDER_RUNTIME_OVERRIDES,
  });

  const onSubmit = React.useCallback(
    async (values: Record<string, unknown>) => {
      if (!generated.contract) return;

      setSubmission({
        status: "saving",
        message: "Submitting order update mutation...",
        conflict: false,
        errors: [],
      });

      const operationName = resolveGeneratedMutationOperation(
        generated.contract.mutationBindings,
        "update",
        "Order",
      );

      const mutation = gql(
        buildGeneratedMutationDocument(
          "update",
          operationName,
          "Order",
          "id orderNumber status updatedAt",
        ),
      );

      const submissionValues = generated.buildSubmissionValues(values);
      const nestedPayload = buildNestedMutationPayload(
        submissionValues,
        generated.relations,
      );

      try {
        const result = await client.mutate<{
          response?: GeneratedMutationResponse;
        }>({
          mutation,
          variables: {
            id: objectId,
            input: nestedPayload,
          },
        });

        const response = getMutationResponse(
          result.data as Record<string, unknown> | null | undefined,
        );
        const errors = toSubmissionErrors(response.errors);
        const ok = Boolean(response.ok) && errors.length === 0;

        metrics.recordAttempt({
          ok,
          hadValidationErrors: errors.length > 0,
        });

        setSubmission(
          ok
            ? {
                status: "success",
                message: "Order updated successfully.",
                conflict: false,
                errors: [],
              }
            : {
                status: "error",
                message: "Order update failed.",
                conflict: Boolean(response.conflict),
                errors,
              },
        );
      } catch (error) {
        metrics.recordAttempt({
          ok: false,
          hadValidationErrors: false,
        });
        setSubmission({
          status: "error",
          message: toErrorMessage(error),
          conflict: false,
          errors: [],
        });
      }
    },
    [client, generated, metrics, objectId],
  );

  if (!objectId) {
    return (
      <p>Pass a valid `objectId` to load the generated Order update form.</p>
    );
  }

  if (generated.loading) {
    return <p>Loading generated Order form contract...</p>;
  }

  if (generated.error) {
    return <p>Failed to load Order contract: {generated.error.message}</p>;
  }

  const snapshot = metrics.getSnapshot();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        Store Order Update (Generated Form)
      </h2>
      <DynamicForm
        schema={generated.schema}
        behavior={{
          validate: generated.formValidator,
          onSubmit,
        }}
        actions={{
          submitLabel: "Update Order",
          resetLabel: "Reset",
          showDirtyIndicator: true,
        }}
      />
      {submission.status !== "idle" ? (
        <div className="rounded border border-border p-3 text-sm">
          <p>{submission.message}</p>
          {submission.conflict ? (
            <p className="mt-1 text-destructive">
              Conflict response received. Refresh initial data and retry.
            </p>
          ) : null}
          {submission.errors.length > 0 ? (
            <ul className="mt-2 list-disc pl-5">
              {submission.errors.map((item, index) => (
                <li key={`${item.field ?? "__all__"}-${index}`}>
                  {item.field ? `${item.field}: ` : ""}
                  {item.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Submission attempts: {snapshot.totalSubmissions}, correction success
        rate: {Math.round(snapshot.correctionRate * 100)}%
      </p>
    </section>
  );
}

export function StoreModelTableExamples() {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="mb-2 text-lg font-semibold">Store Product Table</h2>
        <ModelTableV2 app="store" model="Product" />
      </div>
      <div>
        <h2 className="mb-2 text-lg font-semibold">Store Order Table</h2>
        <ModelTableV2 app="store" model="Order" />
      </div>
    </section>
  );
}

type StoreGeneratedExamplesProps = {
  orderId: string;
};

export function StoreGeneratedExamples({
  orderId,
}: StoreGeneratedExamplesProps) {
  return (
    <div className="space-y-10">
      {/* 5 ready-to-use ModelForm usages: Product x2, Order x2, OrderItem x1 */}
      <StoreProductCreateModelFormExample />
      <StoreProductUpdateModelFormExample objectId={orderId} />
      <StoreOrderCreateModelFormExample />
      <StoreOrderViewModelFormExample objectId={orderId} />
      <StoreOrderItemCreateModelFormExample />
      <StoreProductCreateGeneratedFormExample />
      <StoreOrderUpdateGeneratedFormExample objectId={orderId} />
      <StoreModelTableExamples />
    </div>
  );
}
