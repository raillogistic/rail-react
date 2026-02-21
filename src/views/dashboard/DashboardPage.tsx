import { useModelListQuery, useModelUpdateMutation } from "@/lib/graphql";
import React from "react";

/**
 * Dashboard demo page for generated GraphQL hooks.
 */
export default function DashboardPage() {
  // const { loading, dev } = useModelListQuery({
  //   app: "billing",
  //   model: "Invoice",
  // });

  const updateMutation = useModelUpdateMutation({
    identity: { app: "billing", model: "Invoice" },
    modelFormOptions: {
      objectId: "1", // required to fetch initial data
    },
  });

  const initValues = updateMutation.initialValues ?? {};
  const readonlyValues = updateMutation.readonlyValues ?? {};
  console.log(initValues, updateMutation.formError);

  return (
    <div>
      {/* <div>dataFetchMs: {dev.dataFetchMs}</div>
      <div>metadataFetchMs: {dev.metadataFetchMs}</div>
      <div>updateMutation: {updateMutation.mutationName}</div> */}
      {/* {data && <div>{JSON.stringify(data)}</div>} */}
    </div>
  );
}
