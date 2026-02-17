import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import { cn } from "@/lib/utils";
import type { SectionActionTone } from "./sectionTypes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/lib/components/ui/tooltip";
import { Info } from "lucide-react";

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
): "default" | "outline" | "destructive" | "secondary" {
  if (tone === "danger") return "destructive";
  if (tone === "primary") return "default";
  if (tone === "secondary") return "secondary";
  return "outline";
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

  return (
    <TooltipProvider>
      <Card
        data-testid={testId}
        className={cn(
          "group relative overflow-hidden transition-all duration-200",
          "border-border/50 bg-card/50 backdrop-blur-sm",
          "hover:border-border hover:shadow-md",
          disabled ? "opacity-75 grayscale-[0.5]" : "",
          className
        )}
      >
        {(title || description || actions.length > 0) && (
          <CardHeader 
            className={cn(
              "px-6 py-4 border-b border-border/40 bg-muted/20",
              headerClassName
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {icon && (
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 transition-transform group-hover:scale-110">
                    {icon}
                  </div>
                )}
                <div className="space-y-1 min-w-0">
                  {title ? (
                    <CardTitle className="flex items-center gap-2">
                      <HeadingTag className="text-base font-bold tracking-tight truncate">
                        {title}
                      </HeadingTag>
                      {disabled && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="size-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{disabledReason || "This section is currently unavailable."}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </CardTitle>
                  ) : null}
                  {description ? (
                    <CardDescription className="text-xs font-medium leading-relaxed truncate max-w-2xl">
                      {description}
                    </CardDescription>
                  ) : null}
                </div>
              </div>
              
              {actions.length > 0 ? (
                <div className="flex items-center gap-2 ml-auto">
                  {actions.map((action) => (
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
                      className="h-8 px-3 text-xs font-semibold shadow-sm"
                    >
                      {action.icon && <span className="mr-1.5 size-3.5">{action.icon}</span>}
                      {action.label}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          </CardHeader>
        )}
        
        <CardContent className={cn("px-6 py-6", contentClassName)}>
          {children}
        </CardContent>

        {disabled && (
          <div className="absolute inset-0 z-10 bg-background/20 pointer-events-none" />
        )}
      </Card>
    </TooltipProvider>
  );
}
