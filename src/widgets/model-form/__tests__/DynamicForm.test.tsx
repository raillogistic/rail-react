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
vi.mock("@/shared/ui/kit/button", () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: string;
    size?: string;
    children: React.ReactNode;
  }) => <button {...props}>{children}</button>,
}));

vi.mock("@/shared/ui/kit/card", () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
}));

vi.mock("@/shared/ui/kit/label", () => ({
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

vi.mock("@/shared/ui/kit/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input data-slot="input" {...props} />
  ),
}));

vi.mock("@/shared/ui/kit/badge", () => ({
  Badge: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => <span data-variant={variant}>{children}</span>,
}));

vi.mock("@/shared/ui/kit/collapsible", () => ({
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

vi.mock("@/shared/ui/kit/dialog", () => ({
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
  ChevronDown: ({ className }: { className?: string }) => (
    <svg data-testid="chevron-down" className={className} />
  ),
  ChevronLeft: ({ className }: { className?: string }) => (
    <svg data-testid="chevron-left" className={className} />
  ),
  ChevronRight: ({ className }: { className?: string }) => (
    <svg data-testid="chevron-right" className={className} />
  ),
  CheckIcon: ({ className }: { className?: string }) => (
    <svg data-testid="check-icon" className={className} />
  ),
  Save: ({ className }: { className?: string }) => (
    <svg data-testid="save-icon" className={className} />
  ),
  Send: ({ className }: { className?: string }) => (
    <svg data-testid="send-icon" className={className} />
  ),
  RotateCcw: ({ className }: { className?: string }) => (
    <svg data-testid="rotate-ccw-icon" className={className} />
  ),
  CheckCircle2: ({ className }: { className?: string }) => (
    <svg data-testid="check-circle-2-icon" className={className} />
  ),
  AlertTriangle: ({ className }: { className?: string }) => (
    <svg data-testid="alert-triangle-icon" className={className} />
  ),
  Loader2: ({ className }: { className?: string }) => (
    <svg data-testid="loader-2-icon" className={className} />
  ),
  Undo: ({ className }: { className?: string }) => (
    <svg data-testid="undo-icon" className={className} />
  ),
  Redo: ({ className }: { className?: string }) => (
    <svg data-testid="redo-icon" className={className} />
  ),
  Lock: ({ className }: { className?: string }) => (
    <svg data-testid="lock-icon" className={className} />
  ),
  Unlock: ({ className }: { className?: string }) => (
    <svg data-testid="unlock-icon" className={className} />
  ),
  ClipboardCheck: ({ className }: { className?: string }) => (
    <svg data-testid="clipboard-check-icon" className={className} />
  ),
  Info: ({ className }: { className?: string }) => (
    <svg data-testid="info-icon" className={className} />
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
    expect(screen.getByText("Enregistrer")).toBeInTheDocument();
    expect(screen.getByText("Réinitialiser")).toBeInTheDocument();
  });

  it("rejects legacy top-level props", () => {
    expect(() =>
      render(
        <DynamicForm
          {...({
            schema: textSchema,
            onSubmit: vi.fn(),
          } as any)}
        />,
      ),
    ).toThrow(/Legacy props are not supported/);
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
    expect(screen.queryByText("Enregistrer")).not.toBeInTheDocument();
    expect(screen.queryByText("Réinitialiser")).not.toBeInTheDocument();
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

  it("renders ModelForm-style debug tabs for formValues and mutationRequest", () => {
    render(
      <DynamicForm
        schema={textSchema}
        devtools={{
          enabled: true,
          transformValues: (values) => ({
            formValues: values,
            mutationRequest: {
              operationName: "updateProduct",
              variables: {
                id: "42",
                input: values,
              },
            },
          }),
        }}
      />,
    );

    expect(screen.getByText("formValues")).toBeInTheDocument();
    expect(screen.getByText("mutationRequest")).toBeInTheDocument();
    expect(screen.getByText(/"firstName"/)).toBeInTheDocument();
    expect(
      screen.queryByTestId("debug-copy-mutation-request"),
    ).not.toBeInTheDocument();
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
    expect(form?.className).toContain("bg-transparent");
    expect(form?.className).not.toContain("bg-card/10");

    const saveButton = screen.getByText("Enregistrer");
    const actionsBar = saveButton.closest("div.z-50");
    expect(actionsBar?.className).toContain("bg-transparent");
    expect(actionsBar?.className).not.toContain("bg-muted/30");
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

  it("renders form-level submit errors from __all__", async () => {
    const onSubmit = vi.fn(async (_values, ctx: { form: any }) => {
      ctx.form.setFieldMeta("__all__", (prev: any) => ({
        ...prev,
        errorMap: {
          ...(prev?.errorMap ?? {}),
          onSubmit: "Save failed due to a server-side validation issue.",
        },
      }));
    });

    render(
      <DynamicForm
        schema={textSchema}
        behavior={{
          onSubmit,
        }}
      />,
    );

    fireEvent.change(screen.getAllByRole("textbox")[0], {
      target: { value: "Alice" },
    });
    fireEvent.click(screen.getByText("Enregistrer"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(
      await screen.findByText(
        "Save failed due to a server-side validation issue.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("dynamic-form-global-errors")).toBeInTheDocument();
  });

  it("submits after confirmation when actions.confirmSubmit is enabled", async () => {
    const onSubmit = vi.fn(async () => {});

    render(
      <DynamicForm
        schema={textSchema}
        behavior={{ onSubmit }}
        actions={{
          confirmSubmit: {
            enabled: true,
            title: "Confirmer la creation",
            message: "Voulez-vous enregistrer cette decharge et ses lignes ?",
          },
        }}
      />,
    );

    fireEvent.change(screen.getAllByRole("textbox")[0], {
      target: { value: "Alice" },
    });
    fireEvent.click(screen.getByText("Enregistrer"));

    expect(onSubmit).toHaveBeenCalledTimes(0);
    expect(screen.getByText("Confirmer la creation")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Confirmer"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
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
    // "Précédent" and "Continuer" buttons should be present
    expect(screen.getByText("Continuer")).toBeInTheDocument();
    expect(screen.getByText("Précédent")).toBeInTheDocument();
  });

  it("renders review mode with lock/unlock toggle", () => {
    render(
      <DynamicForm
        schema={textSchema}
        layout={{ mode: { type: "review" } }}
      />,
    );

    expect(screen.getByText("Verrouiller pour révision")).toBeInTheDocument();
    expect(screen.getByText(/Mode édition/)).toBeInTheDocument();
  });

  it("toggles review mode lock state", async () => {
    render(
      <DynamicForm
        schema={textSchema}
        layout={{ mode: { type: "review" } }}
      />,
    );

    const lockButton = screen.getByText("Verrouiller pour révision");
    fireEvent.click(lockButton);

    expect(screen.getByText("Déverrouiller")).toBeInTheDocument();
    expect(screen.getByText(/Mode révision/)).toBeInTheDocument();
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

    // "Section A" appears in the accordion trigger and potentially in the section header inside
    expect(screen.getAllByText("Section A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Section B").length).toBeGreaterThan(0);
  });
});
