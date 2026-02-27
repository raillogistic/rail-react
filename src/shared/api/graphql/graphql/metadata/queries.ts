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

export const TABLE_MODEL_METADATA_QUERY = gql`
  query TableModelMetadata($app: String!, $model: String!, $objectId: ID) {
    modelSchema(app: $app, model: $model, objectId: $objectId) {
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
        graphqlType
        required
        nullable
        blank
        editable
        unique
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
        customMetadata
      }
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
          choices {
            value
            label
            group
            disabled
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
        supportsQuick
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
        description
        methodName
        inputFields {
          name
          fieldName
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
        inputType
        returnType
        allowed
        requiredPermissions
        reason
        mutationType
        modelName
        formConfig
        successMessage
        errorMessages
        action
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
        templateType
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

export const MODEL_METADATA_QUERY = gql`
  query ModelMetadata($app: String!, $model: String!, $objectId: ID) {
    modelSchema(app: $app, model: $model, objectId: $objectId) {
      app
      model
      verboseName
      verboseNamePlural
      
      primaryKey
      ordering
      uniqueTogether
      
      fields {
        name
        fieldName
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
        throughModel
        required
        nullable
        editable
        lookupField
        searchFields
        readable
        writable
        canCreateInline
        relationOperations
        customMetadata
      }
      
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
          choices {
            value
            label
            group
            disabled
          }
          graphqlType
          isList
        }
        filterInputType
        availableOperators
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
      }
      
      filterConfig {
        style
        argumentName
        inputTypeName
        supportsAnd
        supportsOr
        supportsNot
        dualModeEnabled
        supportsQuick
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
        description
        methodName
        inputFields {
          name
          fieldName
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
        inputType
        returnType
        allowed
        requiredPermissions
        reason
        # Extra fields matching existing queries
        mutationType
        modelName
        formConfig
        successMessage
        errorMessages
        action
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
        templateType
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


