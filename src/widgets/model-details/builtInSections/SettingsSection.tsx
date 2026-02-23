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
import { ChevronDown, ShieldAlert, Settings2, Sparkles, Sliders, AlertTriangle } from "lucide-react";
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

function resolveSettingsData(data: SettingsSectionData | undefined): {
  groups: SettingsGroup[];
  destructiveActions: SettingsDestructiveAction[];
} {
  if (!data) return { groups: [], destructiveActions: [] };
  if (Array.isArray(data)) return { groups: data, destructiveActions: [] };
  return {
    groups: Array.isArray(data.groups) ? data.groups : [],
    destructiveActions: Array.isArray(data.destructiveActions) ? data.destructiveActions : [],
  };
}

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
          className="h-9 px-4 text-xs font-bold gap-2 text-rose-500 border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
        >
          {action.icon || <ShieldAlert className="size-3.5" />}
          {action.label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl border-border/40 shadow-2xl backdrop-blur-md">
        <AlertDialogHeader>
          <div className="mx-auto size-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="size-6 text-rose-500" />
          </div>
          <AlertDialogTitle className="text-xl font-black text-center">
            {action.confirmTitle ?? "Confirm destructive action"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center font-medium">
            {action.confirmDescription ??
              "This operation cannot be undone. Please confirm to continue."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-3 mt-4">
          <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-10 px-6">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-xl bg-rose-500 hover:bg-rose-600 font-bold uppercase tracking-widest text-[10px] h-10 px-6 shadow-lg shadow-rose-500/20"
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {groups.map((group, idx) => (
          <Collapsible
            key={group.id}
            open={openMap[group.id] ?? false}
            onOpenChange={(open) =>
              setOpenMap((current) => ({ ...current, [group.id]: open }))
            }
            className={cn(
              "rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm transition-all overflow-hidden",
              (openMap[group.id] ?? false) ? "shadow-md ring-1 ring-primary/10 border-primary/20" : "hover:border-primary/20 hover:shadow-sm"
            )}
          >
            <CollapsibleTrigger className="group flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/30">
              <div className="flex items-center gap-4 min-w-0">
                <div className={cn(
                  "p-2.5 rounded-xl transition-all shadow-sm",
                  (openMap[group.id] ?? false) ? "bg-primary text-primary-foreground scale-110" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                  {group.icon || (idx === 0 ? <Sparkles className="size-4" /> : idx === 1 ? <Sliders className="size-4" /> : <Settings2 className="size-4" />)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black tracking-tight leading-none group-hover:text-primary transition-colors">
                    {group.title}
                  </div>
                  {group.description && (
                    <div className="text-[10px] text-muted-foreground font-medium mt-1.5 uppercase tracking-widest opacity-70">
                      {group.description}
                    </div>
                  )}
                </div>
              </div>
              <div className={cn(
                "size-8 rounded-full border flex items-center justify-center transition-all",
                (openMap[group.id] ?? false) ? "rotate-180 bg-primary/5 border-primary/20 text-primary" : "text-muted-foreground border-border/40"
              )}>
                <ChevronDown className="size-4" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="animate-in slide-in-from-top-2 duration-300">
              <div className="p-6 border-t border-border/40 bg-muted/10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {group.fields.map((field, index) => (
                    <UnitFieldRenderer
                      key={field.id ?? `${group.id}-field-${index}`}
                      field={field}
                      mode="labelValue"
                      density="normal"
                      className="transition-all hover:translate-x-1"
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
        <div className="mt-8 pt-6 border-t border-dashed border-rose-500/20">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="size-4 text-rose-500" />
            <h4 className="text-xs font-black uppercase tracking-widest text-rose-500">Danger Zone</h4>
          </div>
          <div className="flex flex-wrap items-center gap-3 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10">
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

export function createSettingsSection(config: SettingsSectionConfig): SectionDefinition<SettingsSectionData> {
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
