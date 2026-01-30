import { gql } from "@apollo/client";

export const MODEL_METADATA_QUERY = gql`
  query ModelMetadata($app: String!, $model: String!) {
    modelSchema(app: $app, model: $model) {
      app
      model
      verboseName
      verboseNamePlural
      
      primaryKey
      ordering
      uniqueTogether
      
      fields {
        name
        verboseName
        helpText
        fieldType
        graphqlType
        pythonType
        required
        nullable
        blank
        editable
        unique
        maxLength
        minLength
        maxValue
        minValue
        decimalPlaces
        maxDigits
        choices {
          value
          label
          group
          disabled
        }
        defaultValue
        hasDefault
        autoNow
        autoNowAdd
        validators {
          type
          params
          message
        }
        regexPattern
        readable
        writable
        visibility
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
        fsmTransitions {
          name
          source
          target
          label
          description
          permission
          allowed
        }
        customMetadata
      }
      
      relationships {
        name
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
        throughModel
        required
        nullable
        editable
        lookupField
        searchFields
        readable
        writable
        canCreateInline
        customMetadata
      }
      
      filters {
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
          choices {
            value
            label
          }
          graphqlType
          isList
        }
        filterInputType
        availableOperators
      }
      
      filterConfig {
        style
        argumentName
        inputTypeName
        supportsAnd
        supportsOr
        supportsNot
        dualModeEnabled
        supportsFts
        supportsAggregation
        presets {
          name
          description
          filterJson
        }
        computedFilters {
          name
          filterType
          description
        }
      }
      
      relationFilters {
        relationName
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
        description
        methodName
        inputFields {
          name
          fieldType
          graphqlType
          required
          defaultValue
          description
          choices {
            value
            label
          }
          relatedModel
        }
        allowed
        requiredPermissions
        reason
        # Extra fields matching existing queries
        mutationType
        modelName
        formConfig
        successMessage
        requiresAuthentication
      }
      
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
        description
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
