import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import DynamicForm from "../inputs/form";
import type { FormSchema } from "../types/schema";

// Mock localStorage
const localStorageMock = (() => {
 let store: Record<string, string> = {};
 return {
 getItem: (key: string) => store[key] || null,
 setItem: (key: string, value: string) => {
 store[key] = value.toString();
 },
 clear: () => {
 store = {};
 },
 removeItem: (key: string) => {
 delete store[key];
 },
 };
})();

Object.defineProperty(window, "localStorage", {
 value: localStorageMock,
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
 observe() {}
 unobserve() {}
 disconnect() {}
};

// Mock Tiptap
vi.mock("@tiptap/react", () => ({
 useEditor: ({ content, onUpdate }: any) => ({
 getHTML: () => content,
 isEmpty: !content,
 chain: () => ({
 focus: () => ({
 toggleBold: () => ({ run: () => {} }),
 toggleItalic: () => ({ run: () => {} }),
 toggleStrike: () => ({ run: () => {} }),
 toggleCode: () => ({ run: () => {} }),
 toggleHeading: () => ({ run: () => {} }),
 toggleBulletList: () => ({ run: () => {} }),
 toggleOrderedList: () => ({ run: () => {} }),
 toggleBlockquote: () => ({ run: () => {} }),
 extendMarkRange: () => ({
 setLink: () => ({ run: () => {} }),
 unsetLink: () => ({ run: () => {} }),
 }),
 }),
 }),
 isActive: () => false,
 commands: {
 setContent: () => {},
 clearContent: () => {},
 },
 }),
 EditorContent: () => <div data-testid="tiptap-editor" />,
}));

describe("DynamicForm - New Features", () => {
 beforeEach(() => {
 localStorageMock.clear();
 vi.clearAllMocks();
 });

 describe("1. Undo/Redo History", () => {
 it("should track changes and allow undo/redo", async () => {
 const schema: FormSchema = {
 fields: [{ name: "name", type: "text", label: "Name" }],
 };

 const { getByLabelText, getByTitle } = render(
 <DynamicForm
 schema={schema}
 actions={{ undoRedo: { enabled: true, showInActionBar: true } }}
 />
 );

 const input = getByLabelText("Name");
 const undoBtn = getByTitle("Annuler");
 const redoBtn = getByTitle("Rétablir");

 expect(undoBtn).toBeDisabled();
 expect(redoBtn).toBeDisabled();

 // Change 1
 await userEvent.type(input, "Alice");
 await waitFor(() => expect(input).toHaveValue("Alice"));

 // Wait for history debounce to commit "Alice"
 // Since we start empty, history should have at least one entry (the empty state) once the change is committed
 await waitFor(() => expect(undoBtn).not.toBeDisabled(), { timeout: 2000 });

 // Change 2
 await userEvent.clear(input);
 // Wait for debounce to capture the clear (empty state)
 await new Promise((r) => setTimeout(r, 400));
 await waitFor(() => expect(input).toHaveValue(""));

 await userEvent.type(input, "Bob");
 await waitFor(() => expect(input).toHaveValue("Bob"));

 // Wait for history debounce to commit "Bob"
 // We need to wait enough time for the debounce (300ms) to fire
 await new Promise((r) => setTimeout(r, 400));

 // Undo to empty (the state after clear, before typing Bob)
 // Note: userEvent.clear() and type() are distinct actions separated by await,
 // so they are likely captured as separate history states (Alice -> "" -> Bob).
 await userEvent.click(undoBtn);
 await waitFor(() => expect(input).toHaveValue(""));

 // Undo to Alice
 await userEvent.click(undoBtn);
 await waitFor(() => expect(input).toHaveValue("Alice"));

 // Undo to empty (initial state)
 await userEvent.click(undoBtn);
 await waitFor(() => expect(input).toHaveValue(""));

 // Redo to Alice
 expect(redoBtn).not.toBeDisabled();
 await userEvent.click(redoBtn);
 await waitFor(() => expect(input).toHaveValue("Alice"));
 });
 });

 describe("2. LocalStorage Persistence", () => {
 it("should save values to localStorage and restore them", async () => {
 const schema: FormSchema = {
 fields: [{ name: "email", type: "email", label: "Email" }],
 };
 const KEY = "my-form-key";

 // 1. Render form and type something
 const { getByLabelText, unmount } = render(
 <DynamicForm
 schema={schema}
 state={{ persistKey: KEY }}
 />
 );

 const input = getByLabelText("Email");
 await userEvent.type(input, "test@example.com");

 // Wait for debounce/async storage
 await waitFor(() => {
 const stored = localStorage.getItem(KEY);
 expect(stored).toContain("test@example.com");
 });

 unmount();

 // 2. Render new form instance with same key
 const { getByLabelText: getByLabelText2 } = render(
 <DynamicForm
 schema={schema}
 state={{ persistKey: KEY }}
 />
 );

 const input2 = getByLabelText2("Email");
 // Should restore value
 await waitFor(() => expect(input2).toHaveValue("test@example.com"));
 });
 });

 describe("3. Visual Field Groups", () => {
 it("should render group variants correctly", () => {
 const schema: FormSchema = {
 fields: [
 {
 name: "group1",
 type: "group",
 label: "Card Group",
 ui: { variant: "card" },
 fields: [{ name: "f1", type: "text", label: "Field 1" }],
 },
 {
 name: "group2",
 type: "group",
 label: "Fieldset Group",
 ui: { variant: "fieldset" },
 fields: [{ name: "f2", type: "text", label: "Field 2" }],
 },
 ],
 };

 const { getByText, getByLabelText } = render(<DynamicForm schema={schema} />);

 expect(getByText("Card Group")).toBeInTheDocument();
 expect(getByText("Fieldset Group")).toBeInTheDocument();
 expect(getByLabelText("Field 1")).toBeInTheDocument();
 expect(getByLabelText("Field 2")).toBeInTheDocument();
 });

 it("should support collapsible groups", async () => {
 const schema: FormSchema = {
 fields: [
 {
 name: "group1",
 type: "group",
 label: "Collapsible Group",
 collapsible: true,
 fields: [{ name: "f1", type: "text", label: "Field 1" }],
 },
 ],
 };

 const { getByText, container } = render(<DynamicForm schema={schema} />);

 const toggleBtn = container.querySelector("button"); // The chevron button
 // Initially open (default)
 // Since implementation defaults to isOpen=true

 // Click to collapse
 if (toggleBtn) await userEvent.click(toggleBtn);

 // Checking visibility in test DOM is tricky with CSS transitions
 // But we can check if the grid-rows class changed
 // Implementation: isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"

 const contentWrapper = container.querySelector(".grid-rows-\\[0fr\\]");
 expect(contentWrapper).toBeInTheDocument();
 });
 });

 describe("4. Drag-and-Drop List", () => {
 it("should render list items with drag handles when enabled", () => {
 const schema: FormSchema = {
 fields: [
 {
 name: "items",
 type: "list",
 label: "Items",
 ordering: { activate: true, toField: "order" },
 fields: [{ name: "name", type: "text" }],
 defaultValue: [{ name: "A", order: 0 }, { name: "B", order: 1 }]
 },
 ],
 };

 render(
 <MockedProvider mocks={[]}>
 <DynamicForm schema={schema} />
 </MockedProvider>,
 );

 expect(screen.getByDisplayValue("A")).toBeInTheDocument();
 expect(screen.getByDisplayValue("B")).toBeInTheDocument();

 // Without full DnD browser environment mocking, full drag simulation is hard.
 // But we verify it doesn't crash and renders items.
 });
 });

 describe("5. Rich Text Field", () => {
 it("should render Tiptap editor", () => {
 const schema: FormSchema = {
 fields: [{ name: "content", type: "rich-text", label: "Content" }],
 };

 const { getByTestId, getByText } = render(<DynamicForm schema={schema} />);

 expect(getByTestId("tiptap-editor")).toBeInTheDocument();
 expect(getByText("Content")).toBeInTheDocument();
 });
 });
});
