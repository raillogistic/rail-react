import { describe, expect, it } from "vitest";

import type { ModelFormContractRelation } from "@/lib/form/types/generatedContract";
import { buildNestedMutationPayload } from "@/lib/form/utils/nestedMutationPayload";

import { loadIntegrationAuthConfig } from "./authConfig";
import { createGraphQLAuthClient } from "./graphqlAuthClient";

type MutationError = {
  field?: string | null;
  message?: string | null;
  code?: string | null;
};

type ContractResponse = {
  contract?: {
    relations?: ModelFormContractRelation[] | null;
  } | null;
};

type RelationInputIntrospectionResponse = {
  relationInputType?: {
    inputFields?: Array<{ name?: string | null } | null> | null;
  } | null;
};

type CreateTagResponse = {
  createTag?: {
    ok: boolean;
    object?: { id: string } | null;
    errors?: MutationError[] | null;
  } | null;
};

type ProductPageResponse = {
  page?: {
    items?: Array<{
      id: string;
      category?: { id: string } | null;
      tags?: Array<{ id: string; name: string }> | null;
    }> | null;
  } | null;
};

type UpdateProductResponse = {
  updateProduct?: {
    ok: boolean;
    object?: {
      id: string;
      category?: { id: string } | null;
      tags?: Array<{ id: string; name: string }>;
    } | null;
    errors?: MutationError[] | null;
  } | null;
};

const readEnvValue = (key: string): string => {
  const viteEnv = (import.meta.env as Record<string, string | undefined>)[key];
  if (typeof viteEnv === "string" && viteEnv.trim()) return viteEnv.trim();

  const processEnv = typeof process !== "undefined" ? process.env?.[key] : undefined;
  if (typeof processEnv === "string" && processEnv.trim()) return processEnv.trim();

  return "";
};

const MODELFORM_APP_LABEL = readEnvValue("VITE_TEST_MODELFORM_APP_LABEL") || "store";
const MODELFORM_MODEL_NAME = readEnvValue("VITE_TEST_MODELFORM_MODEL_NAME") || "Product";

const uniqueToken = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const CONTRACT_QUERY = `
  query ModelFormRelationContract($appLabel: String!, $modelName: String!) {
    contract: modelFormContract(
      appLabel: $appLabel
      modelName: $modelName
      mode: UPDATE
      includeNested: true
    ) {
      relations {
        name
        path
        toMany
        policy {
          path
          allowedActions
          blockedActions
          nestedEnabled
        }
      }
    }
  }
`;

const RELATION_INPUT_QUERY = `
  query RelationInputType($name: String!) {
    relationInputType: __type(name: $name) {
      inputFields {
        name
      }
    }
  }
`;

const PRODUCT_PAGE_QUERY = `
  query ProductSeedPage($page: Int!, $perPage: Int!) {
    page: productPage(page: $page, perPage: $perPage) {
      items {
        id
        category {
          id
        }
        tags {
          id
          name
        }
      }
    }
  }
`;

const CREATE_TAG_MUTATION = `
  mutation CreateTagForModelFormCompat($input: CreateTagInput!) {
    createTag(input: $input) {
      ok
      object {
        id
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

const UPDATE_PRODUCT_MUTATION = `
  mutation UpdateProductForModelFormCompat($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      ok
      object {
        id
        category {
          id
        }
        tags {
          id
          name
        }
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

const assertMutationSuccess = (
  payload:
    | {
        ok?: boolean | null;
        object?: { id?: string | null } | null;
        errors?: MutationError[] | null;
      }
    | null
    | undefined,
  context: string,
) => {
  expect(payload, `${context}: missing payload`).toBeTruthy();
  expect(payload?.ok, `${context}: mutation returned ok=false`).toBe(true);
  expect(payload?.errors ?? [], `${context}: mutation returned errors`).toEqual([]);
  const objectId = String(payload?.object?.id ?? "").trim();
  expect(objectId, `${context}: missing object id`).toBeTruthy();
  return objectId;
};

const assertUpdateSuccess = (
  payload: UpdateProductResponse["updateProduct"] | null | undefined,
  context: string,
) => {
  expect(payload, `${context}: missing payload`).toBeTruthy();
  expect(payload?.ok, `${context}: mutation returned ok=false`).toBe(true);
  expect(payload?.errors ?? [], `${context}: mutation returned errors`).toEqual([]);
};

const pickSeedProduct = (response: ProductPageResponse): { id: string } => {
  const item = response.page?.items?.[0];
  expect(item?.id, "productPage returned no seed product").toBeTruthy();
  return {
    id: String(item?.id ?? ""),
  };
};

describe("ModelForm real-endpoint mutation compatibility", () => {
  it(
    "blocks singular null relation normalization when real contract forbids disconnect",
    async () => {
      const config = loadIntegrationAuthConfig();
      const client = createGraphQLAuthClient(config, {
        workerId: "model-form-null-compat-worker",
      });

      const contractResponse = await client.execute<ContractResponse>(CONTRACT_QUERY, {
        appLabel: MODELFORM_APP_LABEL,
        modelName: MODELFORM_MODEL_NAME,
      });
      const relationInputResponse =
        await client.execute<RelationInputIntrospectionResponse>(RELATION_INPUT_QUERY, {
          name: "ProductCategoryRelationInput",
        });

      expect(contractResponse.errors).toBeUndefined();
      expect(relationInputResponse.errors).toBeUndefined();
      const relations = contractResponse.data?.contract?.relations ?? [];
      const categoryRelation = relations.find((relation) => relation.name === "category");
      expect(categoryRelation).toBeTruthy();
      expect(categoryRelation?.policy?.blockedActions ?? []).toContain("DISCONNECT");
      const categoryInputFields = (
        relationInputResponse.data?.relationInputType?.inputFields ?? []
      )
        .map((field) => String(field?.name ?? "").trim())
        .filter(Boolean);
      expect(categoryInputFields).not.toContain("disconnect");
      expect(categoryInputFields).not.toContain("set");

      expect(() =>
        buildNestedMutationPayload(
          { category: null },
          relations,
          "UPDATE",
        ),
      ).toThrowError(/DISCONNECT/i);
    },
    60_000,
  );

  it(
    "normalizes nested update identity aliases to id before update mutation dispatch",
    async () => {
      const config = loadIntegrationAuthConfig();
      const client = createGraphQLAuthClient(config, {
        workerId: "model-form-id-alias-compat-worker",
      });

      const [contractResponse, productPageResponse] = await Promise.all([
        client.execute<ContractResponse>(CONTRACT_QUERY, {
          appLabel: MODELFORM_APP_LABEL,
          modelName: MODELFORM_MODEL_NAME,
        }),
        client.execute<ProductPageResponse>(PRODUCT_PAGE_QUERY, {
          page: 1,
          perPage: 1,
        }),
      ]);

      expect(contractResponse.errors).toBeUndefined();
      expect(productPageResponse.errors).toBeUndefined();
      const relations = contractResponse.data?.contract?.relations ?? [];
      const seed = pickSeedProduct(productPageResponse.data ?? {});

      const suffix = uniqueToken();
      const tagResponse = await client.execute<CreateTagResponse>(CREATE_TAG_MUTATION, {
        input: {
          name: `Compat Tag ${suffix}`,
        },
      });
      expect(tagResponse.errors).toBeUndefined();
      const tagId = assertMutationSuccess(tagResponse.data?.createTag, "createTag");

      const connectResponse = await client.execute<UpdateProductResponse>(
        UPDATE_PRODUCT_MUTATION,
        {
          id: seed.id,
          input: { tags: { connect: [tagId] } },
        },
      );
      expect(connectResponse.errors).toBeUndefined();
      assertUpdateSuccess(connectResponse.data?.updateProduct, "updateProduct connect tag");

      const updatedTagName = `Compat Tag Updated ${suffix}`;

      try {
        const payload = buildNestedMutationPayload(
          {
            tags: [{ pk: tagId, name: updatedTagName }],
          },
          relations,
          "UPDATE",
        );

        const tagsPayload = payload.tags as
          | { update?: Array<Record<string, unknown>> }
          | undefined;
        const firstUpdate = tagsPayload?.update?.[0] ?? {};
        expect(firstUpdate.id).toBe(tagId);
        expect(firstUpdate).not.toHaveProperty("pk");
        expect(firstUpdate).not.toHaveProperty("objectId");
        expect(firstUpdate).not.toHaveProperty("object_id");

        const updateResponse = await client.execute<UpdateProductResponse>(
          UPDATE_PRODUCT_MUTATION,
          {
            id: seed.id,
            input: payload,
          },
        );

        expect(updateResponse.errors).toBeUndefined();
        assertUpdateSuccess(updateResponse.data?.updateProduct, "updateProduct nested tag update");

        const tagNames = (updateResponse.data?.updateProduct?.object?.tags ?? []).map(
          (item) => item.name,
        );
        expect(tagNames).toContain(updatedTagName);
      } finally {
        await client.execute<UpdateProductResponse>(UPDATE_PRODUCT_MUTATION, {
          id: seed.id,
          input: { tags: { disconnect: [tagId] } },
        });
      }
    },
    60_000,
  );
});
