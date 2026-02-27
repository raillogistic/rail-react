/**
 * @module generatedExamples
 * @description Generated contract and model-driven form examples.
 */

import { gql, useApolloClient, useQuery } from "@apollo/client";
import React from "react";

import {
  MODEL_FORM_CONTRACT_QUERY,
  MODEL_FORM_INITIAL_DATA_QUERY,
} from "@/shared/api/graphql/legacy/modelFormContract";
import {
  DynamicForm,
  ModelForm,
  buildGeneratedMutationDocument,
  resolveGeneratedMutationOperation,
  useGeneratedFormMetrics,
  useGeneratedModelForm,
  useGeneratedValidators,
} from "@/widgets/model-form";
import type {
  ModelFormContract,
  ModelFormInitialData,
  ModelFormMode,
  ModelFormRuntimeOverride,
} from "@/widgets/model-form/types/generatedContract";
import { normalizeGeneratedErrorsForForm } from "@/widgets/model-form/utils/errors";
import { serializeRuntimeOverridesForQuery } from "@/widgets/model-form/utils/jsonCoercion";
import { buildNestedMutationPayload } from "@/widgets/model-form/utils/nestedMutationPayload";
import { DynamicModelTable } from "@/widgets/model-table";
type StoreModelName = "Product" | "Order";

type ContractQueryData = {
  modelFormContract: ModelFormContract | null;
};

type ContractQueryVariables = {
  appLabel: string;
  modelName: StoreModelName;
  mode: ModelFormMode;
  includeNested: boolean;
};

type InitialDataQueryData = {
  modelFormInitialData: ModelFormInitialData | null;
};

type InitialDataQueryVariables = {
  appLabel: string;
  modelName: StoreModelName;
  objectId: string;
  includeNested: boolean;
  runtimeOverrides?: ModelFormRuntimeOverride[];
};

type SubmissionState = {
  status: "idle" | "saving" | "success" | "error";
  message: string | null;
  conflict: boolean;
  errors: Array<{ field?: string | null; message: string }>;
};

type GeneratedMutationResponse = {
  ok?: boolean;
  errors?: unknown;
  conflict?: boolean;
};

const INITIAL_SUBMISSION_STATE: SubmissionState = {
  status: "idle",
  message: null,
  conflict: false,
  errors: [],
};

const PRODUCT_CREATE_RUNTIME_OVERRIDES: ModelFormRuntimeOverride[] = [
  {
    path: "metadata",
    action: "MERGE",
    value: {
      created_from: "StoreProductCreateModelFormExample",
    },
  },
];

const PRODUCT_UPDATE_RUNTIME_OVERRIDES: ModelFormRuntimeOverride[] = [
  {
    path: "metadata",
    action: "MERGE",
    value: {
      updated_from: "StoreProductUpdateModelFormExample",
    },
  },
];

const ORDER_RUNTIME_OVERRIDES: ModelFormRuntimeOverride[] = [
  { path: "payment_token", action: "UNSET" },
  {
    path: "metadata",
    action: "MERGE",
    value: { updated_from: "rail-react/src/widgets/model-form/examples.tsx" },
  },
];

function getMutationResponse(
  data: Record<string, unknown> | null | undefined,
): GeneratedMutationResponse {
  if (!data || typeof data !== "object") {
    return {};
  }
  const response = (data as { response?: unknown }).response;
  if (!response || typeof response !== "object") {
    return {};
  }
  return response as GeneratedMutationResponse;
}

function toSubmissionErrors(errors: unknown): SubmissionState["errors"] {
  return normalizeGeneratedErrorsForForm(errors).map((item) => ({
    field: item.field,
    message: item.message,
  }));
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "La requête a échoué.";
}

function useStoreGeneratedForm(options: {
  modelName: StoreModelName;
  mode: ModelFormMode;
  objectId?: string;
  includeNested?: boolean;
  runtimeOverrides?: ModelFormRuntimeOverride[];
}) {
  const {
    modelName,
    mode,
    objectId,
    includeNested = false,
    runtimeOverrides = [],
  } = options;

  const contractQuery = useQuery<ContractQueryData, ContractQueryVariables>(
    MODEL_FORM_CONTRACT_QUERY,
    {
      variables: {
        appLabel: "store",
        modelName,
        mode,
        includeNested,
      },
      fetchPolicy: "cache-and-network",
    },
  );

  const shouldFetchInitialData = mode === "UPDATE" && Boolean(objectId);
  const runtimeOverridesForQuery = React.useMemo<ModelFormRuntimeOverride[]>(
    () =>
      serializeRuntimeOverridesForQuery(
        runtimeOverrides,
      ) as ModelFormRuntimeOverride[],
    [runtimeOverrides],
  );

  const initialDataQuery = useQuery<
    InitialDataQueryData,
    InitialDataQueryVariables
  >(MODEL_FORM_INITIAL_DATA_QUERY, {
    variables: {
      appLabel: "store",
      modelName,
      objectId: objectId ?? "",
      includeNested,
      runtimeOverrides: runtimeOverridesForQuery,
    },
    skip: !shouldFetchInitialData,
    fetchPolicy: "network-only",
  });

  const contract = contractQuery.data?.modelFormContract ?? null;
  const initialData = shouldFetchInitialData
    ? (initialDataQuery.data?.modelFormInitialData ?? null)
    : null;

  const generatedForm = useGeneratedModelForm({
    contract,
    initialData,
    runtimeOverrides,
    generatedEnabled: true,
  });

  const { formValidator } = useGeneratedValidators(contract);

  return {
    contract,
    schema: generatedForm.schema,
    buildSubmissionValues: generatedForm.buildSubmissionValues,
    relations: contract?.relations ?? [],
    formValidator,
    loading: contractQuery.loading || initialDataQuery.loading,
    error: contractQuery.error ?? initialDataQuery.error,
  };
}

export function StoreProductCreateGeneratedFormExample() {
  const client = useApolloClient();
  const metrics = useGeneratedFormMetrics();

  const [submission, setSubmission] = React.useState<SubmissionState>(
    INITIAL_SUBMISSION_STATE,
  );

  const generated = useStoreGeneratedForm({
    modelName: "Product",
    mode: "CREATE",
    runtimeOverrides: [
      {
        path: "metadata",
        action: "MERGE",
        value: { created_from: "generated-form-example" },
      },
    ],
  });

  console.log(generated);

  const onSubmit = React.useCallback(
    async (values: Record<string, unknown>) => {
      if (!generated.contract) return;

      setSubmission({
        status: "saving",
        message: "Soumission de la mutation de création de produit...",
        conflict: false,
        errors: [],
      });

      const operationName = resolveGeneratedMutationOperation(
        generated.contract.mutationBindings,
        "create",
        "Product",
      );

      const mutation = gql(
        buildGeneratedMutationDocument(
          "create",
          operationName,
          "Product",
          "id sku name",
        ),
      );

      try {
        const result = await client.mutate<{
          response?: GeneratedMutationResponse;
        }>({
          mutation,
          variables: {
            input: generated.buildSubmissionValues(values),
          },
        });

        const response = getMutationResponse(
          result.data as Record<string, unknown> | null | undefined,
        );
        const errors = toSubmissionErrors(response.errors);
        const ok = Boolean(response.ok) && errors.length === 0;

        metrics.recordAttempt({
          ok,
          hadValidationErrors: errors.length > 0,
        });

        setSubmission(
          ok
            ? {
                status: "success",
                message: "Produit créé avec succès.",
                conflict: false,
                errors: [],
              }
            : {
                status: "error",
                message: "Échec de la création du produit.",
                conflict: Boolean(response.conflict),
                errors,
              },
        );
      } catch (error) {
        metrics.recordAttempt({
          ok: false,
          hadValidationErrors: false,
        });
        setSubmission({
          status: "error",
          message: toErrorMessage(error),
          conflict: false,
          errors: [],
        });
      }
    },
    [client, generated, metrics],
  );

  if (generated.loading) {
    return <p>Chargement du contrat du formulaire Product généré...</p>;
  }

  if (generated.error) {
    return (
      <p>Échec du chargement du contrat Product : {generated.error.message}</p>
    );
  }

  const snapshot = metrics.getSnapshot();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        Création de produit Store (Formulaire généré)
      </h2>
      <DynamicForm
        schema={generated.schema}
        behavior={{
          validate: generated.formValidator,
          onSubmit,
        }}
        actions={{
          submitLabel: "Create Product",
          resetLabel: "Reset",
          showDirtyIndicator: true,
        }}
      />
      {submission.status !== "idle" ? (
        <div className="rounded border border-border p-3 text-sm">
          <p>{submission.message}</p>
          {submission.conflict ? (
            <p className="mt-1 text-destructive">
              Conflit de mise à jour détecté. Rechargez le contrat et réessayez.
            </p>
          ) : null}
          {submission.errors.length > 0 ? (
            <ul className="mt-2 list-disc pl-5">
              {submission.errors.map((item, index) => (
                <li key={`${item.field ?? "__all__"}-${index}`}>
                  {item.field ? `${item.field}: ` : ""}
                  {item.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Tentatives de soumission : {snapshot.totalSubmissions}, taux de succès
        de correction : {Math.round(snapshot.correctionRate * 100)}%
      </p>
    </section>
  );
}

export function StoreProductCreateModelFormExample() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        Création de produit Store (ModelForm)
      </h2>
      <ModelForm
        app="store"
        model="Product"
        mode="CREATE"
        runtimeOverrides={PRODUCT_CREATE_RUNTIME_OVERRIDES}
        description="Exemple de création auto-câblée : Enregistrer lance createOperation généré sans câblage manuel de mutation."
        formProps={{
          layout: { columns: 2, showSectionHeaders: true },
          actions: {
            submitLabel: "Créer le produit",
            resetLabel: "Réinitialiser",
            showDirtyIndicator: true,
          },
        }}
      />
    </section>
  );
}

type StoreProductUpdateModelFormExampleProps = {
  objectId: string;
};

export function StoreProductUpdateModelFormExample({
  objectId,
}: StoreProductUpdateModelFormExampleProps) {
  if (!objectId) {
    return (
      <p>
        Veuillez fournir un `objectId` valide pour charger le ModelForm de mise
        à jour du produit.
      </p>
    );
  }
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        Mise à jour de produit Store (ModelForm)
      </h2>
      <ModelForm
        app="store"
        model="Product"
        mode="UPDATE"
        objectId={objectId}
        excludeFields={["price"]}
        runtimeOverrides={PRODUCT_UPDATE_RUNTIME_OVERRIDES}
        description="Exemple de mise à jour auto-câblée : les valeurs initiales sont chargées depuis modelFormInitialData et Enregistrer lance updateOperation générée."
        formProps={{
          devtools: { enabled: true },
          layout: {
            columns: 4,

            showSectionHeaders: true,
          },
          actions: {
            submitLabel: "Mettre à jour le produit",
            resetLabel: "Réinitialiser",
            showDirtyIndicator: true,
          },
        }}
      />
    </section>
  );
}

type StoreOrderUpdateModelFormExampleProps = {
  objectId: string;
};

export function StoreOrderUpdateModelFormExample({
  objectId,
}: StoreOrderUpdateModelFormExampleProps) {
  if (!objectId) {
    return (
      <p>
        Veuillez fournir un `objectId` valide pour charger le ModelForm de mise
        à jour de commande.
      </p>
    );
  }
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        Mise à jour de commande Store (ModelForm)
      </h2>
      <ModelForm
        app="store"
        model="Order"
        mode="UPDATE"
        objectId={objectId}
        runtimeOverrides={ORDER_RUNTIME_OVERRIDES}
        description="Exemple de mise à jour auto-câblée : les valeurs initiales sont chargées depuis modelFormInitialData et Enregistrer lance updateOperation générée."
        nested={["items"]}
        onlyRequired
        // excludeFields={["price"]}
        formProps={{
          layout: {
            variant: "popup",
            ordering: {
              enabled: true,
              // tailing: ["notes", "metadata"],
              order: ["name", "sku"],
            },
          },
          // devtools: { enabled: true },
        }}
      />
    </section>
  );
}

type StoreOrderViewModelFormExampleProps = {
  objectId: string;
};

export function StoreOrderViewModelFormExample({
  objectId,
}: StoreOrderViewModelFormExampleProps) {
  if (!objectId) {
    return (
      <p>
        Veuillez fournir un `objectId` valide pour charger le ModelForm de
        consultation de commande.
      </p>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        Consultation de commande Store (ModelForm)
      </h2>
      <ModelForm
        app="store"
        model="Order"
        mode="VIEW"
        objectId={objectId}
        description="Détails de commande en lecture seule avec visibilité des champs pilotée par le contrat."
      />
    </section>
  );
}

export function StoreOrderCreateModelFormExample() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        Création de commande Store (ModelForm)
      </h2>
      <ModelForm
        app="store"
        model="Order"
        mode="CREATE"
        nested={["customer", "items"]}
        excludeFields={["payment_token", "raw_payload"]}
        description="Formulaire de création de commande avec client/articles imbriqués activés."
        behavior={{
          onSubmit: async (values) => {
            console.log("Valeurs de création de commande :", values);
          },
        }}
      />
    </section>
  );
}

export function StoreOrderItemCreateModelFormExample() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        Création de ligne de commande Store (ModelForm)
      </h2>
      <ModelForm
        app="store"
        model="OrderItem"
        mode="CREATE"
        description="Formulaire de création piloté par contrat pour les lignes de commande."
        formProps={{
          layout: { columns: 2, showSectionHeaders: true },
          actions: {
            submitLabel: "Créer une ligne de commande",
            resetLabel: "Réinitialiser",
          },
        }}
        behavior={{
          onSubmit: async (values) => {
            console.log("Valeurs de création de ligne de commande :", values);
          },
        }}
      />
    </section>
  );
}

type StoreOrderUpdateGeneratedFormExampleProps = {
  objectId: string;
};

export function StoreOrderUpdateGeneratedFormExample({
  objectId,
}: StoreOrderUpdateGeneratedFormExampleProps) {
  const client = useApolloClient();
  const metrics = useGeneratedFormMetrics();
  const [submission, setSubmission] = React.useState<SubmissionState>(
    INITIAL_SUBMISSION_STATE,
  );

  const generated = useStoreGeneratedForm({
    modelName: "Order",
    mode: "UPDATE",
    objectId,
    includeNested: true,
    runtimeOverrides: ORDER_RUNTIME_OVERRIDES,
  });

  const onSubmit = React.useCallback(
    async (values: Record<string, unknown>) => {
      if (!generated.contract) return;

      setSubmission({
        status: "saving",
        message: "Soumission de la mutation de mise à jour de la commande...",
        conflict: false,
        errors: [],
      });

      const operationName = resolveGeneratedMutationOperation(
        generated.contract.mutationBindings,
        "update",
        "Order",
      );

      const mutation = gql(
        buildGeneratedMutationDocument(
          "update",
          operationName,
          "Order",
          "id orderNumber status updatedAt",
        ),
      );

      const submissionValues = generated.buildSubmissionValues(values);
      const nestedPayload = buildNestedMutationPayload(
        submissionValues,
        generated.relations,
      );

      try {
        const result = await client.mutate<{
          response?: GeneratedMutationResponse;
        }>({
          mutation,
          variables: {
            id: objectId,
            input: nestedPayload,
          },
        });

        const response = getMutationResponse(
          result.data as Record<string, unknown> | null | undefined,
        );
        const errors = toSubmissionErrors(response.errors);
        const ok = Boolean(response.ok) && errors.length === 0;

        metrics.recordAttempt({
          ok,
          hadValidationErrors: errors.length > 0,
        });

        setSubmission(
          ok
            ? {
                status: "success",
                message: "Commande mise à jour avec succès.",
                conflict: false,
                errors: [],
              }
            : {
                status: "error",
                message: "Échec de la mise à jour de la commande.",
                conflict: Boolean(response.conflict),
                errors,
              },
        );
      } catch (error) {
        metrics.recordAttempt({
          ok: false,
          hadValidationErrors: false,
        });
        setSubmission({
          status: "error",
          message: toErrorMessage(error),
          conflict: false,
          errors: [],
        });
      }
    },
    [client, generated, metrics, objectId],
  );

  if (!objectId) {
    return (
      <p>
        Veuillez fournir un `objectId` valide pour charger le formulaire de mise
        à jour de commande généré.
      </p>
    );
  }

  if (generated.loading) {
    return <p>Chargement du contrat du formulaire Order généré...</p>;
  }

  if (generated.error) {
    return (
      <p>Échec du chargement du contrat Order : {generated.error.message}</p>
    );
  }

  const snapshot = metrics.getSnapshot();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        Mise à jour de commande Store (Formulaire généré)
      </h2>
      <DynamicForm
        schema={generated.schema}
        behavior={{
          validate: generated.formValidator,
          onSubmit,
        }}
        actions={{
          submitLabel: "Mettre à jour la commande",
          resetLabel: "Réinitialiser",
          showDirtyIndicator: true,
        }}
      />
      {submission.status !== "idle" ? (
        <div className="rounded border border-border p-3 text-sm">
          <p>{submission.message}</p>
          {submission.conflict ? (
            <p className="mt-1 text-destructive">
              Réponse de conflit reçue. Actualisez les données initiales et
              réessayez.
            </p>
          ) : null}
          {submission.errors.length > 0 ? (
            <ul className="mt-2 list-disc pl-5">
              {submission.errors.map((item, index) => (
                <li key={`${item.field ?? "__all__"}-${index}`}>
                  {item.field ? `${item.field}: ` : ""}
                  {item.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Tentatives de soumission : {snapshot.totalSubmissions}, taux de succès
        de correction : {Math.round(snapshot.correctionRate * 100)}%
      </p>
    </section>
  );
}

export function StoreModelTableExamples() {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="mb-2 text-lg font-semibold">Table des produits Store</h2>
        <DynamicModelTable app="store" model="Product" />
      </div>
      <div>
        <h2 className="mb-2 text-lg font-semibold">
          Table des commandes Store
        </h2>
        <DynamicModelTable app="store" model="Order" />
      </div>
    </section>
  );
}

type StoreGeneratedExamplesProps = {
  orderId: string;
  productId?: string;
};

export function StoreGeneratedExamples({
  orderId,
  productId,
}: StoreGeneratedExamplesProps) {
  const resolvedProductId = productId ?? "";

  return (
    <div className="space-y-10">
      {/* 5 ready-to-use ModelForm usages: Product x2, Order x2, OrderItem x1 */}
      <StoreProductCreateModelFormExample />
      <StoreProductUpdateModelFormExample objectId={resolvedProductId} />
      <StoreOrderCreateModelFormExample />
      <StoreOrderViewModelFormExample objectId={orderId} />
      <StoreOrderItemCreateModelFormExample />
      <StoreProductCreateGeneratedFormExample />
      <StoreOrderUpdateGeneratedFormExample objectId={orderId} />
      <StoreModelTableExamples />
    </div>
  );
}

