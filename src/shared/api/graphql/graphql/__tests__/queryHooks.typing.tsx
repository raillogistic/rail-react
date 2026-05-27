import type { LocationsAssetMovement } from "@/models";
import {
  useModelListQuery,
  useModelPageQuery,
  useModelSingleQuery,
} from "@/shared/api/graphql/graphql";

function SingleHookTypingExample() {
  const single = useModelSingleQuery<LocationsAssetMovement>({
    app: "locations",
    model: "AssetMovement",
    id: "1",
  });

  void single.data?.reason;
  void single.data?.asset.name;

  // @ts-expect-error missingField does not exist on LocationsAssetMovement
  void single.data?.missingField;

  return null;
}

function PageHookTypingExample() {
  const page = useModelPageQuery<LocationsAssetMovement>({
    app: "locations",
    model: "AssetMovement",
    fields: ["reason", "asset.name"],
    variables: {
      page: 1,
      perPage: 10,
    },
  });

  void page.data?.items?.[0]?.reason;
  void page.data?.items?.[0]?.asset.name;
  void page.data?.pageInfo?.totalCount;

  // @ts-expect-error missingField does not exist on LocationsAssetMovement
  void page.data?.items?.[0]?.missingField;

  return null;
}

function ListHookTypingExample() {
  const list = useModelListQuery<LocationsAssetMovement>({
    app: "locations",
    model: "AssetMovement",
    fields: ["reason", "asset.name"],
  });

  void list.data?.[0]?.reason;
  void list.data?.[0]?.asset.name;

  // @ts-expect-error missingField does not exist on LocationsAssetMovement
  void list.data?.[0]?.missingField;

  return null;
}

void SingleHookTypingExample;
void PageHookTypingExample;
void ListHookTypingExample;
