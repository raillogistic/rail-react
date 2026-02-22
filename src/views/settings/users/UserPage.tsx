import { DynamicModelTable } from "@/lib/table";

export function UserPage() {
  return <DynamicModelTable app="users" model="User" />;
}
