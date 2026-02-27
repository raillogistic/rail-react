/**
 * @module SectionFrame
 * @description Composant cadre pour les sections de détail.
 * Fournit un conteneur de type carte avec titre, description,
 * icône et actions intégrées.
 */
import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/kit/card";
import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/utils";
import type { SectionActionTone } from "./sectionTypes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/kit/tooltip";
import { AlertTriangle, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";

export type SectionFrameAction = {
  id: string;
  label?: string;
  icon?: React.ReactNode;
  tone?: SectionActionTone;
  ariaLabel?: string;
  disabled?: boolean;
  disabledReason?: string;
  onClick?: () => void | Promise<void>;
  render?: React.ReactNode;
};

export type SectionFrameProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: SectionFrameAction[];
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  testId?: string;
  children: React.ReactNode;
};

/**
 * Convertit un ton d'action en variante de bouton.
 */
function toneToVariant(
  tone: SectionActionTone | undefined,
): "default" | "outline" | "destructive" | "secondary" | "ghost" | "link" {
  if (tone === "danger") return "destructive";
  if (tone === "primary") return "default";
  if (tone === "secondary") return "secondary";
  if (tone === "ghost") return "ghost";
  if (tone === "link") return "link";
  return "outline";
}

/**
 * Résout une classe CSS personnalisée pour les tons spéciaux.
 */
function toneToClassName(
  tone: SectionActionTone | undefined,
): string | undefined {
  if (tone === "success") {
    return "border-emerald-500/20 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30";
  }
  if (tone === "warning") {
    return "border-amber-500/20 text-amber-600 bg-amber-500/5 hover:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30";
  }
  if (tone === "info") {
    return "border-sky-500/20 text-sky-600 bg-sky-500/5 hover:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30";
  }
  return undefined;
}

/**
 * Composant cadre de section.
 * Encapsule le contenu dans une carte élégante avec en-tête,
 * icône optionnelle et barre d'actions.
 */
export default function SectionFrame({
  title,
  description,
  icon,
  actions = [],
  disabled = false,
  disabledReason,
  className,
  contentClassName,
  headerClassName,
  headingLevel = 3,
  testId,
  children,
}: SectionFrameProps) {
  const hasContent = React.Children.count(children) > 0;
  const HeadingTag = `h${headingLevel}` as keyof React.JSX.IntrinsicElements;

  const renderedActions = actions.filter((action) => action.render);
  const buttonActions = actions.filter((action) => !action.render);
  const primaryActions = buttonActions.slice(0, 2);
  const overflowActions = buttonActions.slice(2);

  return (
    <TooltipProvider delayDuration={300}>
      <Card
        data-testid={testId}
        className={cn(
          "group/frame relative overflow-hidden transition-all duration-300 ease-out",
          "border-border/30 bg-card shadow-sm",
          "hover:shadow-md hover:border-border/50",
          disabled && "opacity-60 pointer-events-none select-none",
          className,
        )}
      >
        {/* Bande d'accent supérieure subtile */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover/frame:opacity-100 transition-opacity duration-500" />

        {(title || description || actions.length > 0) && (
          <CardHeader
            className={cn(
              "px-6 py-5 border-b border-border/10",
              headerClassName,
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Titre et icône */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {icon && (
                  <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary shrink-0 transition-all duration-300 group-hover/frame:bg-primary/15 group-hover/frame:scale-105">
                    {icon}
                  </div>
                )}
                <div className="space-y-1 min-w-0">
                  {title ? (
                    <CardTitle className="flex items-center gap-2">
                      <HeadingTag className="text-[15px] font-semibold tracking-tight text-foreground truncate">
                        {title}
                      </HeadingTag>
                      {disabled && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="p-1 rounded-md bg-amber-500/10 text-amber-500 cursor-help">
                              <AlertTriangle className="size-3.5" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="text-xs font-medium"
                          >
                            {disabledReason || "Restricted Section"}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </CardTitle>
                  ) : null}
                  {description ? (
                    <CardDescription className="text-xs text-muted-foreground/70 leading-relaxed truncate max-w-lg">
                      {description}
                    </CardDescription>
                  ) : null}
                </div>
              </div>

              {/* Actions */}
              {actions.length > 0 ? (
                <div className="flex items-center gap-2">
                  {renderedActions.map((action) => (
                    <div
                      key={action.id}
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      {action.render}
                    </div>
                  ))}
                  <div className="hidden sm:flex items-center gap-1.5">
                    {primaryActions.map((action) => (
                      <Button
                        key={action.id}
                        type="button"
                        size="sm"
                        variant={toneToVariant(action.tone)}
                        aria-label={action.ariaLabel ?? action.label}
                        disabled={Boolean(action.disabled)}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void action.onClick?.();
                        }}
                        className={cn(
                          "h-8 px-3.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97]",
                          toneToClassName(action.tone),
                        )}
                      >
                        {action.icon && (
                          <span className="mr-1.5 size-3.5 shrink-0">
                            {action.icon}
                          </span>
                        )}
                        {action.label}
                      </Button>
                    ))}
                  </div>

                  {overflowActions.length > 0 ||
                  primaryActions.length < buttonActions.length ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-52 p-1.5 rounded-xl shadow-xl border-border/50"
                      >
                        {/* Actions primaires sur mobile */}
                        <div className="sm:hidden border-b border-border/10 mb-1 pb-1">
                          {primaryActions.map((action) => (
                            <DropdownMenuItem
                              key={action.id}
                              disabled={Boolean(action.disabled)}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                void action.onClick?.();
                              }}
                              className="rounded-md text-[13px] font-medium gap-2 px-2.5 py-2 focus:bg-accent"
                            >
                              {action.icon && (
                                <span className="size-3.5 opacity-70">
                                  {action.icon}
                                </span>
                              )}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </div>
                        {overflowActions.map((action) => (
                          <DropdownMenuItem
                            key={action.id}
                            disabled={Boolean(action.disabled)}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              void action.onClick?.();
                            }}
                            className="rounded-md text-[13px] font-medium gap-2 px-2.5 py-2 focus:bg-accent"
                          >
                            {action.icon && (
                              <span className="size-3.5 opacity-70">
                                {action.icon}
                              </span>
                            )}
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              ) : null}
            </div>
          </CardHeader>
        )}

        {hasContent ? (
          <CardContent className={cn("px-6 py-6", contentClassName)}>
            {children}
          </CardContent>
        ) : null}

        {/* Overlay de section désactivée */}
        {disabled && (
          <div className="absolute inset-0 z-10 bg-background/5 border border-dashed border-amber-500/15 pointer-events-none rounded-[inherit]" />
        )}
      </Card>
    </TooltipProvider>
  );
}
