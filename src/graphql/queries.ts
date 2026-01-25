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
    my_permissions {
      model_name
      can_create
      can_read
      can_update
      can_delete
      can_list
    }
    me {
      id
      username
      email
      first_name
      last_name
      is_staff
      is_superuser
      permissions
      settings {
        theme
        mode
        layout
        sidebar_collapse_mode
        font_size
        font_family
      }
    }
  }
`;

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
  model_metadata(app_name: $app_name, model_name: $model_name) {
        # Basic model information
    app_name
    model_name
    verbose_name
    verbose_name_plural
    table_name
    primary_key_field
    
    # Model configuration
    abstract
    proxy
    managed
    ordering
    unique_together
    
    # Fields metadata
    fields {
      name
      field_type
      is_required
      is_nullable
      null
      default_value
      help_text
      max_length
      choices {
        value
        label
      }
      is_primary_key
      is_foreign_key
      is_unique
      is_indexed
      has_auto_now
      has_auto_now_add
      blank
      editable
      verbose_name
      has_permission
    }
    
    # Relationships metadata
    relationships {
      name
      relationship_type
      related_model {
        app_name
        model_name
        verbose_name
        verbose_name_plural
        table_name
        primary_key_field
        abstract
        proxy
        managed
        ordering
        unique_together
        fields {
          name
          field_type
          is_required
          verbose_name
          is_primary_key
          is_foreign_key
          is_unique
        }
      }
      related_app
      to_field
      from_field
      is_reverse
      is_required
      many_to_many
      one_to_one
      foreign_key
      on_delete
      related_name
      has_permission
      verbose_name
    }
    
    # Permissions and security
    permissions
    
    # Database indexes
    indexes
    
    # Filtering capabilities
    filters {
      field_name
      is_nested
      related_model
      is_custom
      options {
        name
        lookup_expr
        help_text
        filter_type
      }
    }
    
    # Available mutations
    mutations {
      name
      description
      input_fields {
        name
        field_type
        required
        default_value
        description
        choices
        validation_rules
        widget_type
        placeholder
        help_text
        min_length
        max_length
        min_value
        max_value
        pattern
        related_model
        multiple
      }
      return_type
      requires_authentication
      required_permissions
      mutation_type
      model_name
      form_config
      validation_schema
      success_message
      error_messages
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
  query form_table($app_name: String!, $model_name: String!, $max_depth: Int!, $custom_fields: [String]){
    response:model_table(
      app_name: $app_name
      model_name: $model_name
      max_depth: $max_depth
      custom_fields: $custom_fields
    ){
      	app
      model
      verboseName
      verboseNamePlural
      tableName
      ordering
      defaultOrdering
      permissions {
        can_create
        can_update
        can_delete
        can_read
        can_list
        reasons
      }
      
        fields{
        name
        accessor
          display
        editable
        field_type
        filterable
        sortable
        title
        helpText
        is_property
        is_related
        permissions {
          can_read
          can_write
          visibility
          access_level
          mask_value
          reason
        }
    }
      filters {
      field_name
      is_nested
      related_model
      is_custom
      options {
        name
        lookup_expr
        help_text
        filter_type
      }
    }
    }
  }
`



export const model_form_metadata = gql`
query get_model_form_metadata($app_name: String!, $model_name: String!, $nested_fields: [String]) {
  model_form_metadata(
    app_name: $app_name
    model_name: $model_name
    nested_fields: $nested_fields
  ) {
    # Basic model information
    app_name
    model_name
    verbose_name
    verbose_name_plural
    form_title
    form_description
    
    # Form fields
    fields {
      name
      field_type
      is_required
      verbose_name
      help_text
      widget_type
      placeholder
      default_value
      choices {
        value
        label
      }
      max_length
      min_length
      decimal_places
      max_digits
      min_value
      max_value
      auto_now
      auto_now_add
      blank
      null
      unique
      editable
      validators
      error_messages
      disabled
      readonly
      css_classes
      data_attributes
      has_permission
      permissions {
        can_read
        can_write
        visibility
        access_level
        mask_value
        reason
      }
    }
    
    # Relationship fields
    relationships {
      name
      relationship_type
      verbose_name
      help_text
      widget_type
      is_required
      related_model
      related_app
      to_field
      from_field
      many_to_many
      one_to_one
      foreign_key
      is_reverse
      multiple
      queryset_filters
      empty_label
      limit_choices_to
      disabled
      readonly
      css_classes
      data_attributes
      permissions {
        can_read
        can_write
        visibility
        access_level
        mask_value
        reason
      }
    }
    
    # Nested form metadata
    nested {
      app_name
      model_name
      verbose_name
      verbose_name_plural
      form_title
      form_description
      fields {
        name
        field_type
        is_required
        verbose_name
        help_text
        widget_type
      }
      relationships {
        name
        relationship_type
        verbose_name
        related_model
        related_app
      }
    }
    
    # Form configuration
    field_order
    exclude_fields
    readonly_fields
    required_permissions
    form_validation_rules
    form_layout
    css_classes
    form_attributes
    permissions {
      can_create
      can_update
      can_delete
      can_read
      can_list
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
