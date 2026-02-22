import { DynamicModelTable } from "@/lib/table";

export function UserProfilePage() {
  return <DynamicModelTable app="users" model="UserProfile" />;
}
