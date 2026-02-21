import {
  useModelListQuery,
  useModelPageQuery,
  useModelSingleQuery,
} from "@/lib/graphql";
import { buildQueries } from "@testing-library/dom";
import React from "react";

type Props = {};

export default function DashboardPage({}: Props) {
  const { data, loading, dev } = useModelListQuery({
    app: "billing",
    model: "Invoice",
  });

  return (
    <div>
      {loading && <div>Loading...</div>}
      <div>dataFetchMs: {dev.dataFetchMs}</div>
      <div>metadataFetchMs: {dev.metadataFetchMs}</div>
      {/* {data && <div>{JSON.stringify(data)}</div>} */}
    </div>
  );
}
