import { gql } from "@apollo/client";

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
        relatedAppLabel
        relatedModelName
        policy {
          path
          allowedActions
          blockedActions
          nestedEnabled
        }
        nestedForm
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
    }
  }
`;

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
          relatedAppLabel
          relatedModelName
          policy {
            path
            allowedActions
            blockedActions
            nestedEnabled
          }
          nestedForm
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
      }
    }
  }
`;

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
