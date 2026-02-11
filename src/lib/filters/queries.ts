import { gql } from "@apollo/client";

export const FILTER_METADATA_QUERY = gql`
  query FilterMetadata($app: String!, $model: String!) {
    modelSchema(app: $app, model: $model) {
      app
      model
      verboseName
      verboseNamePlural
      fields {
        name
        fieldName
        verboseName
        helpText
        graphqlType
        choices {
          value
          label
          group
        }
        minValue
        maxValue
        isRelation
        isJson
        isIndexed
      }
      relationships {
        name
        verboseName
        relatedApp
        relatedModel
        lookupField
        searchFields
      }
      filterConfig {
        inputTypeName
        supportsAnd
        supportsOr
        supportsNot
        supportsFts
        supportsAggregation
        presets {
          name
          presetName
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
      fieldGroups {
        key
        label
        description
        fields
      }
    }
    filterSchema(app: $app, model: $model) {
      name
      fieldName
      fieldLabel
      baseType
      isNested
      filterInputType
      defaultOperator
      preferredOperators
      datePresets {
        key
        label
        days
        startOfPeriod
      }
      showInQuickFilter
      priority
      options {
        name
        label
        helpText
        choices {
          value
          label
        }
        graphqlType
        isList
      }
    }
  }
`;
