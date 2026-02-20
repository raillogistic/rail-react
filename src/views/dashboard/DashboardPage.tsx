import { useModelPageQuery } from "@/lib/graphql";
import { buildQueries } from "@testing-library/dom";
import React from "react";

type Props = {};

export default function DashboardPage({}: Props) {
  const { data, loading } = useModelPageQuery({
    app: "billing",
    model: "Invoice",
    variables: {
      page: 1,
      perPage: 20,

      orderBy: ["-id"],
      skipCount: false,
    },
  });

  return (
    <div>
      {loading && <div>Loading...</div>}
      {data && <div>{data?.items?.length}</div>}
    </div>
  );
}
