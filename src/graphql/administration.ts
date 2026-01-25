import { gql } from '@apollo/client';

export const GET_GROUPS = gql`
  query GetGroups {
    groups {
      id
      name
      permissions_count: permissionsCount
      user_set_count: userSetCount
    }
  }
`;

export const GET_GROUP_DETAILS = gql`
  query GetGroupDetails($id: ID!) {
    group(id: $id) {
      id
      name
      permissions {
        id
        name
        codename
        content_type: contentType {
          app_label: appLabel
          model
        }
      }
      user_set: userSet {
        id
        username
        email
        first_name: firstName
        last_name: lastName
        groups {
          id
          name
        }
      }
    }
  }
`;

export const GET_ALL_PERMISSIONS = gql`
  query GetAllPermissions {
    permissions {
      id
      name
      codename
      content_type: contentType {
        app_label: appLabel
        model
      }
    }
  }
`;

export const GET_ALL_USERS = gql`
  query GetAllUsers {
    users {
      id
      username
      email
      first_name: firstName
      last_name: lastName
      groups {
        id
        name
      }
    }
  }
`;

export const CREATE_GROUP = gql`
  mutation CreateGroup($input: CreateGroupInput!) {
    create_group: createGroup(input: $input) {
      response: object {
        id
        name
      }
      errors {
        field
        message
      }
    }
  }
`;

export const UPDATE_GROUP = gql`
  mutation UpdateGroup($input: UpdateGroupInput!) {
    update_group: updateGroup(input: $input) {
      response: object {
        id
        name
        permissions {
            id
        }
      }
      errors {
        field
        message
      }
    }
  }
`;

export const DELETE_GROUP = gql`
  mutation DeleteGroup($id: ID!) {
    delete_group: deleteGroup(id: $id) {
      ok
      errors {
        field
        message
      }
    }
  }
`;

export const UPDATE_USER_GROUPS = gql`
  mutation UpdateUserGroups($input: UpdateUserInput!) {
    update_user: updateUser(input: $input) {
      response: object {
        id
        groups {
          id
          name
        }
      }
      errors {
        field
        message
      }
    }
  }
`;

export const REMOVE_USER_FROM_GROUP = gql`
  mutation RemoveUserFromGroup($input: UpdateUserInput!) {
    update_user: updateUser(input: $input) {
        response: object {
            id
            groups {
                id
            }
        }
        errors {
            field
            message
        }
    }
  }
`;
