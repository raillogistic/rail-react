/**
 * @module examples
 * @description Curated dynamic form examples for advanced layout and behavior patterns.
 */

import { DynamicForm, type FormSchema } from "@/widgets/model-form";
import { Button } from "@/shared/ui/kit/button";

// ─── 1. Simple Contact Form ─────────────────────────────────────────────────
// Flat fields, basic submit, custom action buttons, dirty indicator.

const contactSchema: FormSchema = {
 fields: [
 { name: "firstName", type: "text", label: "Prénom", required: true },
 { name: "lastName", type: "text", label: "Nom", required: true },
 {
 name: "email",
 type: "email",
 label: "E-mail",
 placeholder: "vous@exemple.com",
 },
 {
 name: "phone",
 type: "text",
 label: "Téléphone",
 placeholder: "+33 (0) 0 00 00 00 00",
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
 console.log("Contact soumis :", values);
 },
 }}
 layout={{ columns: 2, variant: "default" }}
 actions={{
 submitLabel: "Envoyer le message",
 resetLabel: "Effacer",
 showDirtyIndicator: true,
 extra: (
 <Button type="button" variant="outline">
 Annuler
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
 description: "Configurez la manière dont vous recevez les alertes.",
 fields: [
 {
 name: "enableNotifications",
 type: "switch",
 label: "Activer les notifications",
 defaultValue: false,
 },
 {
 name: "notifyEmail",
 type: "email",
 label: "E-mail de notification",
 placeholder: "alertes@entreprise.com",
 },
 {
 name: "notifyFrequency",
 type: "select",
 label: "Fréquence",
 options: [
 { label: "Instantané", value: "instant" },
 { label: "Résumé horaire", value: "hourly" },
 { label: "Résumé quotidien", value: "daily" },
 ],
 },
 ],
 },
 {
 id: "api",
 title: "Accès API",
 description: "Gérez vos identifiants API et vos limites.",
 fields: [
 {
 name: "enableApi",
 type: "switch",
 label: "Activer l'accès API",
 defaultValue: false,
 },
 {
 name: "apiKey",
 type: "text",
 label: "Clé API",
 readOnly: true,
 defaultValue: "sk_live_xxxxxxxxxxxxxxxx",
 },
 {
 name: "rateLimit",
 type: "slider",
 label: "Limite de débit (req/min)",
 min: 10,
 max: 1000,
 step: 10,
 defaultValue: 100,
 },
 {
 name: "estimatedCost",
 type: "number",
 label: "Coût mensuel estimé ($)",
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
 console.log("Paramètres enregistrés :", values);
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
 actions={{ submitLabel: "Enregistrer les paramètres" }}
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
 title: "Votre identité",
 step: {
 label: "Identité",
 canAdvance: (v) => !!v.fullName && !!v.email,
 },
 fields: [
 {
 name: "fullName",
 type: "text",
 label: "Nom complet",
 required: true,
 },
 {
 name: "email",
 type: "email",
 label: "Adresse e-mail",
 required: true,
 },
 {
 name: "accountType",
 type: "radio",
 label: "Type de compte",
 options: [
 { label: "Personnel", value: "personal" },
 { label: "Professionnel", value: "business" },
 ],
 defaultValue: "personal",
 },
 ],
 },
 {
 id: "company",
 title: "Détails de l'entreprise",
 step: { label: "Entreprise", optional: true },
 visible: (v) => v.accountType === "business",
 fields: [
 {
 name: "companyName",
 type: "text",
 label: "Nom de l'entreprise",
 required: true,
 },
 {
 name: "companySize",
 type: "select",
 label: "Taille de l'entreprise",
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
 title: "Profil",
 step: { label: "Profil" },
 fields: [
 {
 name: "bio",
 type: "textarea",
 label: "Courte biographie",
 placeholder: "Parlez-nous de vous...",
 rows: 3,
 colSpan: 2,
 },
 ],
 },
 {
 id: "confirm",
 title: "Confirmer et Accepter",
 step: {
 label: "Confirmer",
 canAdvance: (v) => v.agreeTerms === true,
 },
 fields: [
 {
 name: "agreeTerms",
 type: "checkbox",
 label:
 "J'accepte les conditions d'utilisation et la politique de confidentialité",
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
 console.log("Onboarding terminé :", values);
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
 title: "Détails de la facture",
 columns: 3,
 fields: [
 {
 name: "invoiceNumber",
 type: "text",
 label: "Facture n°",
 defaultValue: "FAC-001",
 },
 { name: "issueDate", type: "date", label: "Date d'émission" },
 { name: "dueDate", type: "date", label: "Date d'échéance" },
 ],
 },
 {
 id: "client",
 title: "Client",
 fields: [
 {
 name: "client",
 type: "object",
 label: "Informations client",
 columns: 2,
 fields: [
 { name: "name", type: "text", label: "Nom du client" },
 { name: "email", type: "email", label: "E-mail du client" },
 {
 name: "address",
 type: "textarea",
 label: "Adresse",
 rows: 2,
 colSpan: 2,
 },
 ],
 },
 ],
 },
 {
 id: "items",
 title: "Lignes de facture",
 fields: [
 {
 name: "lineItems",
 type: "list",
 label: "Articles",
 addLabel: "Ajouter un article",
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
 label: "Qté",
 min: 1,
 defaultValue: 1,
 },
 {
 name: "unitPrice",
 type: "decimal",
 label: "Prix unitaire",
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
 title: "Totaux",
 columns: 3,
 fields: [
 {
 name: "subtotal",
 type: "decimal",
 label: "Sous-total",
 readOnly: true,
 },
 {
 name: "taxRate",
 type: "number",
 label: "TVA %",
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
 label: "Notes / Conditions de paiement",
 rows: 3,
 colSpan: 2,
 placeholder: "Paiement dû sous 30 jours...",
 },
 ],
 },
 ],
};

const InvoicePreview = ({ values }: { values: InvoiceValues }) => (
 <div className="space-y-4 text-sm">
 <div className="flex justify-between">
 <div>
 <p className="text-lg font-bold">{values.invoiceNumber || "FAC-..."}</p>
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
 <th className="pb-1">Article</th>
 <th className="pb-1 text-right">Qté</th>
 <th className="pb-1 text-right">Prix</th>
 <th className="pb-1 text-right">Ligne</th>
 </tr>
 </thead>
 <tbody>
 {(values.lineItems ?? []).map((item, i) => (
 <tr key={i} className="border-b border-dashed">
 <td className="py-1">{item.description || "—"}</td>
 <td className="py-1 text-right">{item.quantity}</td>
 <td className="py-1 text-right">
 {(item.unitPrice ?? 0).toFixed(2)} €
 </td>
 <td className="py-1 text-right">
 {((item.quantity ?? 0) * (item.unitPrice ?? 0)).toFixed(2)} €
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 <div className="flex justify-end">
 <div className="w-48 space-y-1 text-right">
 <div className="flex justify-between">
 <span>Sous-total</span>
 <span>{(values.subtotal ?? 0).toFixed(2)} €</span>
 </div>
 <div className="flex justify-between text-muted-foreground">
 <span>TVA ({values.taxRate ?? 0}%)</span>
 <span>
 {(((values.subtotal ?? 0) * (values.taxRate ?? 0)) / 100).toFixed(
 2,
 )}{" "}
 €
 </span>
 </div>
 <div className="flex justify-between border-t pt-1 font-bold">
 <span>Total</span>
 <span>{(values.total ?? 0).toFixed(2)} €</span>
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
 console.log("Facture créée :", values);
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
 return {
 dueDate:
 "La date d'échéance doit être postérieure à la date d'émission",
 };
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
 submitLabel: "Créer la facture",
 confirmSubmit: {
 enabled: true,
 title: "Créer la facture",
 message: "Cela finalisera la facture. Continuer ?",
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
 title: "Informations sur le candidat",
 icon: "👤",
 fields: [
 {
 name: "applicantName",
 type: "text",
 label: "Nom complet",
 required: true,
 },
 {
 name: "applicantEmail",
 type: "email",
 label: "E-mail",
 required: true,
 },
 ],
 },
 {
 id: "position",
 title: "Détails du poste",
 icon: "💼",
 fields: [
 {
 name: "department",
 type: "select",
 label: "Département",
 options: [
 { label: "Ingénierie", value: "engineering" },
 { label: "Design", value: "design" },
 { label: "Marketing", value: "marketing" },
 { label: "Ventes", value: "sales" },
 ],
 },
 {
 name: "role",
 type: "select",
 label: "Rôle",
 options: [
 { label: "Junior", value: "junior" },
 { label: "Intermédiaire", value: "mid" },
 { label: "Senior", value: "senior" },
 { label: "Responsable", value: "lead" },
 ],
 },
 { name: "startDate", type: "date", label: "Date de début proposée" },
 ],
 },
 {
 id: "compensation",
 title: "Rémunération",
 icon: "💰",
 fields: [
 {
 name: "salary",
 type: "number",
 label: "Salaire annuel",
 min: 0,
 },
 {
 name: "currency",
 type: "select",
 label: "Devise",
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
 label: "Salaire formaté",
 readOnly: true,
 },
 ],
 },
 {
 id: "review",
 title: "Décision de révision",
 icon: "✅",
 fields: [
 {
 name: "justification",
 type: "textarea",
 label: "Justification / Notes",
 rows: 4,
 colSpan: 2,
 placeholder: "Fournir les raisons de la décision d'embauche...",
 },
 {
 name: "approved",
 type: "switch",
 label: "Approuver la candidature",
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
 <h4 className="font-semibold">Résumé de la candidature</h4>
 <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
 <dt className="text-muted-foreground">Nom</dt>
 <dd>{values.applicantName || "—"}</dd>
 <dt className="text-muted-foreground">Département</dt>
 <dd>{values.department || "—"}</dd>
 <dt className="text-muted-foreground">Rôle</dt>
 <dd>{values.role || "—"}</dd>
 <dt className="text-muted-foreground">Date de début</dt>
 <dd>{values.startDate || "—"}</dd>
 <dt className="text-muted-foreground">Salaire</dt>
 <dd>{values.salaryDisplay || "—"}</dd>
 <dt className="text-muted-foreground">Statut</dt>
 <dd className={values.approved ? "text-green-600" : "text-amber-600"}>
 {values.approved ? "Approuvé" : "En attente"}
 </dd>
 </dl>
 {values.justification && (
 <div>
 <p className="text-muted-foreground">Justification</p>
 <p className="mt-1 bg-muted p-2 text-xs">
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
 console.log("Décision de candidature :", values);
 },
 computed: {
 salaryDisplay: (v) => {
 if (!v.salary) return "";
 const sym = currencySymbol[v.currency] ?? "$";
 return`${v.salary.toLocaleString()} ${sym}/an`;
 },
 },
 dependencies: {
 role: { watch: ["department"], effect: "clear" },
 },
 autosave: {
 enabled: true,
 debounceMs: 2000,
 onSave: async (values) => {
 console.log("Brouillon enregistré :", values);
 },
 },
 validate: (v) => {
 if (v.approved && !v.justification?.trim()) {
 return {
 justification: "La justification est requise lors de l'approbation",
 };
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
 submitLabel: "Soumettre la décision",
 showDirtyIndicator: true,
 confirmSubmit: {
 enabled: true,
 title: "Soumettre la décision",
 message: "Cette action ne peut pas être annulée. Continuer ?",
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
 label: "Titre du projet",
 placeholder: "Mon Super Projet",
 required: true,
 },
 {
 name: "description",
 type: "rich-text",
 label: "Description du projet",
 minHeight: "150px",
 toolbar: ["bold", "italic", "heading", "list", "link"],
 },
 {
 name: "tasks",
 type: "list",
 label: "Tâches prioritaires (Glisser pour réordonner)",
 ordering: { activate: true, toField: "order" },
 columns: 1,
 fields: [
 { name: "title", type: "text", label: "Nom de la tâche" },
 // 'order' field is managed automatically but can be hidden or shown if needed
 { name: "order", type: "number", label: "Ordre", hidden: true },
 ],
 defaultValue: [
 { title: "Recherche", order: 0 },
 { title: "Conception", order: 1 },
 { title: "Mise en œuvre", order: 2 },
 ],
 },
 {
 name: "metadata",
 type: "group",
 label: "Métadonnées (Groupe Carte)",
 collapsible: true,
 ui: { variant: "card" },
 fields: [
 { name: "author", type: "text", label: "Nom de l'auteur" },
 {
 name: "tags",
 type: "text",
 label: "Tags (séparés par des virgules)",
 },
 ],
 },
 {
 name: "settings",
 type: "group",
 label: "Paramètres (Groupe Fieldset)",
 ui: { variant: "fieldset" },
 fields: [
 { name: "isPublic", type: "switch", label: "Projet public" },
 {
 name: "allowComments",
 type: "checkbox",
 label: "Autoriser les commentaires",
 },
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
 submitLabel: "Enregistrer le projet",
 resetLabel: "Tout réinitialiser",
 }}
 behavior={{
 onSubmit: async (values) => {
 console.log("Formulaire avancé soumis :", values);
 },
 }}
 />
);

export {
 StoreGeneratedExamples,
 StoreModelTableExamples,
 StoreOrderCreateModelFormExample,
 StoreOrderItemCreateModelFormExample,
 StoreOrderUpdateGeneratedFormExample,
 StoreOrderUpdateModelFormExample,
 StoreOrderViewModelFormExample,
 StoreProductCreateGeneratedFormExample,
 StoreProductCreateModelFormExample,
 StoreProductUpdateModelFormExample,
} from "./examples/generatedExamples";

