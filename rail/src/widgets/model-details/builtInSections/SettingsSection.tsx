/**
 * @module SettingsSection
 * @description Section de paramètres avec groupes pliables.
 * Supporte les champs de configuration, les actions destructives et les confirmations.
 */
import * as React from "react";
import { Button } from "@/shared/ui/kit/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/kit/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/kit/collapsible";
import UnitFieldRenderer from "../units/UnitFieldRenderer";
import type { UnitFieldInput } from "../units/unitFieldTypes";
import type { SectionDefinition, SectionRuntimeCtx } from "../sectionTypes";
import {
  ChevronDown,
  ShieldAlert,
  Settings2,
  Sparkles,
  Sliders,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/shared/utils";

export type SettingsGroup = {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  fields: UnitFieldInput[];
};

export type SettingsDestructiveAction = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  confirmTitle?: string;
  confirmDescription?: string;
  onConfirm: (ctx: { runtime: SectionRuntimeCtx }) => void | Promise<void>;
};

export type SettingsSectionData =
  | SettingsGroup[]
  | {
      groups: SettingsGroup[];
      destructiveActions?: SettingsDestructiveAction[];
    };

export type SettingsSectionConfig = {
  id: string;
  title?: string;
  description?: string;
  order?: number;
  loadingStrategy?: "eager" | "lazy";
  permissions?: string[];
  visibleIf?: (ctx: SectionRuntimeCtx) => boolean;
  disabledIf?: SectionDefinition<SettingsSectionData>["disabledIf"];
  select?: (ctx: SectionRuntimeCtx) => SettingsSectionData | undefined;
  load?: SectionDefinition<SettingsSectionData>["load"];
  actions?: SectionDefinition<SettingsSectionData>["actions"];
  confirmDestructive?: (ctx: {
    action: SettingsDestructiveAction;
    runtime: SectionRuntimeCtx;
  }) => boolean | Promise<boolean>;
  skeleton?: SectionDefinition<SettingsSectionData>["skeleton"];
  empty?: SectionDefinition<SettingsSectionData>["empty"];
  error?: SectionDefinition<SettingsSectionData>["error"];
  testId?: string;
};

/** Résout les données de la section en groupes et actions destructives. */
function resolveSettingsData(data: SettingsSectionData | undefined): {
  groups: SettingsGroup[];
  destructiveActions: SettingsDestructiveAction[];
} {
  if (!data) return { groups: [], destructiveActions: [] };
  if (Array.isArray(data)) return { groups: data, destructiveActions: [] };
  return {
    groups: Array.isArray(data.groups) ? data.groups : [],
    destructiveActions: Array.isArray(data.destructiveActions)
      ? data.destructiveActions
      : [],
  };
}

/** Bouton d'action destructive avec dialogue de confirmation. */
function DestructiveActionButton({
  action,
  runtime,
  confirmDestructive,
}: {
  action: SettingsDestructiveAction;
  runtime: SectionRuntimeCtx;
  confirmDestructive?: SettingsSectionConfig["confirmDestructive"];
}) {
  const execute = async () => {
    const allowed = confirmDestructive
      ? await confirmDestructive({ action, runtime })
      : true;
    if (!allowed) return;
    await action.onConfirm({ runtime });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-3.5 text-xs font-medium gap-1.5 text-rose-500 border-rose-500/25 hover:bg-rose-500 hover:text-white transition-all"
        >
          {action.icon || <ShieldAlert className="size-3.5" />}
          {action.label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-xl border-border/30 shadow-xl">
        <AlertDialogHeader>
          <div className="mx-auto size-10 rounded-full bg-rose-500/10 flex items-center justify-center mb-3">
            <AlertTriangle className="size-5 text-rose-500" />
          </div>
          <AlertDialogTitle className="text-base font-semibold text-center">
            {action.confirmTitle ?? "Confirm destructive action"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm">
            {action.confirmDescription ??
              "This operation cannot be undone. Please confirm to continue."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-2 mt-3">
          <AlertDialogCancel className="rounded-lg font-medium text-xs h-9 px-5">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-lg bg-rose-500 hover:bg-rose-600 font-medium text-xs h-9 px-5 shadow-md shadow-rose-500/15"
            onClick={() => {
              void execute();
            }}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Vue de la section de paramètres avec groupes pliables. */
function SettingsSectionView({
  groups,
  destructiveActions,
  runtime,
  confirmDestructive,
}: {
  groups: SettingsGroup[];
  destructiveActions: SettingsDestructiveAction[];
  runtime: SectionRuntimeCtx;
  confirmDestructive?: SettingsSectionConfig["confirmDestructive"];
}) {
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>(() =>
    groups.reduce<Record<string, boolean>>((acc, group, index) => {
      acc[group.id] = index === 0;
      return acc;
    }, {}),
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2.5">
        {groups.map((group, idx) => (
          <Collapsible
            key={group.id}
            open={openMap[group.id] ?? false}
            onOpenChange={(open) =>
              setOpenMap((current) => ({ ...current, [group.id]: open }))
            }
            className={cn(
              "rounded-lg border border-border/30 bg-card/20 transition-all overflow-hidden",
              (openMap[group.id] ?? false)
                ? "shadow-sm border-border/50"
                : "hover:border-border/40",
            )}
          >
            <CollapsibleTrigger className="group flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-muted/20">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    (openMap[group.id] ?? false)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/40 text-muted-foreground group-hover:bg-primary/8 group-hover:text-primary",
                  )}
                >
                  {group.icon ||
                    (idx === 0 ? (
                      <Sparkles className="size-3.5" />
                    ) : idx === 1 ? (
                      <Sliders className="size-3.5" />
                    ) : (
                      <Settings2 className="size-3.5" />
                    ))}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                    {group.title}
                  </div>
                  {group.description && (
                    <div className="text-xs text-muted-foreground/50 mt-1">
                      {group.description}
                    </div>
                  )}
                </div>
              </div>
              <div
                className={cn(
                  "size-6 rounded-md flex items-center justify-center transition-all",
                  (openMap[group.id] ?? false)
                    ? "rotate-180 text-primary"
                    : "text-muted-foreground/40",
                )}
              >
                <ChevronDown className="size-3.5" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="animate-in slide-in-from-top-1 duration-200">
              <div className="px-4 pb-4 pt-1 border-t border-border/20 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {group.fields.map((field, index) => (
                    <UnitFieldRenderer
                      key={field.id ?? `${group.id}-field-${index}`}
                      field={field}
                      mode="labelValue"
                      density="normal"
                      defaultLocale={runtime.locale}
                      defaultTimezone={runtime.timezone}
                    />
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      {destructiveActions.length > 0 && (
        <div className="mt-6 pt-5 border-t border-dashed border-rose-500/15">
          <div className="flex items-center gap-1.5 mb-3">
            <ShieldAlert className="size-3.5 text-rose-500" />
            <h4 className="text-xs font-semibold text-rose-500">Danger Zone</h4>
          </div>
          <div className="flex flex-wrap items-center gap-2 p-4 rounded-lg bg-rose-500/[0.03] border border-rose-500/10">
            {destructiveActions.map((action) => (
              <DestructiveActionButton
                key={action.id}
                action={action}
                runtime={runtime}
                confirmDestructive={confirmDestructive}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function createSettingsSection(
  config: SettingsSectionConfig,
): SectionDefinition<SettingsSectionData> {
  return {
    ...config,
    kind: "settings",
    dataSource: "computed",
    loadingStrategy: config.loadingStrategy ?? "lazy",
    render: ({ data, runtime }) => {
      const resolved = resolveSettingsData(data);
      return (
        <SettingsSectionView
          groups={resolved.groups}
          destructiveActions={resolved.destructiveActions}
          runtime={runtime}
          confirmDestructive={config.confirmDestructive}
        />
      );
    },
  };
}

export default createSettingsSection;
