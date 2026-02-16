import * as React from "react";
import { Button } from "@/lib/components/ui/button";
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
} from "@/lib/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/lib/components/ui/collapsible";
import UnitFieldRenderer from "../units/UnitFieldRenderer";
import type { UnitFieldInput } from "../units/unitFieldTypes";
import type { SectionDefinition, SectionRuntimeCtx } from "../sectionTypes";

export type SettingsGroup = {
  id: string;
  title: string;
  description?: string;
  fields: UnitFieldInput[];
};

export type SettingsDestructiveAction = {
  id: string;
  label: string;
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
        <Button type="button" variant="destructive" size="sm">
          {action.label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action.confirmTitle ?? "Confirm destructive action"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {action.confirmDescription ??
              "This operation cannot be undone. Please confirm to continue."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              void execute();
            }}
          >
            Continue
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
    <div className="space-y-3">
      {groups.map((group) => (
        <Collapsible
          key={group.id}
          open={openMap[group.id] ?? false}
          onOpenChange={(open) =>
            setOpenMap((current) => ({ ...current, [group.id]: open }))
          }
          className="rounded-md border"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-left">
            <div>
              <div className="text-sm font-medium">{group.title}</div>
              {group.description ? (
                <div className="text-xs text-muted-foreground">{group.description}</div>
              ) : null}
            </div>
            <span className="text-xs text-muted-foreground">
              {(openMap[group.id] ?? false) ? "Hide" : "Show"}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 border-t px-3 py-3">
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
          </CollapsibleContent>
        </Collapsible>
      ))}
      {destructiveActions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          {destructiveActions.map((action) => (
            <DestructiveActionButton
              key={action.id}
              action={action}
              runtime={runtime}
              confirmDestructive={confirmDestructive}
            />
          ))}
        </div>
      ) : null}
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
