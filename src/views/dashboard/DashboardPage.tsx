import {
  useModelCreateMutation,
  useModelListQuery,
  useModelPageQuery,
  useModelSingleQuery,
  useModelUpdateMutation,
} from "@/lib/graphql";
import { buildQueries } from "@testing-library/dom";
import React from "react";

type Props = {};

export default function DashboardPage({}: Props) {
  const { data, loading, dev } = useModelListQuery({
    app: "billing",
    model: "Invoice",
  });

  const { data: dd } = useModelUpdateMutation({
    app: "billing",
    model: "Invoice",
    variables: {
      id: "1",
    },
  });
  console.log(modelForm);

  return (
    <div>
      {loading && <div>Loading...</div>}
      <div>dataFetchMs: {dev.dataFetchMs}</div>
      <div>metadataFetchMs: {dev.metadataFetchMs}</div>
      {/* {data && <div>{JSON.stringify(data)}</div>} */}
    </div>
  );
}
