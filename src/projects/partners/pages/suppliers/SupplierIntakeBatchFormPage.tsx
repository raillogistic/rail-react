/** Reusable Partners implementation using the host Rail runtime. */
import { gql, useMutation, useQuery } from "@apollo/client";
import {
  type ReactNode,
  startTransition,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Info, Pencil, Plus, Trash2, Download, UploadCloud } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/shared/ui/kit/dialog";
import DynamicForm from "@/widgets/model-form/inputs/form";
import type { FormSchema } from "@/widgets/model-form/types/schema";
import {
  useModelCreateMutation,
  useModelDeleteMutation,
  useModelUpdateMutation,
} from "@/shared/api/graphql/graphql/mutations/hooks";
import { Button } from "@/shared/ui/kit/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/kit/card";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/kit/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/kit/tabs";
import { Textarea } from "@/shared/ui/kit/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/kit/alert";
import { toast } from "@/shared/ui/kit/sonner";
import {
  extractMutationPayload,
  getFirstMutationErrorMessage,
} from "../../utils/mutationUtils";
import { ROUTES } from "../../config/routes";
import { usePartnerRoutes } from "../../routeSelection";

const INTAKE_BATCH_SELECTION = `
  id
  name
  status
  notes
  createdAt
  updatedAt
  submittedAt
  approvedAt
  rejectedAt
  canEdit
  canSubmit
  canApprove
  canReject
  entries {
    id
    sortOrder
    name
    email
    phone
    address
    nif
    art
    nis
    rc
    website
    notes
    supplier { id name }
  }
`;

const BATCH_DETAIL_QUERY = gql`
  query IntakeBatchFormDetail($id: ID!) {
    supplierIntakeBatch(id: $id) {
      ${INTAKE_BATCH_SELECTION}
    }
  }
`;

const SUBMIT_MUTATION = gql`
  mutation SubmitIntakeBatchForm($id: ID!) {
    submitIntakeBatch(id: $id) {
      ok
      message
    }
  }
`;

const APPROVE_MUTATION = gql`
  mutation ApproveIntakeBatchForm($id: ID!) {
    approveIntakeBatch(id: $id) {
      ok
      message
      createdSupplierIds
    }
  }
`;

const REJECT_MUTATION = gql`
  mutation RejectIntakeBatchForm($id: ID!) {
    rejectIntakeBatch(id: $id) {
      ok
      message
    }
  }
`;

type IntakeBatchRecord = {
  id: string;
  name: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  canEdit?: boolean;
  canSubmit?: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  entries: IntakeEntryRecord[];
};

type IntakeEntryRecord = {
  id: string;
  sortOrder: number;
  name: string;
  email: string | null;
  phone: string;
  address: string;
  nif: string;
  art: string;
  nis: string;
  rc: string;
  website: string | null;
  notes: string;
  supplier: { id: string; name: string } | null;
};

type EntryDraft = {
  sortOrder: number;
  name: string;
  email?: string;
  phone: string;
  address: string;
  nif: string;
  art: string;
  nis: string;
  rc: string;
  website?: string;
  notes: string;
};

function createEmptyEntryDraft(nextSortOrder: number): EntryDraft {
  return {
    sortOrder: nextSortOrder,
    name: "",
    email: undefined,
    phone: "",
    address: "",
    nif: "",
    art: "",
    nis: "",
    rc: "",
    website: undefined,
    notes: "",
  };
}

function mapEntryRecordToDraft(entry: IntakeEntryRecord): EntryDraft {
  return {
    sortOrder: entry.sortOrder,
    name: entry.name,
    email: entry.email || undefined,
    phone: entry.phone ?? "",
    address: entry.address ?? "",
    nif: entry.nif ?? "",
    art: entry.art ?? "",
    nis: entry.nis ?? "",
    rc: entry.rc ?? "",
    website: entry.website || undefined,
    notes: entry.notes ?? "",
  };
}

function optionalTrimmed(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function statusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "submitted":
      return "Soumise";
    case "approved":
      return "Approuvee";
    case "rejected":
      return "Rejetee";
    default:
      return status || "-";
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function SupplierIntakeBatchFormPage() {
  const { isRouteEnabled } = usePartnerRoutes();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const detailQuery = useQuery<{
    supplierIntakeBatch: IntakeBatchRecord | null;
  }>(BATCH_DETAIL_QUERY, {
    variables: { id },
    skip: !isEdit,
  });

  const batch = detailQuery.data?.supplierIntakeBatch ?? null;
  const entries = useMemo(() => batch?.entries ?? [], [batch?.entries]);
  const isDraft = batch?.status === "draft";
  const isSubmitted = batch?.status === "submitted";
  const isApproved = batch?.status === "approved";
  const canEditBatch = !isEdit || Boolean(batch?.canEdit);

  const [formState, setFormState] = useState<Record<string, unknown>>({
    name: "",
    notes: "",
  });

  useEffect(() => {
    if (!batch) {
      return;
    }

    setFormState({
      name: batch.name || "",
      notes: batch.notes || "",
    });
  }, [batch]);

  const nextSortOrder = useMemo(() => {
    return (
      entries.reduce(
        (maxValue, entry) => Math.max(maxValue, entry.sortOrder || 0),
        0,
      ) + 1
    );
  }, [entries]);

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [draftEntry, setDraftEntry] = useState<EntryDraft>(
    createEmptyEntryDraft(1),
  );

  useEffect(() => {
    if (!editingEntryId) {
      setDraftEntry(createEmptyEntryDraft(nextSortOrder));
    }
  }, [editingEntryId, nextSortOrder]);

  const createBatch = useModelCreateMutation({
    app: "suppliers",
    model: "SupplierIntakeBatch",
    selection: INTAKE_BATCH_SELECTION,
  });
  const updateBatch = useModelUpdateMutation({
    app: "suppliers",
    model: "SupplierIntakeBatch",
    selection: INTAKE_BATCH_SELECTION,
  });
  const createEntry = useModelCreateMutation({
    app: "suppliers",
    model: "SupplierIntakeEntry",
  });
  const updateEntry = useModelUpdateMutation({
    app: "suppliers",
    model: "SupplierIntakeEntry",
  });
  const deleteEntry = useModelDeleteMutation({
    app: "suppliers",
    model: "SupplierIntakeEntry",
  });

  const [submitMutation, submitState] = useMutation(SUBMIT_MUTATION);
  const [approveMutation, approveState] = useMutation(APPROVE_MUTATION);
  const [rejectMutation, rejectState] = useMutation(REJECT_MUTATION);

  const headerSchema = useMemo<FormSchema>(
    () => ({
      sections: [
        {
          title: "Informations de la liste",
          description:
            "Renseignez le nom du lot et les notes internes pour la campagne d'insertion.",
          ui: { card: true },
          fields: [
            {
              name: "name",
              type: "text",
              label: "Nom de la liste",
              placeholder: "Ex. Liste Q3 2026",
              disabled: !canEditBatch,
              colSpan: 1,
            },
            {
              name: "notes",
              type: "textarea",
              label: "Notes",
              placeholder: "Notes internes...",
              disabled: !canEditBatch,
              colSpan: 2,
            },
          ],
        },
      ],
    }),
    [canEditBatch],
  );

  const createdSupplierCount = useMemo(() => {
    return entries.filter((entry) => Boolean(entry.supplier?.id)).length;
  }, [entries]);

  const headerSummary = useMemo(() => {
    return {
      status: statusLabel(batch?.status || "draft"),
      entriesCount: String(entries.length),
      createdSupplierCount: String(createdSupplierCount),
      createdAt: formatDate(batch?.createdAt),
      submittedAt: formatDate(batch?.submittedAt),
      approvedAt: formatDate(batch?.approvedAt),
    };
  }, [batch, createdSupplierCount, entries.length]);

  const handleHeaderSubmit = async (values: Record<string, unknown>) => {
    const input = {
      name: String(values.name || "").trim(),
      notes: String(values.notes || "").trim(),
    };

    if (isEdit && id) {
      const response = await updateBatch.execute({ id, input });
      const payload = extractMutationPayload(
        response.data as Record<string, unknown> | undefined,
        updateBatch.mutationName,
      );
      if (!payload?.ok) {
        toast.error(
          getFirstMutationErrorMessage(payload, "Echec de la mise a jour."),
        );
        return;
      }

      toast.success("En-tete de la liste mis a jour.");
      await detailQuery.refetch();
      return;
    }

    const response = await createBatch.execute({ input });
    const payload = extractMutationPayload(
      response.data as Record<string, unknown> | undefined,
      createBatch.mutationName,
    );
    if (!payload?.ok) {
      toast.error(
        getFirstMutationErrorMessage(payload, "Echec de la creation."),
      );
      return;
    }

    const createdId = String(payload.object?.id ?? "");
    toast.success("Liste d'insertion creee.");
    if (createdId && isRouteEnabled("achat:supplier-intake-batches:edit")) {
      startTransition(() => {
        navigate(
          ROUTES.ADMIN.SUPPLIER_INTAKE_BATCHES.EDIT.replace(":id", createdId),
        );
      });
    }
  };

  const resetEntryEditor = () => {
    setEditingEntryId(null);
    setDraftEntry(createEmptyEntryDraft(nextSortOrder));
  };

  const handleEditEntry = (entry: IntakeEntryRecord) => {
    setEditingEntryId(entry.id);
    setDraftEntry(mapEntryRecordToDraft(entry));
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm("Supprimer ce fournisseur de la liste ?")) {
      return;
    }

    const response = await deleteEntry.execute({ id: entryId });
    const payload = extractMutationPayload(
      response.data as Record<string, unknown> | undefined,
      deleteEntry.mutationName,
    );
    if (!payload?.ok) {
      toast.error(
        getFirstMutationErrorMessage(payload, "Echec de la suppression."),
      );
      return;
    }

    toast.success("Fournisseur supprime de la liste.");
    if (editingEntryId === entryId) {
      resetEntryEditor();
    }
    await detailQuery.refetch();
  };

  const handleSaveEntry = async () => {
    if (!id) {
      toast.error("Creez d'abord la liste.");
      return;
    }

    if (!draftEntry.name.trim()) {
      toast.error("Le nom du fournisseur est obligatoire.");
      return;
    }

    const input = {
      batch: { connect: id },
      sortOrder: draftEntry.sortOrder,
      name: draftEntry.name.trim(),
      email: optionalTrimmed(draftEntry.email),
      phone: draftEntry.phone.trim(),
      address: draftEntry.address.trim(),
      nif: draftEntry.nif.trim(),
      art: draftEntry.art.trim(),
      nis: draftEntry.nis.trim(),
      rc: draftEntry.rc.trim(),
      website: optionalTrimmed(draftEntry.website),
      notes: draftEntry.notes.trim(),
    };

    if (editingEntryId) {
      const response = await updateEntry.execute({
        id: editingEntryId,
        input,
      });
      const payload = extractMutationPayload(
        response.data as Record<string, unknown> | undefined,
        updateEntry.mutationName,
      );
      if (!payload?.ok) {
        toast.error(
          getFirstMutationErrorMessage(payload, "Echec de la mise a jour."),
        );
        return;
      }

      toast.success("Fournisseur mis a jour.");
    } else {
      const response = await createEntry.execute({ input });
      const payload = extractMutationPayload(
        response.data as Record<string, unknown> | undefined,
        createEntry.mutationName,
      );
      if (!payload?.ok) {
        toast.error(
          getFirstMutationErrorMessage(payload, "Echec de la creation."),
        );
        return;
      }

      toast.success("Fournisseur ajoute a la liste.");
    }

    await detailQuery.refetch();
    resetEntryEditor();
  };

  const handleSubmit = async () => {
    if (!id) {
      return;
    }

    const response = await submitMutation({ variables: { id } });
    const payload = response.data?.submitIntakeBatch;
    if (!payload?.ok) {
      toast.error(payload?.message || "Echec de la soumission.");
      return;
    }

    toast.success(payload?.message || "Liste soumise.");
    await detailQuery.refetch();
  };

  const handleApprove = async () => {
    if (!id) {
      return;
    }

    const response = await approveMutation({ variables: { id } });
    const payload = response.data?.approveIntakeBatch;
    if (!payload?.ok) {
      toast.error(payload?.message || "Echec de l'approbation.");
      return;
    }

    toast.success(payload?.message || "Liste approuvee.");
    await detailQuery.refetch();
  };

  const handleReject = async () => {
    if (!id) {
      return;
    }

    const response = await rejectMutation({ variables: { id } });
    const payload = response.data?.rejectIntakeBatch;
    if (!payload?.ok) {
      toast.error(payload?.message || "Echec du rejet.");
      return;
    }

    toast.success(payload?.message || "Liste rejetee.");
    await detailQuery.refetch();
  };

  if (isEdit && detailQuery.loading) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        Chargement de la liste d'insertion...
      </div>
    );
  }

  if (isEdit && (detailQuery.error || !batch)) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Impossible de charger la liste d'insertion.
      </div>
    );
  }

  const pageTitle = isEdit
    ? "Modifier une liste d'insertion"
    : "Creer une liste d'insertion";
  const pageDescription = isEdit
    ? "Mettez a jour l'en-tete, ajoutez des lignes fournisseurs puis soumettez la liste."
    : "Creez l'en-tete de la liste pour ensuite ajouter les fournisseurs proposes.";

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">{pageDescription}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <HeaderPill label="Statut" value={headerSummary.status} />
          <HeaderPill label="Lignes" value={headerSummary.entriesCount} />
          <HeaderPill
            label="Fournisseurs crees"
            value={headerSummary.createdSupplierCount}
          />
          {batch?.canSubmit ? (
            <Button
              onClick={handleSubmit}
              disabled={submitState.loading || entries.length === 0}
            >
              {submitState.loading ? "Soumission..." : "Soumettre"}
            </Button>
          ) : null}
          {batch?.canApprove ? (
            <Button onClick={handleApprove} disabled={approveState.loading}>
              {approveState.loading ? "Approbation..." : "Approuver"}
            </Button>
          ) : null}
          {batch?.canReject ? (
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectState.loading}
            >
              {rejectState.loading ? "Rejet..." : "Rejeter"}
            </Button>
          ) : null}
        </div>
      </header>

      {isSubmitted ? (
        <Alert>
          <Info className="size-4" />
          <AlertTitle>Liste en attente de decision</AlertTitle>
          <AlertDescription>
            Cette liste a deja ete soumise. Les lignes restent visibles mais ne
            sont plus modifiables tant qu'une approbation ou un rejet n'a pas
            ete rendu.
          </AlertDescription>
        </Alert>
      ) : null}

      {isApproved ? (
        <Alert>
          <Info className="size-4" />
          <AlertTitle>Liste approuvee</AlertTitle>
          <AlertDescription>
            Les fournisseurs ont ete crees a partir de cette liste. La page
            reste consultable pour audit.
          </AlertDescription>
        </Alert>
      ) : null}

      {batch?.status === "rejected" ? (
        <Alert>
          <Info className="size-4" />
          <AlertTitle>Liste rejetee</AlertTitle>
          <AlertDescription>
            Cette version est historisee. Les lignes restent visibles pour
            consultation.
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="general" className="w-full" id="supplier-intake-tabs">
        <TabsList className="mb-6 h-auto w-full justify-start overflow-x-auto rounded-xl bg-card p-1 text-muted-foreground shadow-sm lg:w-auto">
          <TabsTrigger value="general" className="rounded-lg px-4 py-2">
            General
          </TabsTrigger>
          <TabsTrigger
            value="lines"
            className="rounded-lg px-4 py-2"
            disabled={!isEdit || !batch}
          >
            Lignes fournisseurs
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="general"
          className="m-0 space-y-4 focus-visible:outline-none focus-visible:ring-0"
        >
          <DynamicForm
            schema={headerSchema}
            state={{ defaultValues: formState }}
            layout={{
              columns: 2,
              variant: "compact",
              mode: {
                type: "master-detail",
                previewClassName: "p-0 border-0 shadow-none bg-transparent",
                renderPreview: (values) => (
                  <SupplierIntakeSummaryPreview
                    listName={String(values.name || "Non renseignee")}
                    status={headerSummary.status}
                    lineCount={entries.length}
                    createdSupplierCount={createdSupplierCount}
                    createdAt={headerSummary.createdAt}
                    submittedAt={headerSummary.submittedAt}
                    approvedAt={headerSummary.approvedAt}
                  />
                ),
              },
            }}
            behavior={canEditBatch ? { onSubmit: handleHeaderSubmit } : undefined}
            actions={
              canEditBatch
                ? {
                    submitLabel: isEdit
                      ? "Enregistrer l'en-tete"
                      : "Creer la liste",
                    isSubmitting: createBatch.loading || updateBatch.loading,
                  }
                : undefined
            }
          />
          {!isEdit ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Les lignes deviennent disponibles apres la creation de l'en-tete.
            </p>
          ) : null}
        </TabsContent>

        <TabsContent
          value="lines"
          className="m-0 space-y-4 focus-visible:outline-none focus-visible:ring-0"
        >
          {batch ? (
            <SupplierIntakeLinesSection
              batch={batch}
              entries={entries}
              draftEntry={draftEntry}
              editingEntryId={editingEntryId}
              isDraft={isDraft}
              isApproved={isApproved}
              createEntryLoading={createEntry.loading}
              updateEntryLoading={updateEntry.loading}
              onDraftChange={setDraftEntry}
              onEdit={handleEditEntry}
              onDelete={(entryId) => {
                void handleDeleteEntry(entryId);
              }}
              onSave={() => {
                void handleSaveEntry();
              }}
              onCancelEdit={resetEntryEditor}
              onUploadSuccess={() => {
                void detailQuery.refetch();
              }}
            />
          ) : (
            <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
              Creez la liste pour pouvoir ajouter des fournisseurs.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}

function SupplierIntakeLinesSection({
  batch,
  entries,
  draftEntry,
  editingEntryId,
  isDraft,
  isApproved,
  createEntryLoading,
  updateEntryLoading,
  onDraftChange,
  onEdit,
  onDelete,
  onSave,
  onCancelEdit,
  onUploadSuccess,
}: {
  batch: IntakeBatchRecord;
  entries: IntakeEntryRecord[];
  draftEntry: EntryDraft;
  editingEntryId: string | null;
  isDraft: boolean;
  isApproved: boolean;
  createEntryLoading: boolean;
  updateEntryLoading: boolean;
  onDraftChange: React.Dispatch<React.SetStateAction<EntryDraft>>;
  onEdit: (entry: IntakeEntryRecord) => void;
  onDelete: (entryId: string) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onUploadSuccess: () => void;
}) {
  const columnCount = 6 + (isApproved ? 1 : 0) + (isDraft ? 1 : 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fournisseurs proposes</CardTitle>
        <CardDescription>
          {isDraft
            ? "Ajoutez ou modifiez les lignes fournisseurs avant la soumission."
            : "Consultation des lignes de la liste approuvee ou en attente."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telephone</TableHead>
                <TableHead>NIF</TableHead>
                <TableHead>RC</TableHead>
                {isApproved ? <TableHead>Fournisseur cree</TableHead> : null}
                {isDraft ? (
                  <TableHead className="w-24 text-right">Actions</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length ? (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.sortOrder}</TableCell>
                    <TableCell className="font-medium">{entry.name}</TableCell>
                    <TableCell>{entry.email || "-"}</TableCell>
                    <TableCell>{entry.phone || "-"}</TableCell>
                    <TableCell>{entry.nif || "-"}</TableCell>
                    <TableCell>{entry.rc || "-"}</TableCell>
                    {isApproved ? (
                      <TableCell>{entry.supplier?.name ?? "-"}</TableCell>
                    ) : null}
                    {isDraft ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(entry)}
                          >
                            <Pencil className="h-4 w-4" />
                            Modifier
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => onDelete(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    className="py-6 text-center text-muted-foreground"
                  >
                    Aucun fournisseur dans la liste.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {isDraft ? (
          <div className="space-y-4 rounded-xl border border-border/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">
                  {editingEntryId
                    ? "Modifier la ligne fournisseur"
                    : "Ajouter une ligne fournisseur"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Renseignez les informations qui seront proposees a
                  l'approbation du lot.
                </p>
              </div>
              {!editingEntryId ? (
                <div className="flex items-center gap-2">
                  <BatchUploadModal
                    batchId={batch.id}
                    nextSortOrder={
                      entries.length
                        ? Math.max(...entries.map((e) => e.sortOrder || 0)) + 1
                        : 1
                    }
                    onUploadSuccess={onUploadSuccess}
                  />
                  <Button type="button" variant="outline" onClick={onCancelEdit}>
                    <Plus className="h-4 w-4" />
                    Nouvelle ligne
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field>
                <Label htmlFor="entry-sort-order">Ordre</Label>
                <Input
                  id="entry-sort-order"
                  type="number"
                  min="1"
                  value={draftEntry.sortOrder}
                  onChange={(event) =>
                    onDraftChange((current) => ({
                      ...current,
                      sortOrder: Number(event.target.value) || 0,
                    }))
                  }
                />
              </Field>
              <Field className="md:col-span-2">
                <Label htmlFor="entry-name">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="entry-name"
                  value={draftEntry.name}
                  onChange={(event) =>
                    onDraftChange((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Raison sociale"
                />
              </Field>
              <Field>
                <Label htmlFor="entry-email">E-mail</Label>
                <Input
                  id="entry-email"
                  value={draftEntry.email ?? ""}
                  onChange={(event) =>
                    onDraftChange((current) => ({
                      ...current,
                      email: event.target.value || undefined,
                    }))
                  }
                />
              </Field>
              <Field>
                <Label htmlFor="entry-phone">Telephone</Label>
                <Input
                  id="entry-phone"
                  value={draftEntry.phone}
                  onChange={(event) =>
                    onDraftChange((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <Label htmlFor="entry-website">Site web</Label>
                <Input
                  id="entry-website"
                  value={draftEntry.website ?? ""}
                  onChange={(event) =>
                    onDraftChange((current) => ({
                      ...current,
                      website: event.target.value || undefined,
                    }))
                  }
                />
              </Field>
              <Field>
                <Label htmlFor="entry-nif">NIF</Label>
                <Input
                  id="entry-nif"
                  value={draftEntry.nif}
                  onChange={(event) =>
                    onDraftChange((current) => ({
                      ...current,
                      nif: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <Label htmlFor="entry-art">ART</Label>
                <Input
                  id="entry-art"
                  value={draftEntry.art}
                  onChange={(event) =>
                    onDraftChange((current) => ({
                      ...current,
                      art: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <Label htmlFor="entry-nis">NIS</Label>
                <Input
                  id="entry-nis"
                  value={draftEntry.nis}
                  onChange={(event) =>
                    onDraftChange((current) => ({
                      ...current,
                      nis: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <Label htmlFor="entry-rc">RC</Label>
                <Input
                  id="entry-rc"
                  value={draftEntry.rc}
                  onChange={(event) =>
                    onDraftChange((current) => ({
                      ...current,
                      rc: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field className="md:col-span-2">
                <Label htmlFor="entry-address">Adresse</Label>
                <Textarea
                  id="entry-address"
                  value={draftEntry.address}
                  onChange={(event) =>
                    onDraftChange((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                  rows={2}
                />
              </Field>
              <Field>
                <Label htmlFor="entry-notes">Notes</Label>
                <Textarea
                  id="entry-notes"
                  value={draftEntry.notes}
                  onChange={(event) =>
                    onDraftChange((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={2}
                />
              </Field>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={onSave}
                disabled={createEntryLoading || updateEntryLoading}
              >
                {editingEntryId
                  ? "Enregistrer la ligne"
                  : "Ajouter la ligne"}
              </Button>
              {editingEntryId ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={onCancelEdit}
                >
                  Annuler
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {!isDraft && batch.status === "approved" && entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun fournisseur n'a ete genere a partir de cette liste.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function HeaderPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function SupplierIntakeSummaryPreview({
  listName,
  status,
  lineCount,
  createdSupplierCount,
  createdAt,
  submittedAt,
  approvedAt,
}: {
  listName: string;
  status: string;
  lineCount: number;
  createdSupplierCount: number;
  createdAt: string;
  submittedAt: string;
  approvedAt: string;
}) {
  return (
    <div className="flex h-full w-full flex-col gap-4 lg:w-[360px] xl:w-[400px]">
      <div className="rounded-2xl border bg-card p-5">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Apercu du lot
          </p>
          <h3 className="text-lg font-semibold">Resume</h3>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <PreviewRow label="Nom" value={listName} />
          <PreviewRow label="Statut" value={status} />
          <PreviewRow label="Lignes" value={String(lineCount)} />
          <PreviewRow
            label="Fournisseurs crees"
            value={String(createdSupplierCount)}
          />
          <PreviewRow label="Creation" value={createdAt} />
          <PreviewRow label="Soumission" value={submittedAt} />
          <PreviewRow label="Approbation" value={approvedAt} />
        </div>
      </div>
      <div className="rounded-2xl border bg-card p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Progression
        </p>
        <p className="mt-2 text-3xl font-semibold">{lineCount}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Nombre de lignes fournisseurs actuellement rattachees a cette liste.
        </p>
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "-"}</span>
    </div>
  );
}

function Field({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`space-y-2 ${className ?? ""}`}>{children}</div>;
}

function BatchUploadModal({
  batchId,
  nextSortOrder,
  onUploadSuccess,
}: {
  batchId: string;
  nextSortOrder: number;
  onUploadSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [parsedData, setParsedData] = useState<EntryDraft[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const createEntry = useModelCreateMutation({
    app: "suppliers",
    model: "SupplierIntakeEntry",
  });

  const handleDownloadTemplate = () => {
    const headers = [
      "Nom",
      "Email",
      "Telephone",
      "NIF",
      "ART",
      "NIS",
      "RC",
      "Adresse",
      "Site web",
      "Notes",
    ];
    const csvContent = headers.join(";") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modele_fournisseurs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVRow = (text: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ";" && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      if (lines.length <= 1) {
        toast.error("Le fichier est vide ou ne contient que les en-tetes.");
        return;
      }

      const headers = parseCSVRow(lines[0]).map((h) => h.trim().toLowerCase());

      const newData: EntryDraft[] = [];
      let sortOrder = nextSortOrder;

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVRow(lines[i]);
        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          obj[h] = (values[idx] || "").trim();
        });

        if (obj["nom"]) {
          newData.push({
            sortOrder: sortOrder++,
            name: obj["nom"],
            email: obj["email"] || undefined,
            phone: obj["telephone"] || "",
            nif: obj["nif"] || "",
            art: obj["art"] || "",
            nis: obj["nis"] || "",
            rc: obj["rc"] || "",
            address: obj["adresse"] || "",
            website: obj["site web"] || undefined,
            notes: obj["notes"] || "",
          });
        }
      }

      if (newData.length === 0) {
        toast.error("Aucune donnee valide trouvee.");
      } else {
        setParsedData(newData);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSave = async () => {
    setIsUploading(true);
    let successCount = 0;
    for (const draft of parsedData) {
      const input = {
        batch: { connect: batchId },
        sortOrder: draft.sortOrder,
        name: draft.name,
        email: optionalTrimmed(draft.email),
        phone: draft.phone,
        address: draft.address,
        nif: draft.nif,
        art: draft.art,
        nis: draft.nis,
        rc: draft.rc,
        website: optionalTrimmed(draft.website),
        notes: draft.notes,
      };

      try {
        const response = await createEntry.execute({ input });
        const payload = extractMutationPayload(
          response.data as Record<string, unknown> | undefined,
          createEntry.mutationName,
        );
        if (payload?.ok) {
          successCount++;
        }
      } catch {
        // Ignorer l'erreur pour continuer
      }
    }

    setIsUploading(false);
    toast.success(`${successCount} sur ${parsedData.length} fournisseur(s) enregistre(s).`);
    setParsedData([]);
    setOpen(false);
    onUploadSuccess();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) setParsedData([]);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <UploadCloud className="mr-2 h-4 w-4" />
          Importer via CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer des fournisseurs (CSV)</DialogTitle>
          <DialogDescription>
            Telechargez le modele, remplissez les fournisseurs puis uploadez le fichier.
          </DialogDescription>
        </DialogHeader>

        {parsedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 py-8">
            <Button type="button" variant="secondary" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Telecharger Modele CSV
            </Button>

            <div className="relative w-full max-w-sm">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <p className="text-sm font-medium">
              {parsedData.length} fournisseur(s) trouve(s)
            </p>
            <div className="max-h-60 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telephone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 5).map((d, i) => (
                    <TableRow key={i}>
                      <TableCell>{d.name}</TableCell>
                      <TableCell>{d.email || "-"}</TableCell>
                      <TableCell>{d.phone || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {parsedData.length > 5 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-sm text-muted-foreground"
                      >
                        ... et {parsedData.length - 5} autres
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isUploading}
          >
            Annuler
          </Button>
          {parsedData.length > 0 && (
            <Button type="button" onClick={() => void handleSave()} disabled={isUploading}>
              {isUploading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SupplierIntakeBatchFormPage;
