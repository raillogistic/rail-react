import { gql } from "@apollo/client";

export const GET_MODEL_FORM_SCHEMA = gql`
  query GetModelFormSchema($app: String!, $model: String!, $objectId: ID) {
    modelSchema(app: $app, model: $model, objectId: $objectId) {
      app
      model
      verboseName
      verboseNamePlural
      primaryKey
      ordering
      uniqueTogether
      metadataVersion
      customMetadata
      fieldGroups {
        key
        label
        description
        fields
        collapsed
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
          relatedModel
        }
        allowed
        requiredPermissions
        reason
        mutationType
        modelName
        requiresAuthentication
      }
    }
  }
`;
