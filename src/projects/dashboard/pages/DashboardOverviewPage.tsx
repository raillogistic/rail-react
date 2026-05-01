import { DynamicModelTable } from "@/widgets/model-table";
import type { FC } from "react";

export const DashboardOverviewPage: FC = () => {
  return (
    <section className="space-y-4">
      <DynamicModelTable app="users" model="User" />
    </section>
  );
};

export default DashboardOverviewPage;
