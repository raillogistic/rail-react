import type React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import { cn } from "@/lib/utils";
import type { SectionActionTone } from "./sectionTypes";

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
  actions?: SectionFrameAction[];
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  testId?: string;
  children: React.ReactNode;
};

function toneToVariant(
  tone: SectionActionTone | undefined,
): "default" | "outline" | "destructive" {
  if (tone === "danger") return "destructive";
  if (tone === "primary") return "default";
  return "outline";
}

export default function SectionFrame({
  title,
  description,
  actions = [],
  disabled = false,
  disabledReason,
  className,
  headingLevel = 3,
  testId,
  children,
}: SectionFrameProps) {
  const HeadingTag = `h${headingLevel}` as keyof JSX.IntrinsicElements;

  return (
    <Card
      data-testid={testId}
      className={cn("relative gap-0 py-0", disabled ? "opacity-80" : "", className)}
    >
      {(title || description || actions.length > 0) && (
        <CardHeader className="border-b px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
              {title ? (
                <CardTitle>
                  <HeadingTag className="text-sm font-semibold">{title}</HeadingTag>
                </CardTitle>
              ) : null}
              {description ? <CardDescription>{description}</CardDescription> : null}
            </div>
            {actions.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {actions.map((action) => (
                  <Button
                    key={action.id}
                    type="button"
                    size="sm"
                    variant={toneToVariant(action.tone)}
                    aria-label={action.ariaLabel ?? action.label}
                    disabled={Boolean(action.disabled)}
                    title={action.disabledReason}
                    onClick={() => {
                      void action.onClick();
                    }}
                  >
                    {action.icon}
                    <span className={action.icon ? "ml-1" : ""}>{action.label}</span>
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        </CardHeader>
      )}
      <CardContent className="relative px-4 py-4">{children}</CardContent>
      {disabled ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            {disabledReason || "This section is currently unavailable."}
          </p>
        </div>
      ) : null}
    </Card>
  );
}
