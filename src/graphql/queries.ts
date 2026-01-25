import { gql } from '@apollo/client';

/**
 * Default ordering applied to paginated queries so the newest records appear first.
 */
export const DEFAULT_PAGINATION_ORDERING: ReadonlyArray<string> = ['-id'];

/**
 * Purpose: GraphQL query to get current authenticated user information with roles and permissions
 * Returns: Current user data including roles and permissions
 */
export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    my_permissions: myPermissions {
      model_name: modelName
      can_create: canCreate
      can_read: canRead
      can_update: canUpdate
      can_delete: canDelete
      can_list: canList
    }
    me {
      id
      username
      email
      first_name: firstName
      last_name: lastName
      is_staff: isStaff
      is_superuser: isSuperuser
      roles {
        id
        name
        permissions {
          id
          name
          codename
        }
      }
      permissions
      settings {
        theme
        mode
        layout
        sidebar_collapse_mode: sidebarCollapseMode
        font_size: fontSize
        font_family: fontFamily
      }
    }
  }
`;

export const GET_CURRENT_USER_RESOLVED = GET_CURRENT_USER;

/**
 * Purpose: GraphQL query to verify token validity with user roles
 * Returns: Token verification status with user roles and permissions
 */


/**
 * TypeScript interfaces for query responses with roles and permissions
 */
export interface Permission {
  id: string;
  name: string;
  codename: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface UserSettings {
  theme: string;
  mode: string;
  layout: string;
  sidebar_collapse_mode: string;
  font_size: string;
  font_family: string;
}

export interface CurrentUserResponse {
  my_permissions?: Array<{
    model_name: string;
    can_create: boolean;
    can_read: boolean;
    can_update: boolean;
    can_delete: boolean;
    can_list: boolean;
  }>;
  me: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    roles: Role[];
    is_staff: boolean;
    is_superuser: boolean;
    permissions?: string[];
    settings?: UserSettings;
  };
}

export interface VerifyTokenResponse {
  verifyToken: {
    valid: boolean;
    user: {
      id: string;
      username: string;
      email: string;
      first_name: string;
      last_name: string;
      roles: Role[];
      is_staff: boolean;
      is_superuser: boolean;
    };
  };
}

/**
 * User interface for consistent typing across the application with RBAC support
 */
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: Role[];
  is_staff: boolean;
  is_superuser: boolean;
  permissions?: string[];
  settings?: UserSettings;
}

//  Model Metadata Integration
/**
```variables
{
  "appName": "myapp",
  "modelName": "User",
  "nestedFields": true,
  "permissionsIncluded": true,
  "maxDepth": 2
}
```
 */
// Enhanced Metadata Query
export const model_metadata = gql`

query ModelMetadata($app_name: String!, $model_name: String!) {
  model_metadata: modelMetadata(appName: $app_name, modelName: $model_name) {
        # Basic model information
    app_name: appName
    model_name: modelName
    verbose_name: verboseName
    verbose_name_plural: verboseNamePlural
    table_name: tableName
    primary_key_field: primaryKeyField
    
    # Model configuration
    abstract
    proxy
    managed
    ordering
    unique_together: uniqueTogether
    
    # Fields metadata
    fields {
      name
      field_type: fieldType
      is_required: isRequired
      is_nullable: isNullable
      null
      default_value: defaultValue
      help_text: helpText
      max_length: maxLength
      choices {
        value
        label
      }
      is_primary_key: isPrimaryKey
      is_foreign_key: isForeignKey
      is_unique: isUnique
      is_indexed: isIndexed
      has_auto_now: hasAutoNow
      has_auto_now_add: hasAutoNowAdd
      blank
      editable
      verbose_name: verboseName
      has_permission: hasPermission
    }
    
    # Relationships metadata
    relationships {
      name
      relationship_type: relationshipType
      related_model: relatedModel {
        app_name: appName
        model_name: modelName
        verbose_name: verboseName
        verbose_name_plural: verboseNamePlural
        table_name: tableName
        primary_key_field: primaryKeyField
        abstract
        proxy
        managed
        ordering
        unique_together: uniqueTogether
        fields {
          name
          field_type: fieldType
          is_required: isRequired
          verbose_name: verboseName
          is_primary_key: isPrimaryKey
          is_foreign_key: isForeignKey
          is_unique: isUnique
        }
      }
      related_app: relatedApp
      to_field: toField
      from_field: fromField
      is_reverse: isReverse
      is_required: isRequired
      many_to_many: manyToMany
      one_to_one: oneToOne
      foreign_key: foreignKey
      on_delete: onDelete
      related_name: relatedName
      has_permission: hasPermission
      verbose_name: verboseName
    }
    
    # Permissions and security
    permissions
    
    # Database indexes
    indexes
    
    # Filtering capabilities
    filters {
      field_name: fieldName
      is_nested: isNested
      related_model: relatedModel
      is_custom: isCustom
      options {
        name
        lookup_expr: lookupExpr
        help_text: helpText
        filter_type: filterType
      }
    }
    
    # Available mutations
    mutations {
      name
      description
      input_fields: inputFields {
        name
        field_type: fieldType
        required
        default_value: defaultValue
        description
        choices
        validation_rules: validationRules
        widget_type: widgetType
        placeholder
        help_text: helpText
        min_length: minLength
        max_length: maxLength
        min_value: minValue
        max_value: maxValue
        pattern
        related_model: relatedModel
        multiple
      }
      return_type: returnType
      requires_authentication: requiresAuthentication
      required_permissions: requiredPermissions
      mutation_type: mutationType
      model_name: modelName
      form_config: formConfig
      validation_schema: validationSchema
      success_message: successMessage
      error_messages: errorMessages
    }
  }  
}
`/**
 ```json
{
  "data": {
    "modelMetadata": {
      "appName": "myapp",
      "modelName": "User",
      "verboseName": "User",
      "verboseNamePlural": "Users",
      "tableName": "myapp_user",
      "primaryKeyField": "id",
      "abstract": false,
      "proxy": false,
      "managed": true,
      "ordering": ["username"],
      "uniqueTogether": [],
      "fields": [
        {
          "name": "id",
          "fieldType": "AutoField",
          "isRequired": true,
          "isNullable": false,
          "null": false,
          "defaultValue": null,
          "helpText": "",
          "maxLength": null,
          "choices": null,
          "isPrimaryKey": true,
          "isForeignKey": false,
          "isUnique": true,
          "isIndexed": true,
          "hasAutoNow": false,
          "hasAutoNowAdd": false,
          "blank": false,
          "editable": false,
          "verboseName": "ID",
          "hasPermission": true
        },
        {
          "name": "username",
          "fieldType": "CharField",
          "isRequired": true,
          "isNullable": false,
          "null": false,
          "defaultValue": null,
          "helpText": "Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.",
          "maxLength": 150,
          "choices": null,
          "isPrimaryKey": false,
          "isForeignKey": false,
          "isUnique": true,
          "isIndexed": true,
          "hasAutoNow": false,
          "hasAutoNowAdd": false,
          "blank": false,
          "editable": true,
          "verboseName": "Username",
          "hasPermission": true
        }
      ],
      "relationships": [
        {
          "name": "profile",
          "relationshipType": "OneToOneField",
          "relatedModel": {
            "appName": "myapp",
            "modelName": "UserProfile",
            "verboseName": "User Profile",
            "verboseNamePlural": "User Profiles",
            "tableName": "myapp_userprofile",
            "primaryKeyField": "id",
            "abstract": false,
            "proxy": false,
            "managed": true,
            "ordering": [],
            "uniqueTogether": [],
            "fields": [
              {
                "name": "id",
                "fieldType": "AutoField",
                "isRequired": true,
                "verboseName": "ID",
                "isPrimaryKey": true,
                "isForeignKey": false,
                "isUnique": true
              }
            ]
          },
          "relatedApp": "myapp",
          "toField": "id",
          "fromField": "profile_id",
          "isReverse": false,
          "isRequired": false,
          "manyToMany": false,
          "oneToOne": true,
          "foreignKey": false,
          "onDelete": "CASCADE",
          "relatedName": "user",
          "hasPermission": true,
          "verboseName": "Profile"
        }
      ],
      "permissions": [
        "myapp.add_user",
        "myapp.change_user",
        "myapp.delete_user",
        "myapp.view_user"
      ],
      "indexes": [
        {
          "fields": ["username"],
          "name": "myapp_user_username_idx",
          "unique": true
        }
      ],
      "filters": [
        {
          "fieldName": "username",
          "isNested": false,
          "relatedModel": null,
          "isCustom": false,
          "options": [
            {
              "name": "username",
              "lookupExpr": "exact",
              "helpText": "Nom d'utilisateur exact",
              "filterType": "CharFilter"
            },
            {
              "name": "username__icontains",
              "lookupExpr": "icontains",
              "helpText": "Nom d'utilisateur contient (insensible à la casse)",
              "filterType": "CharFilter"
            }
          ]
        }
      ],
      "mutations": [
        {
          "name": "createUser",
          "description": "Create a new user",
          "inputFields": [
            {
              "name": "username",
              "fieldType": "String",
              "required": true,
              "defaultValue": null,
              "description": "Username for the user",
              "choices": null,
              "validationRules": {
                "maxLength": 150,
                "pattern": "^[\\w.@+-]+$"
              },
              "widgetType": "TextInput",
              "placeholder": "Enter username",
              "helpText": "Required. 150 characters or fewer.",
              "minLength": 1,
              "maxLength": 150,
              "minValue": null,
              "maxValue": null,
              "pattern": "^[\\w.@+-]+$",
              "relatedModel": null,
              "multiple": false
            }
          ],
          "returnType": "User",
          "requiresAuthentication": true,
          "requiredPermissions": ["myapp.add_user"],
          "mutationType": "create",
          "modelName": "User",
          "formConfig": {
            "layout": "vertical",
            "submitText": "Create User"
          },
          "validationSchema": {
            "username": {
              "required": true,
              "type": "string",
              "maxLength": 150
            }
          },
          "successMessage": "User created successfully",
          "errorMessages": {
            "username": {
              "required": "Username is required",
              "unique": "Username already exists"
            }
          }
        }
      ]
    }
  }
}
``` 
 
 */












export const model_table = gql`
  query form_table(
    $app_name: String!
    $model_name: String!
    $max_depth: Int!
    $custom_fields: [String]
  ) {
    response: modelTable(
      appName: $app_name
      modelName: $model_name
      maxDepth: $max_depth
      customFields: $custom_fields
    ) {
      app
      model
      verboseName
      verboseNamePlural
      tableName
      ordering
      defaultOrdering
      permissions {
        can_create: canCreate
        can_update: canUpdate
        can_delete: canDelete
        can_read: canRead
        can_list: canList
        reasons
      }
      fields {
        name
        accessor
        display
        editable
        field_type: fieldType
        filterable
        sortable
        title
        helpText
        is_property: isProperty
        is_related: isRelated
        permissions {
          can_read: canRead
          can_write: canWrite
          visibility
          access_level: accessLevel
          mask_value: maskValue
          reason
        }
      }
      filters {
        field_name: fieldName
        is_nested: isNested
        related_model: relatedModel
        is_custom: isCustom
        options {
          name
          lookup_expr: lookupExpr
          help_text: helpText
          filter_type: filterType
        }
      }
    }
  }
`;



export const model_form_metadata = gql`
query get_model_form_metadata($app_name: String!, $model_name: String!, $nested_fields: [String]) {
  model_form_metadata: modelFormMetadata(
    appName: $app_name
    modelName: $model_name
    nestedFields: $nested_fields
  ) {
    # Basic model information
    app_name: appName
    model_name: modelName
    verbose_name: verboseName
    verbose_name_plural: verboseNamePlural
    form_title: formTitle
    form_description: formDescription
    
    # Form fields
    fields {
      name
      field_type: fieldType
      is_required: isRequired
      verbose_name: verboseName
      help_text: helpText
      widget_type: widgetType
      placeholder
      default_value: defaultValue
      choices {
        value
        label
      }
      max_length: maxLength
      min_length: minLength
      decimal_places: decimalPlaces
      max_digits: maxDigits
      min_value: minValue
      max_value: maxValue
      auto_now: autoNow
      auto_now_add: autoNowAdd
      blank
      null
      unique
      editable
      validators
      error_messages: errorMessages
      disabled
      readonly
      css_classes: cssClasses
      data_attributes: dataAttributes
      has_permission: hasPermission
      permissions {
        can_read: canRead
        can_write: canWrite
        visibility
        access_level: accessLevel
        mask_value: maskValue
        reason
      }
    }
    
    # Relationship fields
    relationships {
      name
      relationship_type: relationshipType
      verbose_name: verboseName
      help_text: helpText
      widget_type: widgetType
      is_required: isRequired
      related_model: relatedModel
      related_app: relatedApp
      to_field: toField
      from_field: fromField
      many_to_many: manyToMany
      one_to_one: oneToOne
      foreign_key: foreignKey
      is_reverse: isReverse
      multiple
      queryset_filters: querysetFilters
      empty_label: emptyLabel
      limit_choices_to: limitChoicesTo
      disabled
      readonly
      css_classes: cssClasses
      data_attributes: dataAttributes
      permissions {
        can_read: canRead
        can_write: canWrite
        visibility
        access_level: accessLevel
        mask_value: maskValue
        reason
      }
    }
    
    # Nested form metadata
    nested {
      app_name: appName
      model_name: modelName
      verbose_name: verboseName
      verbose_name_plural: verboseNamePlural
      form_title: formTitle
      form_description: formDescription
      fields {
        name
        field_type: fieldType
        is_required: isRequired
        verbose_name: verboseName
        help_text: helpText
        widget_type: widgetType
      }
      relationships {
        name
        relationship_type: relationshipType
        verbose_name: verboseName
        related_model: relatedModel
        related_app: relatedApp
      }
    }
    
    # Form configuration
    field_order: fieldOrder
    exclude_fields: excludeFields
    readonly_fields: readonlyFields
    required_permissions: requiredPermissions
    form_validation_rules: formValidationRules
    form_layout: formLayout
    css_classes: cssClasses
    form_attributes: formAttributes
    permissions {
      can_create: canCreate
      can_update: canUpdate
      can_delete: canDelete
      can_read: canRead
      can_list: canList
      reasons
    }
  }
}
`






/***
 Result example 
```json
{
  "data": {
    "modelFormMetadata": {
      "appName": "myapp",
      "modelName": "User",
      "verboseName": "User",
      "verboseNamePlural": "Users",
      "formTitle": "Form for User",
      "formDescription": "Create or edit user",
      "fields": [
        {
          "name": "username",
          "fieldType": "CharField",
          "isRequired": true,
          "verboseName": "Username",
          "helpText": "Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.",
          "widgetType": "TextInput",
          "placeholder": "Enter username",
          "defaultValue": null,
          "choices": null,
          "maxLength": 150,
          "minLength": 1,
          "decimalPlaces": null,
          "maxDigits": null,
          "minValue": null,
          "maxValue": null,
          "autoNow": false,
          "autoNowAdd": false,
          "blank": false,
          "null": false,
          "unique": true,
          "editable": true,
          "validators": ["validate_username"],
          "errorMessages": {
            "unique": "A user with that username already exists."
          },
          "disabled": false,
          "readonly": false,
          "cssClasses": "form-control",
          "dataAttributes": {
            "validation": "username"
          },
          "hasPermission": true
        },
        {
          "name": "email",
          "fieldType": "EmailField",
          "isRequired": true,
          "verboseName": "Email address",
          "helpText": "Enter a valid email address",
          "widgetType": "EmailInput",
          "placeholder": "user@example.com",
          "defaultValue": null,
          "choices": null,
          "maxLength": 254,
          "minLength": null,
          "decimalPlaces": null,
          "maxDigits": null,
          "minValue": null,
          "maxValue": null,
          "autoNow": false,
          "autoNowAdd": false,
          "blank": false,
          "null": false,
          "unique": true,
          "editable": true,
          "validators": ["validate_email"],
          "errorMessages": {
            "invalid": "Enter a valid email address.",
            "unique": "A user with that email already exists."
          },
          "disabled": false,
          "readonly": false,
          "cssClasses": "form-control",
          "dataAttributes": {
            "validation": "email"
          },
          "hasPermission": true
        }
      ],
      "relationships": [
        {
          "name": "profile",
          "relationshipType": "OneToOneField",
          "verboseName": "Profile",
          "helpText": "User profile information",
          "widgetType": "Select",
          "isRequired": false,
          "relatedModel": "UserProfile",
          "relatedApp": "myapp",
          "toField": "id",
          "fromField": "profile_id",
          "manyToMany": false,
          "oneToOne": true,
          "foreignKey": false,
          "isReverse": false,
          "multiple": false,
          "querysetFilters": null,
          "emptyLabel": "Select profile",
          "limitChoicesTo": null,
          "disabled": false,
          "readonly": false,
          "cssClasses": "form-select",
          "dataAttributes": null,
          "hasPermission": true
        },
        {
          "name": "groups",
          "relationshipType": "ManyToManyField",
          "verboseName": "Groups",
          "helpText": "The groups this user belongs to",
          "widgetType": "CheckboxSelectMultiple",
          "isRequired": false,
          "relatedModel": "Group",
          "relatedApp": "auth",
          "toField": null,
          "fromField": "",
          "manyToMany": true,
          "oneToOne": false,
          "foreignKey": false,
          "isReverse": false,
          "multiple": true,
          "querysetFilters": null,
          "emptyLabel": null,
          "limitChoicesTo": null,
          "disabled": false,
          "readonly": false,
          "cssClasses": "form-check-input",
          "dataAttributes": null,
          "hasPermission": true
        }
      ],
      "nested": [
        {
          "appName": "myapp",
          "modelName": "UserProfile",
          "verboseName": "User Profile",
          "verboseNamePlural": "User Profiles",
          "formTitle": "Form for User Profile",
          "formDescription": "Create or edit user profile",
          "fields": [
            {
              "name": "bio",
              "fieldType": "TextField",
              "isRequired": false,
              "verboseName": "Biography",
              "helpText": "Tell us about yourself",
              "widgetType": "Textarea"
            }
          ],
          "relationships": []
        }
      ],
      "fieldOrder": ["username", "email", "first_name", "last_name"],
      "excludeFields": ["id", "password", "last_login", "date_joined"],
      "readonlyFields": ["id", "date_joined", "last_login"],
      "requiredPermissions": ["myapp.add_user", "myapp.change_user"],
      "formValidationRules": {
        "username": {
          "required": true,
          "minLength": 1,
          "maxLength": 150,
          "pattern": "^[\\w.@+-]+$"
        },
        "email": {
          "required": true,
          "type": "email"
        }
      },
      "formLayout": {
        "sections": [
          {
            "title": "Basic Information",
            "fields": ["username", "email", "first_name", "last_name"]
          },
          {
            "title": "Permissions",
            "fields": ["groups", "user_permissions"]
          }
        ]
      },
      "cssClasses": "user-form",
      "formAttributes": {
        "enctype": "multipart/form-data",
        "method": "POST"
      }
    }
  }
}
 */
