import { DynamicModelTable } from "@/widgets/model-table";

export function UserPage() {
  return <DynamicModelTable app="users" model="User" />;
}
