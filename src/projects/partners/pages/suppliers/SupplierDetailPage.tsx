/** Reusable Partners implementation using the host Rail runtime. */
import { useQuery } from "@apollo/client";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/shared/ui/kit/badge";
import { PageHeader } from "@/shared/ui/common/PageHeader";
import { Progress } from "@/shared/ui/kit/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/kit/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/kit/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/kit/tabs";
import { ROUTES } from "../../config/routes";
import { SupplierAttachmentListSection } from "../../components/SupplierAttachmentListSection";
import { DynamicModelTable } from "@/widgets/model-table";
import { PURCHASE_ORDER_TABLE_FIELDS } from "../../config/purchaseOrderFields";
import { getAllRoutes } from "@/app/router/manifestRegistry";
import { usePartnerRoutes } from "../../routeSelection";
import { SUPPLIER_DETAIL_QUERY } from "../../api/suppliers";

type SupplierContactRecord = {
  id: string;
  name: string;
  position?: string | null;
  phone?: string | null;
  email?: string | null;
  isPrimary?: boolean | null;
};

type SupplierDetailRecord = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  notes?: string | null;
  nif?: string | null;
  art?: string | null;
  nis?: string | null;
  rc?: string | null;
  isActive: boolean;
  isSupplier: boolean;
  categorySpendingSummaries?: Array<{
    categoryId: number;
    categoryName: string;
    annualLimit: string | number;
    approvedSpending: string | number;
    remainingAmount: string | number;
    progressPercent: number;
    limitExceeded: boolean;
  }> | null;
  annualSpendingYear?: number | null;
  approvedFromBatch?: {
    id: string;
    name: string;
    status?: string | null;
  } | null;
  lots?: Array<{ id: string; code: string; name: string }> | null;
  contacts?: SupplierContactRecord[] | null;
};

type SupplierDetailQueryData = {
  supplier: SupplierDetailRecord | null;
};

function formatAmount(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  const numeric =
    typeof value === "string" ? Number.parseFloat(value) : Number(value);
  if (Number.isNaN(numeric)) {
    return String(value);
  }
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

function HeaderPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-[150px] flex-col justify-center rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-base font-medium">{value}</p>
    </div>
  );
}

function DetailItem({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "space-y-1 md:col-span-2" : "space-y-1"}>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

export function SupplierDetailPage() {
  const { isRouteEnabled } = usePartnerRoutes();
  const purchaseOrderDetail = getAllRoutes().find(route => route.id === "achat:purchase-orders:detail");
  const { id = "" } = useParams();
  const { data, loading, error } = useQuery<SupplierDetailQueryData>(
    SUPPLIER_DETAIL_QUERY,
    {
      variables: { id },
      skip: !id,
    },
  );

  const supplier = data?.supplier ?? null;

  if (loading) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        Chargement du detail fournisseur...
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Impossible de charger le detail fournisseur.
      </div>
    );
  }

  const lots = (supplier.lots ?? []).map((item) => `${item.code} — ${item.name}`).join(", ");
  const categories = supplier.categorySpendingSummaries ?? [];
  const annualLimitExceeded = categories.some((category) => category.limitExceeded);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-6 rounded-2xl border bg-card p-6 shadow-sm">
        <PageHeader
          title="Detail fournisseur"
          description="Cockpit de pilotage des depenses annuelles basees uniquement sur les BC clotures."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={supplier.isSupplier ? "secondary" : "outline"}>
                {supplier.isSupplier ? "Fournisseur" : "Non fournisseur"}
              </Badge>
              <Badge variant={supplier.isActive ? "secondary" : "outline"}>
                {supplier.isActive ? "Actif" : "Inactif"}
              </Badge>
              {annualLimitExceeded ? (
                <Badge variant="destructive">Plafond depasse</Badge>
              ) : null}
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <HeaderPill
            label="Exercice"
            value={String(supplier.annualSpendingYear ?? "-")}
          />
        </div>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="orders">Historique BC clôturés</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)] items-start">
            <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Identite</CardTitle>
              <CardDescription>
                Informations generales et rattachement du fournisseur.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <DetailItem label="Nom" value={supplier.name} />
              <DetailItem label="Lots d'activité" value={lots || "-"} />
              <DetailItem label="E-mail" value={supplier.email || "-"} />
              <DetailItem label="Telephone" value={supplier.phone || "-"} />
              <DetailItem label="Site web" value={supplier.website || "-"} />
              <DetailItem label="Adresse" value={supplier.address || "-"} fullWidth />
              <DetailItem label="NIF" value={supplier.nif || "-"} />
              <DetailItem label="ART" value={supplier.art || "-"} />
              <DetailItem label="NIS" value={supplier.nis || "-"} />
              <DetailItem label="RC" value={supplier.rc || "-"} />
              <DetailItem label="Notes" value={supplier.notes || "-"} fullWidth />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
              <CardDescription>
                Interlocuteurs operationnels et administratifs du fournisseur.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead>Telephone</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Principal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(supplier.contacts ?? []).length ? (
                    (supplier.contacts ?? []).map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell>{contact.name}</TableCell>
                        <TableCell>{contact.position || "-"}</TableCell>
                        <TableCell>{contact.phone || "-"}</TableCell>
                        <TableCell>{contact.email || "-"}</TableCell>
                        <TableCell>
                          {contact.isPrimary ? (
                            <Badge variant="secondary">Oui</Badge>
                          ) : (
                            <Badge variant="outline">Non</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-6 text-center text-muted-foreground"
                      >
                        Aucun contact enregistre.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pieces jointes</CardTitle>
              <CardDescription>
                Documents legaux et fichiers rattaches au fournisseur.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SupplierAttachmentListSection supplierId={supplier.id} />
            </CardContent>
          </Card>
        </div>

        <div className="sticky top-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pilotage des plafonds par catégorie</CardTitle>
              <CardDescription>
                Suivi des dépenses approuvées pour chaque catégorie utilisée par ce fournisseur.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {categories.length ? (
                <div className="space-y-6">
                  {categories.map((cat, index) => {
                    const catProgress = Math.max(0, Math.min(Number(cat.progressPercent) || 0, 100));
                    return (
                      <div key={cat.categoryId}>
                        {index > 0 && <hr className="mb-6 border-border/60" />}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold">{cat.categoryName}</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progression annuelle</span>
                              <span className="font-medium text-foreground">{catProgress}%</span>
                            </div>
                            <Progress
                              value={catProgress}
                              className={
                                cat.limitExceeded
                                  ? "[&>div]:bg-destructive h-2"
                                  : "[&>div]:bg-emerald-500 h-2"
                              }
                            />
                          </div>

                          <div className="grid gap-3 text-sm md:grid-cols-3">
                            <div className="rounded-xl border bg-muted/10 p-3">
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Plafond
                              </p>
                              <p className="mt-1 font-semibold">{formatAmount(cat.annualLimit)}</p>
                            </div>
                            <div className="rounded-xl border bg-muted/10 p-3">
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Dépense
                              </p>
                              <p className="mt-1 font-semibold">{formatAmount(cat.approvedSpending)}</p>
                            </div>
                            <div className="rounded-xl border bg-muted/10 p-3">
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Reste
                              </p>
                              <p
                                className={`mt-1 font-semibold ${
                                  cat.limitExceeded ? "text-destructive" : "text-foreground"
                                }`}
                              >
                                {formatAmount(cat.remainingAmount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune catégorie enregistrée sur les BC de cet exercice.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trace d'insertion</CardTitle>
              <CardDescription>
                Historique de la liste d'insertion source lorsqu'elle existe.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {supplier.approvedFromBatch ? (
                <div className="space-y-3">
                  <div className="rounded-xl border bg-muted/10 p-4">
                    <p className="text-sm font-medium">
                      {supplier.approvedFromBatch.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Statut : {supplier.approvedFromBatch.status || "-"}
                    </p>
                  </div>
                  {isRouteEnabled("achat:supplier-intake-batches:detail") ? <Link
                    className="text-sm font-medium text-primary hover:underline"
                    to={ROUTES.ADMIN.SUPPLIER_INTAKE_BATCHES.DETAIL.replace(
                      ":id",
                      supplier.approvedFromBatch.id,
                    )}
                  >
                    Ouvrir la liste d'insertion
                  </Link> : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun lot d'insertion d'origine rattache.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
        </TabsContent>
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Historique BC clôturés</CardTitle>
              <CardDescription>
                Tous les bons de commande clôturés pour ce fournisseur.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DynamicModelTable
                app="purchasing"
                model="PurchaseOrder"
                initVariables={{
                  where: {
                    supplier: { eq: id },
                    status: { eq: "closed" }
                  }
                }}
                detail={purchaseOrderDetail ? {
                  type: "link",
                  hrefTemplate: purchaseOrderDetail.path,
                } : undefined}
                baseTable={{
                  fields: [...PURCHASE_ORDER_TABLE_FIELDS]
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}

export default SupplierDetailPage;
