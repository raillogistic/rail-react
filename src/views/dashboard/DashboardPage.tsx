import { useModelListQuery, useModelUpdateMutation } from "@/lib/graphql";
import React from "react";

/**
 * Dashboard demo page for generated GraphQL hooks.
 */
export default function DashboardPage() {
  const { loading, dev } = useModelListQuery({
    app: "billing",
    model: "Invoice",
  });

  const updateMutation = useModelUpdateMutation({
    app: "billing",
    model: "Invoice",
    modelFormOptions: {
      objectId: "1",
      contractMode: "UPDATE",
    },
  });
  console.log(updateMutation);

  return (
    <div>
      {loading && <div>Loading...</div>}
      <div>dataFetchMs: {dev.dataFetchMs}</div>
      <div>metadataFetchMs: {dev.metadataFetchMs}</div>
      <div>updateMutation: {updateMutation.mutationName}</div>
      {/* {data && <div>{JSON.stringify(data)}</div>} */}
    </div>
  );
}
