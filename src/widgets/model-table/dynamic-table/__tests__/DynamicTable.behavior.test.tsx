import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DynamicTable } from "../components/DynamicTable";

describe("DynamicTable behaviors", () => {
 it("emits row selection updates when select-all is toggled", async () => {
 const onRowSelectionChange = vi.fn();
 const user = userEvent.setup();

 render(
 <DynamicTable
 rows={[
 { id: "1", name: "Ada" },
 { id: "2", name: "Grace" },
 ]}
 columns={[
 {
 id: "name",
 accessorKey: "name",
 title: "Name",
 },
 ]}
 features={{ enableSelection: true }}
 onRowSelectionChange={onRowSelectionChange}
 />,
 );

 await user.click(screen.getByLabelText("Select all rows"));

 expect(onRowSelectionChange).toHaveBeenCalledWith({
 "1": true,
 "2": true,
 });
 });

 it("emits orderBy updates from header sort menu actions", async () => {
 const onOrderByChange = vi.fn();
 const user = userEvent.setup();

 render(
 <DynamicTable
 rows={[
 { id: "1", name: "Ada" },
 { id: "2", name: "Grace" },
 ]}
 columns={[
 {
 id: "name",
 accessorKey: "name",
 title: "Name",
 },
 ]}
 onOrderByChange={onOrderByChange}
 />,
 );

 await user.click(screen.getByLabelText("Open column menu for Name"));
 await user.click(screen.getByText(/sort ascending|trier croissant/i));

 expect(onOrderByChange).toHaveBeenCalledWith(["name"]);
 });

 it("keeps selection as the first visible column in controlled column order", () => {
 render(
 <DynamicTable
 rows={[
 { id: "1", name: "Ada" },
 { id: "2", name: "Grace" },
 ]}
 columns={[
 {
 id: "name",
 accessorKey: "name",
 title: "Name",
 },
 ]}
 features={{ enableSelection: true }}
 state={{ columnOrder: ["name"] }}
 />,
 );

 const selectAllHeaderCell = screen
 .getByLabelText("Select all rows")
 .closest("th");
 const nameHeaderCell = screen
 .getByLabelText("Open column menu for Name")
 .closest("th");

 expect(selectAllHeaderCell).not.toBeNull();
 expect(nameHeaderCell).not.toBeNull();
 expect((selectAllHeaderCell as HTMLTableCellElement).cellIndex).toBe(0);
 expect(
 (selectAllHeaderCell as HTMLTableCellElement).cellIndex,
 ).toBeLessThan((nameHeaderCell as HTMLTableCellElement).cellIndex);
 });

 it("renders row-detail panels and toggles them from the expand column", async () => {
 const user = userEvent.setup();

 render(
 <DynamicTable
 rows={[
 { id: "1", name: "Ada" },
 { id: "2", name: "Grace" },
 ]}
 columns={[
 {
 id: "name",
 accessorKey: "name",
 title: "Name",
 },
 ]}
 expand={{
 renderRow: ({ row }) => <div>Details: {String(row.name)}</div>,
 }}
 />,
 );

 await user.click(screen.getByLabelText("Expand row 1"));
 expect(screen.getByText("Details: Ada")).toBeInTheDocument();

 await user.click(screen.getByLabelText("Collapse row 1"));
 expect(screen.queryByText("Details: Ada")).toBeNull();
 });

 it("allows multiple row-detail panels to be expanded at once", async () => {
 const user = userEvent.setup();

 render(
 <DynamicTable
 rows={[
 { id: "1", name: "Ada" },
 { id: "2", name: "Grace" },
 ]}
 columns={[
 {
 id: "name",
 accessorKey: "name",
 title: "Name",
 },
 ]}
 expand={{
 renderRow: ({ row }) => <div>Details: {String(row.name)}</div>,
 }}
 />,
 );

 await user.click(screen.getByLabelText("Expand row 1"));
 await user.click(screen.getByLabelText("Expand row 2"));

 expect(screen.getByText("Details: Ada")).toBeInTheDocument();
 expect(screen.getByText("Details: Grace")).toBeInTheDocument();
 });

 it("emits expanded state changes when detail panels are toggled", async () => {
 const onExpandedChange = vi.fn();
 const user = userEvent.setup();

 render(
 <DynamicTable
 rows={[
 { id: "1", name: "Ada" },
 { id: "2", name: "Grace" },
 ]}
 columns={[
 {
 id: "name",
 accessorKey: "name",
 title: "Name",
 },
 ]}
 expand={{
 onExpandedChange,
 renderRow: ({ row }) => <div>Details: {String(row.name)}</div>,
 }}
 />,
 );

 await user.click(screen.getByLabelText("Expand row 1"));

 expect(onExpandedChange).toHaveBeenCalledWith({ "1": true });
 expect(onExpandedChange).toHaveBeenCalledTimes(1);
 });

 it("keeps expand first, selection second, and data after utility columns", () => {
 render(
 <DynamicTable
 rows={[
 { id: "1", name: "Ada" },
 { id: "2", name: "Grace" },
 ]}
 columns={[
 {
 id: "name",
 accessorKey: "name",
 title: "Name",
 },
 ]}
 features={{ enableSelection: true }}
 state={{ columnOrder: ["name"] }}
 expand={{
 renderRow: ({ row }) => <div>Details: {String(row.name)}</div>,
 }}
 />,
 );

 const expandCell = screen.getByLabelText("Expand row 1").closest("td");
 const selectionCell = screen.getByLabelText("Select row 1").closest("td");
 const dataCell = screen.getByText("Ada").closest("td");

 expect(expandCell).not.toBeNull();
 expect(selectionCell).not.toBeNull();
 expect(dataCell).not.toBeNull();
 expect((expandCell as HTMLTableCellElement).cellIndex).toBe(0);
 expect((selectionCell as HTMLTableCellElement).cellIndex).toBe(1);
 expect((dataCell as HTMLTableCellElement).cellIndex).toBe(2);
 });

 it("disables detail panels when grouping is active", () => {
 render(
 <DynamicTable
 rows={[
 { id: "1", name: "Ada" },
 { id: "2", name: "Ada" },
 ]}
 columns={[
 {
 id: "name",
 accessorKey: "name",
 title: "Name",
 },
 ]}
 state={{ grouping: ["name"] }}
 expand={{
 renderRow: ({ row }) => <div>Details: {String(row.name)}</div>,
 }}
 />,
 );

 expect(screen.queryByLabelText("Expand row 1")).toBeNull();
 expect(screen.getByRole("button", { name: /ada/i })).toHaveTextContent(
 "2",
 );
 });
});
