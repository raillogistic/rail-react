/**
 * Mock Radix UI components for testing
 */

import React from "react";
import { vi } from "vitest";

// Mock Radix UI Popover
vi.mock("@radix-ui/react-popover", () => ({
  Root: ({ children }: any) => <div data-radix-popover-root>{children}</div>,
  Trigger: React.forwardRef(({ children, asChild, ...props }: any, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ref, ...props, "data-radix-popover-trigger": true } as any);
    }
    return (
      <button ref={ref} {...props} data-radix-popover-trigger>
        {children}
      </button>
    );
  }),
  Portal: ({ children }: any) => <div data-radix-popover-portal>{children}</div>,
  Content: React.forwardRef(({ children, sideOffset, align, side, ...props }: any, ref) => (
    <div ref={ref} {...props} data-radix-popover-content>
      {children}
    </div>
  )),
  Anchor: ({ children }: any) => <div data-radix-popover-anchor>{children}</div>,
  Close: ({ children, ...props }: any) => <button {...props} data-radix-popover-close>{children}</button>,
}));

// Mock Radix UI Select
vi.mock("@radix-ui/react-select", () => ({
  Root: ({ children, onValueChange, value }: any) => (
    <div data-radix-select-root data-value={value} onClick={() => onValueChange?.("mock")}>
      {children}
    </div>
  ),
  Trigger: React.forwardRef(({ children, ...props }: any, ref) => (
    <button ref={ref} {...props} role="combobox" data-radix-select-trigger>
      {children}
    </button>
  )),
  Value: ({ children, placeholder }: any) => (
    <span data-radix-select-value>{children || placeholder}</span>
  ),
  Portal: ({ children }: any) => <div data-radix-select-portal>{children}</div>,
  Content: React.forwardRef(({ children, sideOffset, position, align, side, ...props }: any, ref) => (
    <div ref={ref} {...props} data-radix-select-content>
      {children}
    </div>
  )),
  Viewport: ({ children }: any) => <div data-radix-select-viewport>{children}</div>,
  ScrollUpButton: ({ children }: any) => <div data-radix-select-scroll-up-button>{children}</div>,
  ScrollDownButton: ({ children }: any) => <div data-radix-select-scroll-down-button>{children}</div>,
  Item: React.forwardRef(({ children, value, ...props }: any, ref) => (
    <div ref={ref} {...props} role="option" data-value={value} data-radix-select-item>
      {children}
    </div>
  )),
  ItemText: ({ children }: any) => <span data-radix-select-item-text>{children}</span>,
  ItemIndicator: ({ children }: any) => <span data-radix-select-item-indicator>{children}</span>,
  Group: ({ children }: any) => <div data-radix-select-group>{children}</div>,
  Label: ({ children }: any) => <div data-radix-select-label>{children}</div>,
  Separator: () => <div data-radix-select-separator />,
  Icon: ({ children }: any) => <span data-radix-select-icon>{children}</span>,
}));

// Mock Radix UI Switch
vi.mock("@radix-ui/react-switch", () => ({
  Root: React.forwardRef(({ children, checked, onCheckedChange, ...props }: any, ref) => (
    <button
      ref={ref}
      {...props}
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      data-radix-switch-root
    >
      {children}
    </button>
  )),
  Thumb: ({ ...props }: any) => <span {...props} data-radix-switch-thumb />,
}));

// Mock Radix UI Checkbox
vi.mock("@radix-ui/react-checkbox", () => ({
  Root: React.forwardRef(({ children, checked, onCheckedChange, ...props }: any, ref) => (
    <button
      ref={ref}
      {...props}
      role="checkbox"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      data-radix-checkbox-root
    >
      {children}
    </button>
  )),
  Indicator: ({ children }: any) => <span data-radix-checkbox-indicator>{children}</span>,
}));

// Mock Radix UI Dialog
vi.mock("@radix-ui/react-dialog", () => ({
  Root: ({ children }: any) => <div data-radix-dialog-root>{children}</div>,
  Trigger: ({ children, ...props }: any) => (
    <button {...props} data-radix-dialog-trigger>
      {children}
    </button>
  ),
  Portal: ({ children }: any) => <div data-radix-dialog-portal>{children}</div>,
  Overlay: React.forwardRef(({ ...props }: any, ref) => (
    <div ref={ref} {...props} data-radix-dialog-overlay />
  )),
  Content: React.forwardRef(({ children, ...props }: any, ref) => (
    <div ref={ref} {...props} role="dialog" data-radix-dialog-content>
      {children}
    </div>
  )),
  Title: ({ children, ...props }: any) => (
    <h2 {...props} data-radix-dialog-title>
      {children}
    </h2>
  ),
  Description: ({ children, ...props }: any) => (
    <p {...props} data-radix-dialog-description>
      {children}
    </p>
  ),
  Close: ({ children, ...props }: any) => (
    <button {...props} data-radix-dialog-close>
      {children}
    </button>
  ),
}));

// Mock Radix UI Alert Dialog
vi.mock("@radix-ui/react-alert-dialog", () => ({
  Root: ({ children }: any) => <div data-radix-alert-dialog-root>{children}</div>,
  Trigger: ({ children, ...props }: any) => (
    <button {...props} data-radix-alert-dialog-trigger>
      {children}
    </button>
  ),
  Portal: ({ children }: any) => <div data-radix-alert-dialog-portal>{children}</div>,
  Overlay: React.forwardRef(({ ...props }: any, ref) => (
    <div ref={ref} {...props} data-radix-alert-dialog-overlay />
  )),
  Content: React.forwardRef(({ children, ...props }: any, ref) => (
    <div ref={ref} {...props} role="dialog" data-radix-alert-dialog-content>
      {children}
    </div>
  )),
  Title: ({ children, ...props }: any) => (
    <h2 {...props} data-radix-alert-dialog-title>
      {children}
    </h2>
  ),
  Description: ({ children, ...props }: any) => (
    <p {...props} data-radix-alert-dialog-description>
      {children}
    </p>
  ),
  Action: ({ children, ...props }: any) => (
    <button {...props} data-radix-alert-dialog-action>
      {children}
    </button>
  ),
  Cancel: ({ children, ...props }: any) => (
    <button {...props} data-radix-alert-dialog-cancel>
      {children}
    </button>
  ),
}));

// Mock Radix UI Dropdown Menu
vi.mock("@radix-ui/react-dropdown-menu", () => ({
  Root: ({ children }: any) => <div data-radix-dropdown-root>{children}</div>,
  Trigger: React.forwardRef(({ children, asChild, ...props }: any, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ref, ...props, "data-radix-dropdown-trigger": true } as any);
    }
    return (
      <button ref={ref} {...props} data-radix-dropdown-trigger>
        {children}
      </button>
    );
  }),
  Portal: ({ children }: any) => <div data-radix-dropdown-portal>{children}</div>,
  Content: React.forwardRef(({ children, ...props }: any, ref) => (
    <div ref={ref} {...props} data-radix-dropdown-content>
      {children}
    </div>
  )),
  Item: ({ children, ...props }: any) => (
    <div {...props} role="menuitem" data-radix-dropdown-item>
      {children}
    </div>
  ),
  Separator: () => <div data-radix-dropdown-separator />,
  Label: ({ children }: any) => <div data-radix-dropdown-label>{children}</div>,
  Group: ({ children }: any) => <div data-radix-dropdown-group>{children}</div>,
  Sub: ({ children }: any) => <div data-radix-dropdown-sub>{children}</div>,
  SubTrigger: ({ children, ...props }: any) => (
    <button {...props} data-radix-dropdown-sub-trigger>
      {children}
    </button>
  ),
  SubContent: ({ children, ...props }: any) => (
    <div {...props} data-radix-dropdown-sub-content>
      {children}
    </div>
  ),
  CheckboxItem: React.forwardRef(({ children, checked, onCheckedChange, ...props }: any, ref) => (
    <div
      ref={ref}
      {...props}
      role="menuitemcheckbox"
      aria-checked={checked}
      data-radix-dropdown-checkbox-item
      onClick={(e) => {
        e.preventDefault();
        onCheckedChange?.(!checked);
      }}
    >
      {children}
    </div>
  )),
  ItemIndicator: ({ children }: any) => <span data-radix-dropdown-item-indicator>{children}</span>,
}));

// Mock Radix UI Label
vi.mock("@radix-ui/react-label", () => ({
  Root: React.forwardRef(({ children, ...props }: any, ref) => (
    <label ref={ref} {...props} data-radix-label>
      {children}
    </label>
  )),
}));

// Mock Radix UI Separator
vi.mock("@radix-ui/react-separator", () => ({
  Root: React.forwardRef(({ ...props }: any, ref) => (
    <div ref={ref} {...props} data-radix-separator />
  )),
}));

// Mock Radix UI Tabs
vi.mock("@radix-ui/react-tabs", () => ({
  Root: ({ children, ...props }: any) => <div {...props} data-radix-tabs-root>{children}</div>,
  List: ({ children, ...props }: any) => <div {...props} role="tablist" data-radix-tabs-list>{children}</div>,
  Trigger: ({ children, ...props }: any) => (
    <button {...props} role="tab" data-radix-tabs-trigger>
      {children}
    </button>
  ),
  Content: ({ children, ...props }: any) => (
    <div {...props} role="tabpanel" data-radix-tabs-content>
      {children}
    </div>
  ),
}));

// Mock Radix UI Accordion
vi.mock("@radix-ui/react-accordion", () => ({
  Root: ({ children, ...props }: any) => <div {...props} data-radix-accordion-root>{children}</div>,
  Item: ({ children, ...props }: any) => <div {...props} data-radix-accordion-item>{children}</div>,
  Header: ({ children, ...props }: any) => <div {...props} data-radix-accordion-header>{children}</div>,
  Trigger: ({ children, ...props }: any) => (
    <button {...props} data-radix-accordion-trigger>
      {children}
    </button>
  ),
  Content: ({ children, ...props }: any) => (
    <div {...props} data-radix-accordion-content>
      {children}
    </div>
  ),
}));

export {};
