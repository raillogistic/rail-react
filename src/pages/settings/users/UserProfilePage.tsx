import { DynamicModelTable } from "@/widgets/model-table";

export function UserProfilePage() {
  return <DynamicModelTable app="users" model="UserProfile" />;
}
