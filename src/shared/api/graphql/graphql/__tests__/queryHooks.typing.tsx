import type { OperationsDecharge } from "@/models";
import {
  useModelListQuery,
  useModelPageQuery,
  useModelSingleQuery,
} from "@/shared/api/graphql/graphql";

function SingleHookTypingExample() {
  const single = useModelSingleQuery<OperationsDecharge>({
    app: "operations",
    model: "Decharge",
    id: "1",
  });

  void single.data?.site;
  void single.data?.beneficiaire.nom;

  // @ts-expect-error missingField does not exist on OperationsDecharge
  void single.data?.missingField;

  return null;
}

function PageHookTypingExample() {
  const page = useModelPageQuery<OperationsDecharge>({
    app: "operations",
    model: "Decharge",
    fields: ["site", "beneficiaire.nom"],
    variables: {
      page: 1,
      perPage: 10,
    },
  });

  void page.data?.items?.[0]?.site;
  void page.data?.items?.[0]?.beneficiaire.nom;
  void page.data?.pageInfo?.totalCount;

  // @ts-expect-error missingField does not exist on OperationsDecharge
  void page.data?.items?.[0]?.missingField;

  return null;
}

function ListHookTypingExample() {
  const list = useModelListQuery<OperationsDecharge>({
    app: "operations",
    model: "Decharge",
    fields: ["site", "beneficiaire.nom"],
  });

  void list.data?.[0]?.site;
  void list.data?.[0]?.beneficiaire.nom;

  // @ts-expect-error missingField does not exist on OperationsDecharge
  void list.data?.[0]?.missingField;

  return null;
}

void SingleHookTypingExample;
void PageHookTypingExample;
void ListHookTypingExample;
