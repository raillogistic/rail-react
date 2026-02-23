import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/utils";
import type { SectionActionTone } from "./sectionTypes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/kit/tooltip";
import { Info, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";

export type SectionFrameAction = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  tone?: SectionActionTone;
  ariaLabel?: string;
  disabled?: boolean;
  disabledReason?: string;
  onClick: () => void | Promise<void>;
};

export type SectionFrameProps = {
  title?: string;
  description?: string;
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

function toneToClassName(tone: SectionActionTone | undefined): string | undefined {
  if (tone === "success") {
    return "border-emerald-500/30 text-emerald-700 bg-emerald-500/5 hover:bg-emerald-500/10 dark:text-emerald-400";
  }
  if (tone === "warning") {
    return "border-amber-500/30 text-amber-700 bg-amber-500/5 hover:bg-amber-500/10 dark:text-amber-400";
  }
  if (tone === "info") {
    return "border-blue-500/30 text-blue-700 bg-blue-500/5 hover:bg-blue-500/10 dark:text-blue-400";
  }
  return undefined;
}

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
  const HeadingTag = `h${headingLevel}` as keyof JSX.IntrinsicElements;
  
  // Separate primary actions (max 2) from overflow actions
  const primaryActions = actions.slice(0, 2);
  const overflowActions = actions.slice(2);

  return (
    <TooltipProvider delayDuration={400}>
      <Card
        data-testid={testId}
        className={cn(
          "group relative overflow-hidden transition-all duration-300",
          "border-border/40 bg-card/60 backdrop-blur-md shadow-sm",
          "hover:border-border/80 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5",
          disabled ? "opacity-75 grayscale-[0.3]" : "",
          className
        )}
      >
        {(title || description || actions.length > 0) && (
          <CardHeader 
            className={cn(
              "px-8 py-6 border-b border-border/10 bg-gradient-to-r from-muted/30 to-transparent",
              headerClassName
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {icon && (
                  <div className="flex items-center justify-center size-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 text-primary-foreground shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                    {icon}
                  </div>
                )}
                <div className="space-y-1.5 min-w-0">
                  {title ? (
                    <CardTitle className="flex items-center gap-2.5">
                      <HeadingTag className="text-lg font-black tracking-tight text-foreground/90 uppercase truncate">
                        {title}
                      </HeadingTag>
                      {disabled && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="p-1 rounded-full bg-amber-500/10 text-amber-500 cursor-help transition-colors hover:bg-amber-500/20">
                              <Info className="size-4" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-amber-600 text-white font-bold text-[10px] uppercase tracking-widest border-none shadow-xl">
                            <p>{disabledReason || "Restricted Section"}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </CardTitle>
                  ) : null}
                  {description ? (
                    <CardDescription className="text-xs font-bold text-muted-foreground/60 leading-relaxed truncate max-w-2xl tracking-tight">
                      {description}
                    </CardDescription>
                  ) : null}
                </div>
              </div>
              
              {actions.length > 0 ? (
                <div className="flex items-center gap-2.5">
                  <div className="hidden sm:flex items-center gap-2">
                    {primaryActions.map((action) => (
                      <Button
                        key={action.id}
                        type="button"
                        size="sm"
                        variant={toneToVariant(action.tone)}
                        aria-label={action.ariaLabel ?? action.label}
                        disabled={Boolean(action.disabled)}
                        onClick={() => {
                          void action.onClick();
                        }}
                        className={cn(
                          "h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all active:scale-95 hover:shadow-md",
                          toneToClassName(action.tone),
                        )}
                      >
                        {action.icon && <span className="mr-2 size-3.5 shrink-0 opacity-80">{action.icon}</span>}
                        {action.label}
                      </Button>
                    ))}
                  </div>

                  {overflowActions.length > 0 || primaryActions.length < actions.length ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-9 rounded-xl border border-border/20 bg-muted/20 hover:bg-muted/40 transition-all"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-border/40 backdrop-blur-xl">
                        {/* Mobile view of primary actions */}
                        <div className="sm:hidden border-b border-border/20 mb-1 pb-1">
                          {primaryActions.map((action) => (
                             <DropdownMenuItem
                               key={action.id}
                               disabled={Boolean(action.disabled)}
                               onClick={() => void action.onClick()}
                               className="rounded-lg font-black uppercase tracking-widest text-[9px] gap-2 p-2.5 focus:bg-primary/5"
                             >
                               {action.icon && <span className="size-3.5 opacity-60">{action.icon}</span>}
                               {action.label}
                             </DropdownMenuItem>
                          ))}
                        </div>
                        {overflowActions.map((action) => (
                          <DropdownMenuItem
                            key={action.id}
                            disabled={Boolean(action.disabled)}
                            onClick={() => void action.onClick()}
                            className="rounded-lg font-black uppercase tracking-widest text-[9px] gap-2 p-2.5 focus:bg-primary/5"
                          >
                            {action.icon && <span className="size-3.5 opacity-60">{action.icon}</span>}
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
        
        <CardContent className={cn("px-8 py-8", contentClassName)}>
          {children}
        </CardContent>

        {disabled && (
          <div className="absolute inset-0 z-10 bg-background/5 border-2 border-dashed border-amber-500/10 pointer-events-none rounded-2xl" />
        )}
      </Card>
    </TooltipProvider>
  );
}
