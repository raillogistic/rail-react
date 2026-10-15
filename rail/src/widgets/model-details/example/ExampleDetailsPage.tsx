/**
 * @module ExampleDetailsPage
 * @description Page d'exemple complète pour le widget model-details.
 * Démontre l'ensemble des sections intégrées avec des données réalistes :
 * - HeaderSection : en-tête avec avatar, sous-titre et badges
 * - GeneralSection : champs typés (text, status, datetime, entityRef, email, etc.)
 * - MetricsSection : cartes KPI avec tendances et graphiques sparkline
 * - TableSection : tableau avec colonnes, tri et recherche rapide
 * - ListSection : liste groupée avec icônes et tons
 * - TimelineSection : chronologie d'activité avec types d'événements
 * - AttachmentsSection : gestion de fichiers avec upload/download/suppression
 * - SettingsSection : groupes pliables avec actions destructives
 * - CustomSection : rendu libre avec données personnalisées
 */
import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DynamicDetail from "../DynamicDetail";
import type { DetailsPageSchema } from "../sectionTypes";
import {
  createAttachmentsSection,
  createCustomSection,
  createGeneralSection,
  createHeaderSection,
  createListSection,
  createMetricsSection,
  createSettingsSection,
  createTableSection,
  createTimelineSection,
} from "../builtInSections";
import type { UnitFieldInput } from "../units/unitFieldTypes";
import {
  Package,
  Globe,
  Shield,
  Zap,
  Bell,
  Tag,
  Users,
  CreditCard,
  BarChart3,
  FileCode2,
  Layers,
  CheckCircle2,
} from "lucide-react";

/* ─────────────────────────────────────────────────── */
/*  Types                                              */
/* ─────────────────────────────────────────────────── */

/** Entité principale représentant un projet SaaS complet. */
type ProjectEntity = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "trialing" | "suspended" | "archived";
  plan: "starter" | "professional" | "enterprise";
  owner: {
    id: number;
    name: string;
    avatarUrl: string;
    role: string;
  };
  organization: {
    id: number;
    label: string;
    href: string;
  };
  createdAt: string;
  updatedAt: string;
  trialEndsAt: string | null;
  mrr: number;
  arr: number;
  growth: number;
  churnRate: number;
  activeUsers: number;
  totalSeats: number;
  storageUsedBytes: number;
  storageLimitBytes: number;
  apiCallsUsed: number;
  apiCallsLimit: number;
  region: string;
  domain: string;
  email: string;
  phone: string;
  tags: string[];
  webhooksEnabled: boolean;
  twoFactorEnforced: boolean;
  ssoProvider: string | null;
};

/** Ligne de facturation pour la section tableau. */
type InvoiceRow = {
  id: string;
  number: string;
  date: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "overdue" | "refunded";
  clientName: string;
  dueDate: string;
};

/** Ligne de membre d'équipe pour la section tableau. */
type TeamMemberRow = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  lastActive: string;
  status: "online" | "offline" | "away";
};

/* ─────────────────────────────────────────────────── */
/*  Données factices                                   */
/* ─────────────────────────────────────────────────── */

const fakeProject: ProjectEntity = {
  id: "proj-8f3a-4b2c",
  name: "Constellation Platform",
  slug: "constellation-platform",
  status: "active",
  plan: "enterprise",
  owner: {
    id: 1,
    name: "Ada Lovelace",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Ada",
    role: "Lead Architect",
  },
  organization: {
    id: 42,
    label: "Nebula Systems Inc.",
    href: "/organizations/42",
  },
  createdAt: "2025-03-12T09:15:00Z",
  updatedAt: "2026-02-24T18:42:00Z",
  trialEndsAt: null,
  mrr: 48750,
  arr: 585000,
  growth: 0.124,
  churnRate: 0.018,
  activeUsers: 1247,
  totalSeats: 2000,
  storageUsedBytes: 34_359_738_368,
  storageLimitBytes: 107_374_182_400,
  apiCallsUsed: 2_456_789,
  apiCallsLimit: 5_000_000,
  region: "eu-west-1",
  domain: "constellation.nebula.io",
  email: "support@nebula.io",
  phone: "+33 1 42 68 53 00",
  tags: ["enterprise", "priority-support", "eu-compliant", "soc2"],
  webhooksEnabled: true,
  twoFactorEnforced: true,
  ssoProvider: "Okta SAML",
};

const fakeInvoices: InvoiceRow[] = [
  {
    id: "inv-001",
    number: "INV-2026-0042",
    date: "2026-02-01",
    amount: 48750,
    currency: "EUR",
    status: "paid",
    clientName: "Nebula Systems Inc.",
    dueDate: "2026-02-28",
  },
  {
    id: "inv-002",
    number: "INV-2026-0041",
    date: "2026-01-01",
    amount: 48750,
    currency: "EUR",
    status: "paid",
    clientName: "Nebula Systems Inc.",
    dueDate: "2026-01-28",
  },
  {
    id: "inv-003",
    number: "INV-2025-0040",
    date: "2025-12-01",
    amount: 45600,
    currency: "EUR",
    status: "paid",
    clientName: "Nebula Systems Inc.",
    dueDate: "2025-12-28",
  },
  {
    id: "inv-004",
    number: "INV-2025-0039",
    date: "2025-11-01",
    amount: 45600,
    currency: "EUR",
    status: "paid",
    clientName: "Nebula Systems Inc.",
    dueDate: "2025-11-28",
  },
  {
    id: "inv-005",
    number: "INV-2025-0038",
    date: "2025-10-01",
    amount: 42300,
    currency: "EUR",
    status: "refunded",
    clientName: "Nebula Systems Inc.",
    dueDate: "2025-10-28",
  },
];

const fakeTeamMembers: TeamMemberRow[] = [
  {
    id: "u-1",
    name: "Ada Lovelace",
    email: "ada@nebula.io",
    role: "admin",
    lastActive: "2026-02-25T19:30:00Z",
    status: "online",
  },
  {
    id: "u-2",
    name: "Grace Hopper",
    email: "grace@nebula.io",
    role: "editor",
    lastActive: "2026-02-25T18:15:00Z",
    status: "online",
  },
  {
    id: "u-3",
    name: "Alan Turing",
    email: "alan@nebula.io",
    role: "editor",
    lastActive: "2026-02-25T14:00:00Z",
    status: "away",
  },
  {
    id: "u-4",
    name: "Margaret Hamilton",
    email: "margaret@nebula.io",
    role: "viewer",
    lastActive: "2026-02-24T09:00:00Z",
    status: "offline",
  },
  {
    id: "u-5",
    name: "Linus Torvalds",
    email: "linus@nebula.io",
    role: "admin",
    lastActive: "2026-02-25T20:00:00Z",
    status: "online",
  },
  {
    id: "u-6",
    name: "Tim Berners-Lee",
    email: "tim@nebula.io",
    role: "viewer",
    lastActive: "2026-02-23T11:30:00Z",
    status: "offline",
  },
];

const fakeTimeline = [
  {
    id: "evt-1",
    actor: "Ada Lovelace",
    type: "update" as const,
    timestamp: "2026-02-25T18:42:00Z",
    title: "DNS records updated",
    description:
      "Custom domain constellation.nebula.io verified and HTTPS certificate provisioned.",
  },
  {
    id: "evt-2",
    actor: "Grace Hopper",
    type: "create" as const,
    timestamp: "2026-02-25T15:10:00Z",
    title: "New API key generated",
    description: "Production API key rotated with 90-day expiry.",
  },
  {
    id: "evt-3",
    actor: "System",
    type: "status" as const,
    timestamp: "2026-02-25T12:00:00Z",
    title: "Health check passed",
    description: "All 14 services reported healthy status.",
    tone: "success" as const,
  },
  {
    id: "evt-4",
    actor: "Alan Turing",
    type: "comment" as const,
    timestamp: "2026-02-24T16:45:00Z",
    title: "Architecture review note",
    description:
      "Recommended upgrading to the new query engine for improved latency.",
  },
  {
    id: "evt-5",
    actor: "Ada Lovelace",
    type: "attachment" as const,
    timestamp: "2026-02-24T10:20:00Z",
    title: "Security audit uploaded",
    description: "SOC 2 Type II compliance report attached.",
  },
  {
    id: "evt-6",
    actor: "Margaret Hamilton",
    type: "create" as const,
    timestamp: "2026-02-23T09:00:00Z",
    title: "Project created",
    description: "Initial project setup with enterprise plan configuration.",
  },
];

const fakeFiles = [
  {
    id: "f-1",
    name: "SOC2-Type-II-Report-2026.pdf",
    sizeBytes: 4_512_300,
    contentType: "application/pdf",
    href: "#",
  },
  {
    id: "f-2",
    name: "architecture-diagram.png",
    sizeBytes: 892_100,
    contentType: "image/png",
    href: "#",
  },
  {
    id: "f-3",
    name: "api-migration-guide.md",
    sizeBytes: 34_200,
    contentType: "text/markdown",
    href: "#",
  },
  {
    id: "f-4",
    name: "database-backup-20260225.sql.gz",
    sizeBytes: 156_789_000,
    contentType: "application/gzip",
    href: "#",
  },
  {
    id: "f-5",
    name: "terraform-infra.zip",
    sizeBytes: 2_345_678,
    contentType: "application/zip",
    href: "#",
  },
  {
    id: "f-6",
    name: "monitoring-config.json",
    sizeBytes: 8_400,
    contentType: "application/json",
    href: "#",
  },
];

/** Données sparkline simulées pour les cartes de métriques. */
const sparkline_mrr = Array.from({ length: 12 }, (_, i) => ({
  value: 35000 + Math.round(Math.random() * 5000 + i * 1200),
}));
const sparkline_users = Array.from({ length: 12 }, (_, i) => ({
  value: 800 + Math.round(Math.random() * 100 + i * 40),
}));
const sparkline_api = Array.from({ length: 12 }, (_, i) => ({
  value: 1_500_000 + Math.round(Math.random() * 300_000 + i * 80_000),
}));

/* ─────────────────────────────────────────────────── */
/*  Colonnes de tableau                                */
/* ─────────────────────────────────────────────────── */

const invoiceColumns: ColumnDef<InvoiceRow>[] = [
  { id: "number", header: "Number", accessorKey: "number" },
  { id: "date", header: "Date", accessorKey: "date" },
  { id: "clientName", header: "Client", accessorKey: "clientName" },
  {
    id: "amount",
    header: "Amount",
    accessorFn: (row) => `€${row.amount.toLocaleString()}`,
  },
  { id: "status", header: "Status", accessorKey: "status" },
  { id: "dueDate", header: "Due Date", accessorKey: "dueDate" },
];

const teamColumns: ColumnDef<TeamMemberRow>[] = [
  { id: "name", header: "Name", accessorKey: "name" },
  { id: "email", header: "Email", accessorKey: "email" },
  { id: "role", header: "Role", accessorKey: "role" },
  { id: "status", header: "Status", accessorKey: "status" },
  { id: "lastActive", header: "Last Active", accessorKey: "lastActive" },
];

/* ─────────────────────────────────────────────────── */
/*  Champs de la section générale                      */
/* ─────────────────────────────────────────────────── */

/** Champs d'informations principales du projet. */
function projectInfoFields(project: ProjectEntity): UnitFieldInput[] {
  return [
    {
      id: "name",
      label: "Nom du projet",
      kind: "text",
      value: project.name,
      copyable: true,
    },
    {
      id: "slug",
      label: "Identifiant",
      kind: "id",
      value: project.slug,
      copyable: true,
    },
    {
      id: "status",
      label: "Statut",
      kind: "status",
      value: project.status,
      tone:
        project.status === "active"
          ? "success"
          : project.status === "suspended"
            ? "danger"
            : "warning",
    },
    {
      id: "plan",
      label: "Forfait",
      kind: "enum",
      value: project.plan,
      format: {
        enum: {
          labels: {
            starter: "Starter",
            professional: "Professional",
            enterprise: "Enterprise",
          },
        },
      },
    },
    { id: "owner", label: "Propriétaire", kind: "user", value: project.owner },
    {
      id: "organization",
      label: "Organisation",
      kind: "entityRef",
      value: project.organization,
    },
    {
      id: "created",
      label: "Date de création",
      kind: "datetime",
      value: project.createdAt,
      format: { dateTime: { dateStyle: "long", timeStyle: "short" } },
    },
    {
      id: "updated",
      label: "Dernière mise à jour",
      kind: "relativeTime",
      value: project.updatedAt,
    },
  ];
}

/** Champs de configuration technique. */
function technicalFields(project: ProjectEntity): UnitFieldInput[] {
  return [
    {
      id: "domain",
      label: "Domaine",
      kind: "url",
      value: `https://${project.domain}`,
      copyable: true,
      link: { href: `https://${project.domain}`, external: true },
    },
    {
      id: "email",
      label: "Email de support",
      kind: "email",
      value: project.email,
      copyable: true,
    },
    {
      id: "phone",
      label: "Téléphone",
      kind: "phone",
      value: project.phone,
      copyable: true,
    },
    {
      id: "region",
      label: "Région",
      kind: "text",
      value: project.region,
      badge: { text: "EU", tone: "info" },
    },
    { id: "tags", label: "Tags", kind: "tags", value: project.tags },
    {
      id: "sso",
      label: "SSO Provider",
      kind: "text",
      value: project.ssoProvider,
      emptyText: "Non configuré",
    },
    {
      id: "storage",
      label: "Stockage utilisé",
      kind: "fileSize",
      value: project.storageUsedBytes,
      format: { bytes: { base: 1024, precision: 1 } },
    },
    {
      id: "api-usage",
      label: "Appels API (ce mois)",
      kind: "number",
      value: project.apiCallsUsed,
      format: { number: { compact: true, thousandsSeparator: true } },
    },
  ];
}

/* ─────────────────────────────────────────────────── */
/*  Utilitaire de simulation d'appels async            */
/* ─────────────────────────────────────────────────── */

/** Simule un délai réseau. */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/* ─────────────────────────────────────────────────── */
/*  Construction du schéma                             */
/* ─────────────────────────────────────────────────── */

/**
 * Construit le schéma complet de la page de détails.
 * Démontre l'utilisation de tous les types de sections intégrés
 * avec des données réalistes et des options avancées.
 */
function buildExampleSchema(): DetailsPageSchema {
  return {
    /* ── En-tête ── */
    header: [
      createHeaderSection({
        id: "header-project",
        title: "Détails du projet",
        testId: "project-header",
        select: (ctx) => {
          const project = ctx.entity as ProjectEntity | undefined;
          if (!project) return undefined;
          return {
            title: project.name,
            subtitle: `${project.organization.label} · ${project.region.toUpperCase()}`,
            avatarUrl: project.owner.avatarUrl,
            badges: [
              {
                id: "status",
                label: project.status,
                tone: project.status === "active" ? "success" : "warning",
              },
              { id: "plan", label: project.plan, tone: "info" },
              ...(project.twoFactorEnforced
                ? [{ id: "2fa", label: "2FA", tone: "success" as const }]
                : []),
            ],
          };
        },
        actions: () => [
          {
            id: "copy-id",
            label: "Copier l'ID",
            icon: <Package className="size-3.5" />,
            onClick: () => {
              void navigator.clipboard.writeText(fakeProject.id);
            },
          },
          {
            id: "visit-domain",
            label: "Ouvrir le domaine",
            icon: <Globe className="size-3.5" />,
            tone: "primary",
            onClick: () => {
              window.open(`https://${fakeProject.domain}`, "_blank");
            },
          },
        ],
      }),
    ],

    /* ── Corps principal ── */
    body: [
      /* Informations générales (2 colonnes) */
      createGeneralSection({
        id: "info-general",
        title: "Informations générales",
        description: "Détails principaux et métadonnées du projet",
        icon: <Layers className="size-4" />,
        columns: 2,
        testId: "section-info-general",
        select: (ctx) => {
          const project = ctx.entity as ProjectEntity | undefined;
          return project ? projectInfoFields(project) : [];
        },
        actions: () => [
          {
            id: "edit-info",
            label: "Modifier",
            tone: "primary",
            onClick: async ({ reload }) => {
              await reload();
            },
          },
        ],
      }),

      /* Configuration technique (3 colonnes) */
      createGeneralSection({
        id: "info-technical",
        title: "Configuration technique",
        description: "Domaine, stockage, API et sécurité",
        icon: <FileCode2 className="size-4" />,
        columns: 3,
        testId: "section-info-technical",
        select: (ctx) => {
          const project = ctx.entity as ProjectEntity | undefined;
          return project ? technicalFields(project) : [];
        },
      }),

      /* Métriques KPI avec sparklines */
      createMetricsSection({
        id: "metrics-kpi",
        title: "Indicateurs clés",
        description: "Performance financière et utilisation",
        columns: 4,
        testId: "section-metrics-kpi",
        select: (ctx) => {
          const project = ctx.entity as ProjectEntity | undefined;
          if (!project) return [];
          return [
            {
              id: "mrr",
              label: "Revenu Mensuel Récurrent",
              value: project.mrr,
              kind: "currency" as const,
              icon: <CreditCard className="size-4" />,
              trend: "up" as const,
              trendValue: "+12.4%",
              chartData: sparkline_mrr,
            },
            {
              id: "arr",
              label: "Revenu Annuel Récurrent",
              value: project.arr,
              kind: "currency" as const,
              icon: <BarChart3 className="size-4" />,
              trend: "up" as const,
              trendValue: "+14.8%",
            },
            {
              id: "active-users",
              label: "Utilisateurs actifs",
              value: project.activeUsers,
              kind: "number" as const,
              icon: <Users className="size-4" />,
              trend: "up" as const,
              trendValue: `${project.activeUsers}/${project.totalSeats}`,
              chartData: sparkline_users,
              hint: `${Math.round((project.activeUsers / project.totalSeats) * 100)}% des licences utilisées`,
            },
            {
              id: "api-calls",
              label: "Appels API (mois)",
              value: project.apiCallsUsed,
              kind: "number" as const,
              icon: <Zap className="size-4" />,
              trend: "up" as const,
              trendValue: `${Math.round((project.apiCallsUsed / project.apiCallsLimit) * 100)}%`,
              chartData: sparkline_api,
              hint: `Limite : ${(project.apiCallsLimit / 1_000_000).toFixed(0)}M appels/mois`,
            },
          ];
        },
      }),

      /* Section métriques secondaires */
      createMetricsSection({
        id: "metrics-health",
        title: "Santé du projet",
        columns: 3,
        testId: "section-metrics-health",
        select: (ctx) => {
          const project = ctx.entity as ProjectEntity | undefined;
          if (!project) return [];
          return [
            {
              id: "growth",
              label: "Croissance mensuelle",
              value: project.growth,
              kind: "percent" as const,
              trend: project.growth > 0 ? ("up" as const) : ("down" as const),
              trendValue: `${project.growth > 0 ? "+" : ""}${(project.growth * 100).toFixed(1)}%`,
            },
            {
              id: "churn",
              label: "Taux de désabonnement",
              value: project.churnRate,
              kind: "percent" as const,
              trend:
                project.churnRate < 0.03 ? ("up" as const) : ("down" as const),
              trendValue: project.churnRate < 0.03 ? "Faible" : "Élevé",
            },
            {
              id: "storage",
              label: "Stockage occupé",
              value: project.storageUsedBytes,
              kind: "bytes" as const,
              trend: "flat" as const,
              trendValue: `${Math.round((project.storageUsedBytes / project.storageLimitBytes) * 100)}%`,
              hint: `Limite : ${(project.storageLimitBytes / 1024 ** 3).toFixed(0)} Go`,
            },
          ];
        },
      }),

      /* Section personnalisée : résumé visuel */
      createCustomSection<{ description: string; highlights: string[] }>({
        id: "custom-summary",
        title: "À propos du projet",
        description: "Présentation et points clés",
        icon: <CheckCircle2 className="size-4" />,
        testId: "section-custom-summary",
        select: () => ({
          description:
            "Constellation Platform est une solution SaaS d'entreprise conçue pour la gestion centralisée des flux de données et l'analyse prédictive. Déployée sur l'infrastructure cloud européenne, elle répond aux exigences strictes de conformité RGPD et SOC 2 Type II.",
          highlights: [
            "Architecture multi-tenant avec isolation complète des données",
            "API GraphQL et REST avec rate-limiting adaptatif",
            "Intégration SSO via Okta SAML avec authentification 2FA obligatoire",
            "Monitoring en temps réel avec alertes Slack et PagerDuty",
            "Sauvegardes automatiques toutes les 6 heures avec rétention 90 jours",
          ],
        }),
        render: ({ data }) => {
          if (!data) return null;
          return (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {data.description}
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.highlights.map((highlight, i) => (
                  <li
                    key={`highlight-${i}`}
                    className="flex items-start gap-2 text-sm"
                  >
                    <CheckCircle2 className="size-4 mt-0.5 text-emerald-500 shrink-0" />
                    <span className="text-foreground/80">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        },
        actions: () => [
          {
            id: "edit-description",
            label: "Modifier la description",
            onClick: async () => {
              /* ouvrir le formulaire d'édition */
            },
          },
        ],
      }),
    ],

    /* ── Onglets ── */
    tabs: [
      /* Onglet : Facturation */
      {
        id: "billing",
        title: "Facturation",
        icon: <CreditCard className="size-4" />,
        loadingStrategy: "lazy",
        sections: [
          createTableSection<InvoiceRow>({
            id: "invoices-table",
            title: "Historique des factures",
            description: "Dernières factures émises",
            columns: invoiceColumns,
            enableQuickSearch: true,
            enableSorting: true,
            initialPageSize: 5,
            testId: "section-invoices-table",
            load: async ({ abortSignal }) => {
              await wait(400);
              if (abortSignal.aborted)
                throw new DOMException("Aborted", "AbortError");
              return fakeInvoices;
            },
            actions: () => [
              {
                id: "export-invoices",
                label: "Exporter",
                tone: "secondary",
                onClick: async () => {
                  /* déclencher l'export CSV */
                },
              },
            ],
          }),
        ],
      },

      /* Onglet : Équipe */
      {
        id: "team",
        title: "Équipe",
        icon: <Users className="size-4" />,
        loadingStrategy: "lazy",
        sections: [
          createTableSection<TeamMemberRow>({
            id: "team-table",
            title: "Membres de l'équipe",
            description: `${fakeTeamMembers.length} membres`,
            columns: teamColumns,
            enableQuickSearch: true,
            enableSorting: true,
            initialPageSize: 10,
            testId: "section-team-table",
            load: async ({ abortSignal }) => {
              await wait(300);
              if (abortSignal.aborted)
                throw new DOMException("Aborted", "AbortError");
              return fakeTeamMembers;
            },
            actions: () => [
              {
                id: "invite-member",
                label: "Inviter",
                tone: "primary",
                onClick: async () => {
                  /* ouvrir le formulaire d'invitation */
                },
              },
            ],
          }),
          createListSection({
            id: "team-roles-list",
            title: "Répartition par rôle",
            testId: "section-team-roles",
            groupBy: (item) => String(item.role ?? "other"),
            select: () =>
              fakeTeamMembers.map((member) => ({
                id: member.id,
                title: member.name,
                subtitle: member.email,
                role: member.role,
                tone:
                  member.role === "admin"
                    ? ("danger" as const)
                    : member.role === "editor"
                      ? ("info" as const)
                      : ("default" as const),
              })),
          }),
        ],
      },

      /* Onglet : Activité */
      {
        id: "activity",
        title: "Activité",
        icon: <Bell className="size-4" />,
        loadingStrategy: "lazy",
        sections: [
          createTimelineSection({
            id: "activity-timeline",
            title: "Chronologie d'activité",
            description: "Événements récents du projet",
            testId: "section-activity-timeline",
            load: async ({ abortSignal }) => {
              await wait(250);
              if (abortSignal.aborted)
                throw new DOMException("Aborted", "AbortError");
              return fakeTimeline;
            },
          }),
        ],
      },

      /* Onglet : Documents */
      {
        id: "documents",
        title: "Documents",
        icon: <Tag className="size-4" />,
        loadingStrategy: "lazy",
        sections: [
          createAttachmentsSection({
            id: "project-files",
            title: "Fichiers du projet",
            description: `${fakeFiles.length} fichiers`,
            testId: "section-project-files",
            onUpload: async () => {
              /* déclencher le dialogue d'upload */
            },
            onDownload: async (file) => {
              console.log(`Downloading ${file.name}...`);
            },
            onDelete: async (file) => {
              console.log(`Deleting ${file.name}...`);
            },
            load: async ({ abortSignal }) => {
              await wait(300);
              if (abortSignal.aborted)
                throw new DOMException("Aborted", "AbortError");
              return fakeFiles;
            },
          }),
        ],
      },

      /* Onglet : Intégrations */
      {
        id: "integrations",
        title: "Intégrations",
        icon: <Zap className="size-4" />,
        loadingStrategy: "lazy",
        sections: [
          createListSection({
            id: "integrations-list",
            title: "Services connectés",
            description: "Intégrations actives et disponibles",
            testId: "section-integrations",
            groupBy: (item) => String(item.category ?? "Autre"),
            select: () => [
              {
                id: "int-1",
                title: "Slack",
                subtitle: "Notifications en temps réel",
                category: "Communication",
                tone: "success" as const,
              },
              {
                id: "int-2",
                title: "PagerDuty",
                subtitle: "Alertes d'incidents critiques",
                category: "Communication",
                tone: "success" as const,
              },
              {
                id: "int-3",
                title: "GitHub",
                subtitle: "Synchronisation des dépôts",
                category: "Développement",
                tone: "success" as const,
              },
              {
                id: "int-4",
                title: "Jira",
                subtitle: "Suivi des tickets",
                category: "Développement",
                tone: "info" as const,
              },
              {
                id: "int-5",
                title: "Datadog",
                subtitle: "Monitoring d'infrastructure",
                category: "Observabilité",
                tone: "success" as const,
              },
              {
                id: "int-6",
                title: "Grafana",
                subtitle: "Tableaux de bord personnalisés",
                category: "Observabilité",
                tone: "warning" as const,
              },
              {
                id: "int-7",
                title: "Stripe",
                subtitle: "Paiements et facturation",
                category: "Finance",
                tone: "success" as const,
              },
              {
                id: "int-8",
                title: "QuickBooks",
                subtitle: "Comptabilité",
                category: "Finance",
                tone: "default" as const,
              },
            ],
            actions: () => [
              {
                id: "add-integration",
                label: "Ajouter une intégration",
                tone: "primary",
                onClick: async () => {
                  /* ouvrir le catalogue d'intégrations */
                },
              },
            ],
          }),
        ],
      },

      /* Onglet : Paramètres */
      {
        id: "settings",
        title: "Paramètres",
        icon: <Shield className="size-4" />,
        loadingStrategy: "lazy",
        sections: [
          createSettingsSection({
            id: "project-settings",
            title: "Configuration avancée",
            description: "Paramètres de sécurité, réseau et cycle de vie",
            testId: "section-project-settings",
            select: (ctx) => {
              const project = ctx.entity as ProjectEntity | undefined;
              if (!project) return { groups: [], destructiveActions: [] };
              return {
                groups: [
                  {
                    id: "group-security",
                    title: "Sécurité & Authentification",
                    description: "Contrôles d'accès et méthodes de connexion",
                    icon: <Shield className="size-3.5" />,
                    fields: [
                      {
                        id: "set-2fa",
                        label: "Authentification 2FA",
                        kind: "boolean" as const,
                        value: project.twoFactorEnforced,
                        format: {
                          boolean: {
                            trueLabel: "Activée (obligatoire)",
                            falseLabel: "Désactivée",
                          },
                        },
                      },
                      {
                        id: "set-sso",
                        label: "Fournisseur SSO",
                        kind: "text" as const,
                        value: project.ssoProvider,
                        emptyText: "Aucun fournisseur configuré",
                      },
                      {
                        id: "set-webhooks",
                        label: "Webhooks",
                        kind: "boolean" as const,
                        value: project.webhooksEnabled,
                        format: {
                          boolean: {
                            trueLabel: "Activés",
                            falseLabel: "Désactivés",
                          },
                        },
                      },
                    ],
                  },
                  {
                    id: "group-resources",
                    title: "Ressources & Limites",
                    description: "Quotas de stockage et d'utilisation",
                    icon: <BarChart3 className="size-3.5" />,
                    fields: [
                      {
                        id: "set-storage-used",
                        label: "Stockage utilisé",
                        kind: "bytes" as const,
                        value: project.storageUsedBytes,
                        format: { bytes: { base: 1024, precision: 1 } },
                      },
                      {
                        id: "set-storage-limit",
                        label: "Limite de stockage",
                        kind: "bytes" as const,
                        value: project.storageLimitBytes,
                        format: { bytes: { base: 1024, precision: 0 } },
                      },
                      {
                        id: "set-seats-used",
                        label: "Licences utilisées",
                        kind: "number" as const,
                        value: project.activeUsers,
                      },
                      {
                        id: "set-seats-total",
                        label: "Total des licences",
                        kind: "number" as const,
                        value: project.totalSeats,
                      },
                      {
                        id: "set-api-limit",
                        label: "Limite d'appels API",
                        kind: "number" as const,
                        value: project.apiCallsLimit,
                        format: { number: { compact: true } },
                      },
                    ],
                  },
                  {
                    id: "group-network",
                    title: "Réseau & DNS",
                    description: "Configuration du domaine et de la région",
                    icon: <Globe className="size-3.5" />,
                    fields: [
                      {
                        id: "set-domain",
                        label: "Domaine personnalisé",
                        kind: "url" as const,
                        value: `https://${project.domain}`,
                        link: {
                          href: `https://${project.domain}`,
                          external: true,
                        },
                      },
                      {
                        id: "set-region",
                        label: "Région de déploiement",
                        kind: "text" as const,
                        value: project.region,
                      },
                    ],
                  },
                ],
                destructiveActions: [
                  {
                    id: "archive-project",
                    label: "Archiver le projet",
                    confirmTitle: "Archiver ce projet ?",
                    confirmDescription:
                      "Le projet sera désactivé et toutes les données seront préservées. Vous pourrez le réactiver à tout moment.",
                    onConfirm: async () => {
                      console.log("Project archived");
                    },
                  },
                  {
                    id: "delete-project",
                    label: "Supprimer définitivement",
                    confirmTitle: "Supprimer ce projet ?",
                    confirmDescription:
                      "Cette action est irréversible. Toutes les données, fichiers et configurations seront définitivement supprimés.",
                    onConfirm: async () => {
                      console.log("Project deleted");
                    },
                  },
                ],
              };
            },
          }),
        ],
      },
    ],
  };
}

/* ─────────────────────────────────────────────────── */
/*  Composant de page                                  */
/* ─────────────────────────────────────────────────── */

/** Page d'exemple complète démontrant le système DynamicDetail. */
export default function ExampleDetailsPage() {
  const schema = React.useMemo(() => buildExampleSchema(), []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <DynamicDetail
          schema={schema}
          runtime={{
            entityId: fakeProject.id,
            entity: fakeProject,
            locale: "fr-FR",
            timezone: "Europe/Paris",
            permissions: [
              "project.view",
              "project.edit",
              "project.delete",
              "billing.view_invoice",
              "team.view_members",
              "team.invite",
              "settings.manage",
            ],
          }}
          className="space-y-6"
        />
      </div>
    </div>
  );
}
