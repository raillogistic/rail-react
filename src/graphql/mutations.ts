import { gql } from '@apollo/client';

/**
 * Purpose: GraphQL mutation for user authentication
 * Args: username (string), password (string)
 * Returns: Authentication response with token and user data
 */
export const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      ok
      errors
      token
      refresh_token: refreshToken
      permissions
      user {
        id
        username
        email
        first_name: firstName
        last_name: lastName
      }
    }
  }
`;

/**
 * Purpose: GraphQL mutation for refreshing authentication token
 * Args: refresh_token (string, optional when HttpOnly cookies are used)
 * Returns: New token and refresh token
 */
export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($refresh_token: String) {
    refresh_token: refreshToken(refreshToken: $refresh_token) {
      ok
      errors
      token
      refresh_token: refreshToken
      permissions
    }
  }
`;

/**
 * Purpose: GraphQL mutation for user logout
 * Returns: Success status
 */
export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      ok
      errors
    }
  }
`;

/**
 * TypeScript interfaces for mutation responses
 */
export interface LoginResponse {
  login: {
    ok: boolean;
    errors?: string[];
    token: string;
    refresh_token: string;
    permissions?: string[];
    user: {
      id: string;
      username: string;
      email: string;
      first_name: string;
      last_name: string;
    };
  };
}

export interface RefreshTokenResponse {
  refresh_token: {
    ok: boolean;
    errors?: string[];
    token: string;
    refresh_token: string;
    permissions?: string[];
  };
}

export interface RefreshTokenVariables {
  refresh_token?: string | null;
}

export interface LogoutResponse {
  logout: {
    ok: boolean;
    errors: string[];
  };
}

/**
 * TypeScript interfaces for mutation variables
 */
export interface LoginVariables {
  username: string;
  password: string;
}

export const UPDATE_MY_SETTINGS_MUTATION = gql`
  mutation UpdateMySettings(
    $theme: String
    $mode: String
    $layout: String
    $sidebar_collapse_mode: String
    $font_size: String
    $font_family: String
  ) {
    update_my_settings: updateMySettings(
      theme: $theme
      mode: $mode
      layout: $layout
      sidebarCollapseMode: $sidebar_collapse_mode
      fontSize: $font_size
      fontFamily: $font_family
    ) {
      ok
      errors
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

export const LOGIN_MUTATION_RESOLVED = LOGIN_MUTATION;
export const REFRESH_TOKEN_MUTATION_RESOLVED = REFRESH_TOKEN_MUTATION;
export const UPDATE_MY_SETTINGS_MUTATION_RESOLVED = UPDATE_MY_SETTINGS_MUTATION;

export interface UpdateMySettingsResponse {
  update_my_settings: {
    ok: boolean;
    errors: string[];
    settings: {
      theme: string;
      mode: string;
      layout: string;
      sidebar_collapse_mode: string;
      font_size: string;
      font_family: string;
    } | null;
  };
}

export interface UpdateMySettingsVariables {
  theme?: string;
  mode?: string;
  layout?: string;
  sidebar_collapse_mode?: string;
  font_size?: string;
  font_family?: string;
}
