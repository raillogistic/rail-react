import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ActionDialog,
  PrintDialog,
} from "../ModelTableOverlays";

const dynamicFormSpy = vi.hoisted(() => vi.fn());

vi.mock("@/shared/ui/kit/dialog", () => ({
  Dialog: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open?: boolean;
  }) => (open ? <div>{children}</div> : null),
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
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/shared/ui/kit/drawer", () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

vi.mock("@/shared/ui/kit/button", () => ({
  Button: ({
    children,
    onClick,
    type,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
  }) => (
    <button type={type ?? "button"} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("@/widgets/model-form/inputs/form", () => ({
  default: (props: {
    behavior?: {
      onSubmit?: (values: Record<string, unknown>) => void;
    };
    actions?: {
      submitLabel?: string;
      resetLabel?: string;
    };
  }) => {
    dynamicFormSpy(props);
    return (
      <div>
        <button
          type="button"
          onClick={() => props.behavior?.onSubmit?.({ notes: "client-data" })}
        >
          fake-submit
        </button>
        <span>{props.actions?.submitLabel ?? "missing-submit-label"}</span>
        <span>{props.actions?.resetLabel ?? "missing-reset-label"}</span>
      </div>
    );
  },
}));

describe("ModelTableOverlays dialogs", () => {
  it("PrintDialog wires DynamicForm submit through behavior.onSubmit", () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(
      <PrintDialog
        open
        title="Template Parameters"
        schema={{ fields: [{ name: "notes", type: "text" }] }}
        submitLabel="Generate"
        cancelLabel="Cancel"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "fake-submit" }));
    expect(onSubmit).toHaveBeenCalledWith({ notes: "client-data" });
    expect(screen.getByText("Generate")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("ActionDialog form mode wires DynamicForm submit through behavior.onSubmit", () => {
    const onExecute = vi.fn();
    const onCancel = vi.fn();

    render(
      <ActionDialog
        open
        mode="form"
        actionMeta={{
          name: "publishOrder",
          operation: "update",
          allowed: true,
          requiredPermissions: [],
          action: {
            submit_label: "Execute",
          },
        }}
        schema={{ fields: [{ name: "reason", type: "text" }] }}
        defaults={{ reason: "Initial" }}
        submitting={false}
        onCancel={onCancel}
        onExecute={onExecute}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "fake-submit" }));
    expect(onExecute).toHaveBeenCalledWith({ notes: "client-data" });
    expect(screen.getByText("Execute")).toBeInTheDocument();
  });
});
