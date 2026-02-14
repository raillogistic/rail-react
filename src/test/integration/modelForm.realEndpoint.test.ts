import { describe, expect, it } from "vitest";

import { loadIntegrationAuthConfig } from "./authConfig";
import { createGraphQLAuthClient } from "./graphqlAuthClient";

interface ModelFormContractResponse {
  contract?: {
    appLabel: string;
    modelName: string;
    id: string;
    fields: Array<{ name: string; path: string }>;
    mutationBindings: {
      createOperation: string;
      updateOperation: string;
      updateIdentifierKey?: string | null;
    };
    errorPolicy?: {
      canonicalFormErrorKey?: string | null;
    } | null;
  } | null;
  submit?: {
    appLabel: string;
    modelName: string;
    bindings: {
      createOperation: string;
      updateOperation: string;
      defaultIdentifierKey?: string | null;
      formErrorKey?: string | null;
    };
  } | null;
}

interface ModelPageResponse {
  page?: {
    items?: Array<{ id: string }>;
  } | null;
}

interface ModelFormInitialDataResponse {
  payload?: {
    appLabel: string;
    modelName: string;
    objectId: string;
    values: unknown;
  } | null;
}

const readEnvValue = (key: string): string => {
  const viteEnv = (import.meta.env as Record<string, string | undefined>)[key];
  if (typeof viteEnv === "string" && viteEnv.trim()) return viteEnv.trim();

  const processEnv = typeof process !== "undefined" ? process.env?.[key] : undefined;
  if (typeof processEnv === "string" && processEnv.trim()) return processEnv.trim();

  return "";
};

const MODELFORM_APP_LABEL = readEnvValue("VITE_TEST_MODELFORM_APP_LABEL") || "store";
const MODELFORM_MODEL_NAME = readEnvValue("VITE_TEST_MODELFORM_MODEL_NAME") || "Product";

const toLowerCamel = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return `${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
};

const parseInitialValues = (raw: unknown): Record<string, unknown> => {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "string" && raw.trim()) {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  }
  return {};
};

describe("ModelForm real-endpoint integration", () => {
  it(
    "resolves model form contract and submit bindings on graphql-test",
    async () => {
      const config = loadIntegrationAuthConfig();
      const client = createGraphQLAuthClient(config, {
        workerId: "model-form-contract-worker",
      });

      const query = `
        query ModelFormContractIntegration($appLabel: String!, $modelName: String!) {
          contract: modelFormContract(
            appLabel: $appLabel
            modelName: $modelName
            mode: CREATE
          ) {
            appLabel
            modelName
            id
            fields {
              name
              path
            }
            mutationBindings {
              createOperation
              updateOperation
              updateIdentifierKey
            }
            errorPolicy {
              canonicalFormErrorKey
            }
          }
          submit: modelFormSubmitContract(appLabel: $appLabel, modelName: $modelName) {
            appLabel
            modelName
            bindings {
              createOperation
              updateOperation
              defaultIdentifierKey
              formErrorKey
            }
          }
        }
      `;

      const response = await client.execute<ModelFormContractResponse>(query, {
        appLabel: MODELFORM_APP_LABEL,
        modelName: MODELFORM_MODEL_NAME,
      });

      expect(response.errors).toBeUndefined();
      expect(response.data?.contract?.appLabel).toBe(MODELFORM_APP_LABEL);
      expect(response.data?.contract?.modelName).toBe(MODELFORM_MODEL_NAME);
      expect(response.data?.contract?.id).toContain(`${MODELFORM_APP_LABEL}.${MODELFORM_MODEL_NAME}`);
      expect((response.data?.contract?.fields ?? []).length).toBeGreaterThan(0);
      expect(response.data?.contract?.mutationBindings.createOperation).toBeTruthy();
      expect(response.data?.contract?.mutationBindings.updateOperation).toBeTruthy();

      expect(response.data?.submit?.appLabel).toBe(MODELFORM_APP_LABEL);
      expect(response.data?.submit?.modelName).toBe(MODELFORM_MODEL_NAME);
      expect(response.data?.submit?.bindings.createOperation).toBe(
        response.data?.contract?.mutationBindings.createOperation
      );
      expect(response.data?.submit?.bindings.updateOperation).toBe(
        response.data?.contract?.mutationBindings.updateOperation
      );
    },
    60_000
  );

  it(
    "loads model form initial data for a real record",
    async () => {
      const config = loadIntegrationAuthConfig();
      const client = createGraphQLAuthClient(config, {
        workerId: "model-form-initial-data-worker",
      });

      const pageFieldName = `${toLowerCamel(MODELFORM_MODEL_NAME)}Page`;
      const listQuery = `
        query ModelPageSeed($page: Int!, $perPage: Int!) {
          page: ${pageFieldName}(page: $page, perPage: $perPage) {
            items {
              id
            }
          }
        }
      `;

      const listResponse = await client.execute<ModelPageResponse>(listQuery, {
        page: 1,
        perPage: 1,
      });
      expect(listResponse.errors).toBeUndefined();

      const objectId = listResponse.data?.page?.items?.[0]?.id;
      expect(objectId).toBeTruthy();

      const initialDataQuery = `
        query ModelFormInitialDataIntegration(
          $appLabel: String!
          $modelName: String!
          $objectId: ID!
        ) {
          payload: modelFormInitialData(
            appLabel: $appLabel
            modelName: $modelName
            objectId: $objectId
            includeNested: false
          ) {
            appLabel
            modelName
            objectId
            values
          }
        }
      `;

      const initialDataResponse = await client.execute<ModelFormInitialDataResponse>(
        initialDataQuery,
        {
          appLabel: MODELFORM_APP_LABEL,
          modelName: MODELFORM_MODEL_NAME,
          objectId,
        }
      );

      expect(initialDataResponse.errors).toBeUndefined();
      expect(initialDataResponse.data?.payload?.appLabel).toBe(MODELFORM_APP_LABEL);
      expect(initialDataResponse.data?.payload?.modelName).toBe(MODELFORM_MODEL_NAME);
      expect(initialDataResponse.data?.payload?.objectId).toBe(String(objectId));

      const initialValues = parseInitialValues(initialDataResponse.data?.payload?.values);
      expect(Object.keys(initialValues).length).toBeGreaterThan(0);
    },
    60_000
  );
});
