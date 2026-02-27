import { gql } from "@apollo/client";

/**
 * Shared selection set for model form contract fields.
 * Keep this in one place so single/batch contract queries stay in sync.
 */
const MODEL_FORM_CONTRACT_FIELDS_SELECTION = `
      id
      appLabel
      modelName
      mode
      version
      configVersion
      generatedAt
      fields {
        name
        path
        fieldName
        label
        kind
        graphqlType
        pythonType
        required
        nullable
        readOnly
        hidden
        defaultValue
        constraints
        validators {
          type
          message
          params
        }
        ui
        metadata
        readable
        writable
        visibility
      }
      sections {
        id
        title
        description
        fieldPaths
        order
        layout
        visible
      }
      relations {
        name
        path
        label
        toMany
        required
        nullable
        relatedAppLabel
        relatedModelName
        readable
        writable
        policy {
          path
          allowedActions
          blockedActions
          nestedEnabled
        }
        nestedForm
      }
      permissions {
        canCreate
        canUpdate
        canDelete
        canView
        create {
          allowed
          requiredPermissions
          requiresAuthentication
          reason
        }
        update {
          allowed
          requiredPermissions
          requiresAuthentication
          reason
        }
        delete {
          allowed
          requiredPermissions
          requiresAuthentication
          reason
        }
        view {
          allowed
          requiredPermissions
          requiresAuthentication
          reason
        }
        fieldPermissions {
          field
          canRead
          canWrite
          visibility
        }
      }
      mutationBindings {
        createOperation
        updateOperation
        bulkCreateOperation
        bulkUpdateOperation
        updateIdentifierKey
        updateTargetPolicy
        bulkCommitPolicy
        conflictPolicy
      }
      errorPolicy {
        canonicalFormErrorKey
        fieldPathNotation
        bulkRowPrefixPattern
      }
`;

/**
 * GraphQL document for a single model form contract.
 *
 * Defaults:
 * - `mode`: `CREATE`
 * - `includeNested`: `false`
 */
export const MODEL_FORM_CONTRACT_QUERY = gql`
  query ModelFormContract(
    $appLabel: String!
    $modelName: String!
    $mode: ModelFormMode = CREATE
    $includeNested: Boolean = false
  ) {
    modelFormContract(
      appLabel: $appLabel
      modelName: $modelName
      mode: $mode
      includeNested: $includeNested
    ) {
${MODEL_FORM_CONTRACT_FIELDS_SELECTION}
    }
  }
`;

/**
 * GraphQL document for paginated model form contracts.
 *
 * Defaults:
 * - `page`: `1`
 * - `perPage`: `50`
 * - `mode`: `CREATE`
 * - `includeNested`: `false`
 */
export const MODEL_FORM_CONTRACT_PAGES_QUERY = gql`
  query ModelFormContractPages(
    $page: Int = 1
    $perPage: Int = 50
    $models: [ModelRefInput!]
    $mode: ModelFormMode = CREATE
    $includeNested: Boolean = false
  ) {
    modelFormContractPages(
      page: $page
      perPage: $perPage
      models: $models
      mode: $mode
      includeNested: $includeNested
    ) {
      page
      perPage
      total
      results {
${MODEL_FORM_CONTRACT_FIELDS_SELECTION}
      }
    }
  }
`;

/**
 * GraphQL document used to fetch initial values for update/view model form modes.
 */
export const MODEL_FORM_INITIAL_DATA_QUERY = gql`
  query ModelFormInitialData(
    $appLabel: String!
    $modelName: String!
    $objectId: ID!
    $includeNested: Boolean = false
    $nestedFields: [String!]
    $runtimeOverrides: [ModelFormRuntimeOverrideInput!]
  ) {
    modelFormInitialData(
      appLabel: $appLabel
      modelName: $modelName
      objectId: $objectId
      includeNested: $includeNested
      nestedFields: $nestedFields
      runtimeOverrides: $runtimeOverrides
    ) {
      appLabel
      modelName
      objectId
      values
      readonlyValues
      loadedAt
    }
  }
`;

/**
 * GraphQL document for operation binding metadata used by submit orchestration.
 */
export const MODEL_FORM_SUBMIT_CONTRACT_QUERY = gql`
  query ModelFormSubmitContract($appLabel: String!, $modelName: String!) {
    modelFormSubmitContract(appLabel: $appLabel, modelName: $modelName) {
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
