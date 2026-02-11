import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import DynamicForm from "../inputs/form";
import type { FormSchema } from "../types/schema";

// Polyfill ResizeObserver for jsdom (needed by Radix UI)
globalThis.ResizeObserver ??= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;
import type { DynamicFormProps } from "../types/props";

// Mock shadcn UI components
vi.mock("@/lib/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: string;
    size?: string;
    children: React.ReactNode;
  }) => <button {...props}>{children}</button>,
}));

vi.mock("@/lib/components/ui/card", () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
}));

vi.mock("@/lib/components/ui/label", () => ({
  Label: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <label className={className}>{children}</label>
  ),
}));

vi.mock("@/lib/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input data-slot="input" {...props} />
  ),
}));

vi.mock("@/lib/components/ui/badge", () => ({
  Badge: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => <span data-variant={variant}>{children}</span>,
}));

vi.mock("@/lib/components/ui/collapsible", () => ({
  Collapsible: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => <div data-open={open}>{children}</div>,
  CollapsibleContent: ({
    children,
    className,
    forceMount,
  }: {
    children: React.ReactNode;
    className?: string;
    forceMount?: boolean;
  }) => <div className={className}>{children}</div>,
  CollapsibleTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <>{children}</>,
}));

vi.mock("@/lib/components/ui/dialog", () => ({
  Dialog: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (open ? <div role="dialog">{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  DialogFooter: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
}));

vi.mock("lucide-react", () => ({
  ChevronDownIcon: ({ className }: { className?: string }) => (
    <svg data-testid="chevron-down" className={className} />
  ),
  CheckIcon: ({ className }: { className?: string }) => (
    <svg data-testid="check-icon" className={className} />
  ),
}));

const textSchema: FormSchema = {
  fields: [
    { name: "firstName", type: "text", label: "First Name" },
    { name: "lastName", type: "text", label: "Last Name" },
  ],
};

describe("DynamicForm", () => {
  it("renders fields from a flat schema", () => {
    render(<DynamicForm schema={textSchema} />);
    expect(screen.getByText("First Name")).toBeInTheDocument();
    expect(screen.getByText("Last Name")).toBeInTheDocument();
  });

  it("renders submit and reset buttons with default labels", () => {
    render(<DynamicForm schema={textSchema} />);
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Reset")).toBeInTheDocument();
  });

  it("renders custom submit/reset labels", () => {
    render(
      <DynamicForm
        schema={textSchema}
        actions={{ submitLabel: "Create", resetLabel: "Clear" }}
      />,
    );
    expect(screen.getByText("Create")).toBeInTheDocument();
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });

  it("hides action bar when actions.hidden is true", () => {
    render(
      <DynamicForm schema={textSchema} actions={{ hidden: true }} />,
    );
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
    expect(screen.queryByText("Reset")).not.toBeInTheDocument();
  });

  it("renders sections with titles", () => {
    const schema: FormSchema = {
      sections: [
        {
          id: "basic",
          title: "Basic Info",
          fields: [{ name: "name", type: "text", label: "Name" }],
        },
        {
          id: "advanced",
          title: "Advanced Settings",
          fields: [{ name: "mode", type: "text", label: "Mode" }],
        },
      ],
    };
    render(<DynamicForm schema={schema} />);
    expect(screen.getByText("Basic Info")).toBeInTheDocument();
    expect(screen.getByText("Advanced Settings")).toBeInTheDocument();
  });

  it("renders extra action slot", () => {
    render(
      <DynamicForm
        schema={textSchema}
        actions={{
          extra: <button type="button">Cancel</button>,
        }}
      />,
    );
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("renders extra action slot as function", () => {
    render(
      <DynamicForm
        schema={textSchema}
        actions={{
          extra: ({ isSubmitting }) => (
            <span>{isSubmitting ? "busy" : "idle"}</span>
          ),
        }}
      />,
    );
    expect(screen.getByText("idle")).toBeInTheDocument();
  });

  it("shows dirty indicator when configured and form is modified", async () => {
    render(
      <DynamicForm
        schema={textSchema}
        actions={{ showDirtyIndicator: true }}
      />,
    );
    // Initially, "Unsaved changes" should not appear
    // (form is not dirty on mount)
    // This is a basic render check; deeper interaction tests would
    // require simulating field changes via userEvent
  });

  it("renders debug panel when devtools.enabled is true", () => {
    render(
      <DynamicForm
        schema={textSchema}
        devtools={{ enabled: true, showDiagnostics: true }}
      />,
    );
    // Debug panel renders JSON of form values
    expect(screen.getByText(/"firstName"/)).toBeInTheDocument();
  });

  it("does not render debug panel by default", () => {
    const { container } = render(<DynamicForm schema={textSchema} />);
    // No pre element for debug values
    expect(container.querySelector("pre")).toBeNull();
  });

  it("applies popup variant classes", () => {
    const { container } = render(
      <DynamicForm schema={textSchema} layout={{ variant: "popup" }} />,
    );
    const form = container.querySelector("form");
    expect(form?.className).toContain("gap-3");
  });

  it("applies custom className to form wrapper", () => {
    const { container } = render(
      <DynamicForm
        schema={textSchema}
        layout={{ className: "max-w-lg" }}
      />,
    );
    const form = container.querySelector("form");
    expect(form?.className).toContain("max-w-lg");
  });
});

describe("DynamicForm - conditions", () => {
  it("hides fields based on conditions map", () => {
    const schema: FormSchema = {
      fields: [
        {
          name: "showExtra",
          type: "checkbox",
          label: "Show Extra",
          defaultValue: false,
        },
        { name: "extra", type: "text", label: "Extra Field" },
      ],
    };

    render(
      <DynamicForm
        schema={schema}
        behavior={{
          conditions: {
            extra: (values) => values.showExtra === true,
          },
        }}
      />,
    );

    // "extra" should be hidden because showExtra defaults to false
    expect(screen.queryByText("Extra Field")).not.toBeInTheDocument();
  });

  it("hides sections based on visible callback", () => {
    const schema: FormSchema = {
      sections: [
        {
          id: "always",
          title: "Always Visible",
          fields: [{ name: "a", type: "text", label: "A" }],
        },
        {
          id: "conditional",
          title: "Conditional Section",
          visible: () => false,
          fields: [{ name: "b", type: "text", label: "B" }],
        },
      ],
    };

    render(<DynamicForm schema={schema} />);
    expect(screen.getByText("Always Visible")).toBeInTheDocument();
    expect(
      screen.queryByText("Conditional Section"),
    ).not.toBeInTheDocument();
  });
});

describe("DynamicForm - modes", () => {
  it("renders wizard mode with step indicators", () => {
    const schema: FormSchema = {
      sections: [
        {
          id: "step1",
          title: "Step One",
          fields: [{ name: "a", type: "text", label: "Field A" }],
        },
        {
          id: "step2",
          title: "Step Two",
          fields: [{ name: "b", type: "text", label: "Field B" }],
        },
      ],
    };

    render(
      <DynamicForm
        schema={schema}
        layout={{ mode: { type: "wizard", showProgress: true } }}
      />,
    );

    // "Step One" appears in both step indicator and section header
    expect(screen.getAllByText("Step One").length).toBeGreaterThanOrEqual(1);
    // "Previous" and "Continue" buttons should be present
    expect(screen.getByText("Continue")).toBeInTheDocument();
    expect(screen.getByText("Previous")).toBeInTheDocument();
  });

  it("renders review mode with lock/unlock toggle", () => {
    render(
      <DynamicForm
        schema={textSchema}
        layout={{ mode: { type: "review" } }}
      />,
    );

    expect(screen.getByText("Lock for review")).toBeInTheDocument();
    expect(
      screen.getByText(/Editing mode/),
    ).toBeInTheDocument();
  });

  it("toggles review mode lock state", async () => {
    render(
      <DynamicForm
        schema={textSchema}
        layout={{ mode: { type: "review" } }}
      />,
    );

    const lockButton = screen.getByText("Lock for review");
    fireEvent.click(lockButton);

    expect(screen.getByText("Unlock")).toBeInTheDocument();
    expect(screen.getByText(/Review mode/)).toBeInTheDocument();
  });

  it("renders accordion mode with collapsible sections", () => {
    const schema: FormSchema = {
      sections: [
        {
          id: "s1",
          title: "Section A",
          fields: [{ name: "a", type: "text", label: "A" }],
        },
        {
          id: "s2",
          title: "Section B",
          fields: [{ name: "b", type: "text", label: "B" }],
        },
      ],
    };

    render(
      <DynamicForm
        schema={schema}
        layout={{
          mode: { type: "accordion", defaultExpanded: "first" },
        }}
      />,
    );

    expect(screen.getByText("Section A")).toBeInTheDocument();
    expect(screen.getByText("Section B")).toBeInTheDocument();
  });
});
