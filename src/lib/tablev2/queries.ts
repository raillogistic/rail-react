import { gql } from "@apollo/client";

export const GET_MODEL_SCHEMA = gql`
  query GetModelSchema($app: String!, $model: String!) {
    modelSchema(app: $app, model: $model) {
      # Identity
      app
      model
      verboseName
      verboseNamePlural
      primaryKey
      ordering

      # Permissions
      permissions {
        canList
        canRetrieve
        canCreate
        canUpdate
        canDelete
        canBulkCreate
        canBulkUpdate
        canBulkDelete
        canExport
        denialReasons
      }

      # Filter Config
      filterConfig {
        style
        argumentName
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
        computedFilters {
          name
          fieldName
          filterType
          description
        }
        dualModeEnabled
      }

      # Fields
      fields {
        name
        fieldName
        verboseName
        helpText
        fieldType
        graphqlType
        required
        nullable
        blank
        editable
        unique

        # Value constraints
        maxLength
        minLength
        maxValue
        minValue
        decimalPlaces
        maxDigits

        # Choices
        choices {
          value
          label
          group
          disabled
        }

        # Defaults
        defaultValue
        hasDefault
        autoNow
        autoNowAdd

        # Flags
        isPrimaryKey
        isIndexed
        isRelation
        isComputed
        isFile
        isImage
        isJson
        isDate
        isDatetime
        isNumeric
        isBoolean
        isText
        isRichText
        isFsmField

        # Validators
        validators {
          type
          params
          message
        }
        regexPattern

        # Permissions
        readable
        writable
        visibility
      }

      # Relationships
      relationships {
        name
        fieldName
        verboseName
        helpText
        relatedApp
        relatedModel
        relatedModelVerbose
        relationType
        isReverse
        isToOne
        isToMany
        onDelete
        relatedName
        required
        nullable
        editable
        lookupField
        searchFields
        readable
        writable
        canCreateInline
      }

      # Filters
      filters {
        name
        fieldName
        fieldLabel
        baseType
        isNested
        relatedModel
        options {
          name
          lookup
          label
          helpText
          graphqlType
          isList
        }
      }

      # Custom
      metadataVersion
      customMetadata
    }
  }
`;
