import { describe, expect, it } from "vitest";

import { mapV2MetadataToTableMetadata } from "@/lib/table/compat/hooks";
import { buildModelQueryField } from "@/lib/table/utils/queryNaming";

import { loadIntegrationAuthConfig } from "./authConfig";
import { createGraphQLAuthClient } from "./graphqlAuthClient";

type AvailableModelsResponse = {
  availableModels: Array<{ app: string; model: string }>;
};

type ModelSchemaResponse = {
  modelSchema: {
    app: string;
    model: string;
    verboseName: string;
    verboseNamePlural: string;
    primaryKey: string;
    ordering: string[];
    fields: Array<{
      name: string;
      fieldName?: string;
      verboseName: string;
      helpText?: string;
      fieldType: string;
      editable: boolean;
      isRelation: boolean;
      visibility: string;
    }>;
    relationships: Array<{
      name: string;
      fieldName?: string;
      verboseName: string;
      relatedApp: string;
      relatedModel: string;
      relationType: string;
      isToMany: boolean;
      lookupField: string;
      searchFields?: string[];
    }>;
    filters: Array<{
      fieldName: string;
      fieldLabel: string;
      baseType?: string;
      isNested: boolean;
      relatedModel?: string;
      filterInputType?: string;
      availableOperators?: string[];
      options: Array<{
        name: string;
        lookup: string;
        label: string;
        helpText?: string;
        graphqlType?: string;
        isList?: boolean;
        choices?: Array<{ value: string; label: string }>;
      }>;
    }>;
    filterConfig?: {
      style?: string;
      argumentName?: string;
      inputTypeName?: string;
      supportsAnd?: boolean;
      supportsOr?: boolean;
      supportsNot?: boolean;
      supportsQuick?: boolean;
      supportsFts?: boolean;
      supportsAggregation?: boolean;
      presets?: Array<{
        name: string;
        description?: string;
        filterJson: string;
      }>;
    };
    relationFilters?: Array<{
      name?: string;
      fieldName?: string;
      relationType: string;
      supportsSome: boolean;
      supportsEvery: boolean;
      supportsNone: boolean;
      supportsCount: boolean;
      nestedFilterType?: string;
    }>;
    fieldGroups?: Array<{
      key: string;
      label: string;
      description?: string;
      fields: string[];
      collapsed?: boolean;
    }>;
    templates?: Array<{
      key: string;
      title: string;
      endpoint: string;
      urlPath?: string;
      guard?: string | null;
      requireAuthentication?: boolean;
      roles?: string[];
      permissions?: string[];
      allowed?: boolean;
      denialReason?: string | null;
      allowClientData?: boolean;
      clientDataFields?: string[];
      clientDataSchema?: unknown;
    }>;
    mutations: Array<{
      name: string;
      operation?: string;
      methodName?: string;
      description?: string;
      inputFields?: Array<{
        name: string;
        fieldType: string;
        required: boolean;
        defaultValue?: unknown;
        description?: string;
        choices?: Array<{ value: string; label: string }>;
        relatedModel?: string;
      }>;
      requiresAuthentication?: boolean;
      requiredPermissions?: string[];
      mutationType?: string;
      modelName?: string;
      allowed?: boolean;
      reason?: string;
    }>;
    permissions: {
      canCreate: boolean;
      canUpdate: boolean;
      canDelete: boolean;
      canRetrieve: boolean;
      canList: boolean;
      canBulkCreate: boolean;
      canBulkUpdate: boolean;
      canBulkDelete: boolean;
      canExport: boolean;
      denialReasons?: string;
    };
    metadataVersion: string;
    customMetadata?: string;
  } | null;
};

const AVAILABLE_MODELS_QUERY = `
  query AvailableModels {
    availableModels {
      app
      model
    }
  }
`;

const TABLE_MODEL_METADATA_QUERY = `
  query TableModelMetadata($app: String!, $model: String!) {
    modelSchema(app: $app, model: $model) {
      app
      model
      verboseName
      verboseNamePlural
      primaryKey
      ordering
      fields {
        name
        fieldName
        verboseName
        helpText
        fieldType
        editable
        isRelation
        visibility
      }
      relationships {
        name
        fieldName
        verboseName
        relatedApp
        relatedModel
        relationType
        isToMany
        lookupField
        searchFields
      }
      filters {
        fieldName
        fieldLabel
        baseType
        isNested
        relatedModel
        filterInputType
        availableOperators
        options {
          name
          lookup
          label
          helpText
          graphqlType
          isList
          choices {
            value
            label
          }
        }
      }
      filterConfig {
        style
        argumentName
        inputTypeName
        supportsAnd
        supportsOr
        supportsNot
        supportsQuick
        supportsFts
        supportsAggregation
        presets {
          name
          description
          filterJson
        }
      }
      relationFilters {
        name
        fieldName
        relationType
        supportsSome
        supportsEvery
        supportsNone
        supportsCount
        nestedFilterType
      }
      mutations {
        name
        operation
        methodName
        description
        inputFields {
          name
          fieldType
          required
          defaultValue
          description
          choices {
            value
            label
          }
          relatedModel
        }
        requiresAuthentication
        requiredPermissions
        mutationType
        modelName
        allowed
        reason
      }
      permissions {
        canCreate
        canUpdate
        canDelete
        canRetrieve
        canList
        canBulkCreate
        canBulkUpdate
        canBulkDelete
        canExport
        denialReasons
      }
      fieldGroups {
        key
        label
        description
        fields
        collapsed
      }
      templates {
        key
        title
        endpoint
        urlPath
        guard
        requireAuthentication
        roles
        permissions
        allowed
        denialReason
        allowClientData
        clientDataFields
        clientDataSchema
      }
      metadataVersion
      customMetadata
    }
  }
`;

const buildPageProbeQuery = (
  queryField: string,
  whereInputType: string,
  includeQuick: boolean,
) => {
  const quickVariable = includeQuick ? "$quick: String\n" : "";
  const quickArgument = includeQuick ? "quick: $quick\n" : "";
  return `
    query TablePageProbe(
      $page: Int
      $perPage: Int
      $orderBy: [String]
      ${quickVariable}$where: ${whereInputType}
      $presets: [String]
      $distinctOn: [String]
      $skipCount: Boolean
    ) {
      ${queryField}(
        page: $page
        perPage: $perPage
        orderBy: $orderBy
        ${quickArgument}where: $where
        presets: $presets
        distinctOn: $distinctOn
        skipCount: $skipCount
      ) {
        pageInfo {
          totalCount
          pageCount
          currentPage
          perPage
          hasNextPage
          hasPreviousPage
        }
        items {
          id
          desc
        }
      }
    }
  `;
};

describe("table/model-table real API compatibility", () => {
  it(
    "discovers a listable model and executes its <model>Page contract",
    async () => {
      const config = loadIntegrationAuthConfig();
      const client = createGraphQLAuthClient(config, {
        workerId: "table-contract-worker",
      });

      const modelsResponse = await client.execute<AvailableModelsResponse>(
        AVAILABLE_MODELS_QUERY,
      );
      expect(modelsResponse.errors).toBeUndefined();
      const candidates = modelsResponse.data?.availableModels ?? [];
      expect(candidates.length).toBeGreaterThan(0);

      let matched:
        | {
            app: string;
            model: string;
            queryField: string;
            pageInfo: {
              currentPage: number;
              perPage: number;
            };
            items: Array<Record<string, unknown>>;
          }
        | undefined;

      for (const candidate of candidates.slice(0, 25)) {
        const metadataResponse = await client.execute<ModelSchemaResponse>(
          TABLE_MODEL_METADATA_QUERY,
          {
            app: candidate.app,
            model: candidate.model,
          },
        );
        if (metadataResponse.errors?.length) continue;

        const schema = metadataResponse.data?.modelSchema;
        if (!schema?.permissions?.canList) continue;

        const mapped = mapV2MetadataToTableMetadata(schema as any);
        if (!mapped.fields.length) continue;

        const queryField = buildModelQueryField(schema.model, "page");
        const whereInputType =
          schema.filterConfig?.inputTypeName ?? `${schema.model}WhereInput`;
        const includeQuick = Boolean(schema.filterConfig?.supportsQuick);

        const pageQuery = buildPageProbeQuery(
          queryField,
          whereInputType,
          includeQuick,
        );

        const pageResponse = await client.execute<Record<string, unknown>>(
          pageQuery,
          {
            page: 1,
            perPage: 1,
            skipCount: true,
            ...(includeQuick ? { quick: "" } : {}),
          },
        );

        if (pageResponse.errors?.length) continue;

        const payload = (pageResponse.data as Record<string, any> | undefined)?.[
          queryField
        ];
        if (!payload?.pageInfo || !Array.isArray(payload.items)) continue;

        matched = {
          app: candidate.app,
          model: candidate.model,
          queryField,
          pageInfo: {
            currentPage: payload.pageInfo.currentPage,
            perPage: payload.pageInfo.perPage,
          },
          items: payload.items,
        };
        break;
      }

      expect(matched).toBeDefined();
      expect(matched?.queryField).toBeTruthy();
      expect(matched?.pageInfo.currentPage).toBe(1);
      expect(matched?.pageInfo.perPage).toBe(1);
      expect(Array.isArray(matched?.items)).toBe(true);
    },
    90_000,
  );
});
