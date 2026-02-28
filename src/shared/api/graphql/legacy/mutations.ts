import { gql } from "@apollo/client";

/**
 * Purpose: GraphQL mutation for user authentication
 * Args: username (string), password (string)
 * Returns: Authentication response with token and user data
 */
export const LOGIN_MUTATION = gql`
  mutation Login(
    $username: String!
    $password: String!
    $deviceId: String
    $deviceName: String
  ) {
    login(
      username: $username
      password: $password
      deviceId: $deviceId
      deviceName: $deviceName
    ) {
      ok
      errors
      token
      refresh_token: refreshToken
      ephemeral_token: ephemeralToken
      mfa_required: mfaRequired
      mfa_setup_required: mfaSetupRequired
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

export const REVOKE_SESSION_MUTATION = gql`
  mutation RevokeSession($session_id: String!) {
    revoke_session: revokeSession(sessionId: $session_id) {
      ok
      errors
    }
  }
`;

export const REVOKE_ALL_SESSIONS_MUTATION = gql`
  mutation RevokeAllSessions {
    revoke_all_sessions: revokeAllSessions {
      ok
      errors
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
    refresh_token?: string | null;
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
    refresh_token?: string | null;
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

export const SETUP_MFA_MUTATION = gql`
  mutation SetupMFA($method: String!, $ephemeral_token: String) {
    setup_mfa: setupMfa(method: $method, ephemeralToken: $ephemeral_token) {
      secret
      qr_code_url: qrCodeUrl
      backup_codes: backupCodes
    }
  }
`;

export const VERIFY_MFA_SETUP_MUTATION = gql`
  mutation VerifyMFASetup(
    $code: String!
    $secret: String!
    $ephemeral_token: String
  ) {
    verify_mfa_setup: verifyMfaSetup(
      code: $code
      secret: $secret
      ephemeralToken: $ephemeral_token
    ) {
      ok
      errors
    }
  }
`;

export const VERIFY_MFA_LOGIN_MUTATION = gql`
  mutation VerifyMFALogin($code: String!, $ephemeral_token: String!) {
    verify_mfa_login: verifyMfaLogin(
      code: $code
      ephemeralToken: $ephemeral_token
    ) {
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

export const DISABLE_MFA_MUTATION = gql`
  mutation DisableMFA($password: String!) {
    disable_mfa: disableMFA(password: $password) {
      ok
      errors
    }
  }
`;

export const CREATE_USER_SETTINGS_MUTATION = gql`
  mutation CreateUserSettings($input: CreateUserSettingsInput!) {
    create_user_settings: createUserSettings(input: $input) {
      ok
      errors {
        field
        message
      }
      object {
        id
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

export const UPDATE_USER_SETTINGS_MUTATION = gql`
  mutation UpdateUserSettings($id: ID!, $input: UpdateUserSettingsInput!) {
    update_user_settings: updateUserSettings(id: $id, input: $input) {
      ok
      errors {
        field
        message
      }
      object {
        id
        theme
        mode
        layout
        sidebar_collapse_mode: sidebarCollapseMode
        font_size: fontSize
        font_family: fontFamily
        table_configs: tableConfigs
      }
    }
  }
`;

export const UPSERT_USER_TABLE_CONFIG_MUTATION = gql`
  mutation UpsertUserTableConfig($key: String!, $tableConfig: GenericScalar!) {
    upsert_user_table_config: upsertUserTableConfig(
      key: $key
      tableConfig: $tableConfig
    ) {
      ok
      errors
      settings_id: settingsId
      table_configs: tableConfigs
      table_config: tableConfig
    }
  }
`;

export const LOGIN_MUTATION_RESOLVED = LOGIN_MUTATION;
export const REFRESH_TOKEN_MUTATION_RESOLVED = REFRESH_TOKEN_MUTATION;
export const CREATE_USER_SETTINGS_MUTATION_RESOLVED = CREATE_USER_SETTINGS_MUTATION;
export const UPDATE_USER_SETTINGS_MUTATION_RESOLVED = UPDATE_USER_SETTINGS_MUTATION;
export const UPSERT_USER_TABLE_CONFIG_MUTATION_RESOLVED =
  UPSERT_USER_TABLE_CONFIG_MUTATION;

export interface MutationFieldError {
  field?: string | null;
  message?: string | null;
}

export interface UserSettingsMutationObject {
  id: string;
  theme: string;
  mode: string;
  layout: string;
  sidebar_collapse_mode: string;
  font_size: string;
  font_family: string;
  table_configs?: Record<string, unknown>;
}

export interface CreateUserSettingsResponse {
  create_user_settings: {
    ok: boolean;
    errors?: MutationFieldError[] | null;
    object?: UserSettingsMutationObject | null;
  };
}

export interface UpdateUserSettingsResponse {
  update_user_settings: {
    ok: boolean;
    errors?: MutationFieldError[] | null;
    object?: UserSettingsMutationObject | null;
  };
}

export interface UpsertUserTableConfigResponse {
  upsert_user_table_config: {
    ok: boolean;
    errors?: string[] | null;
    settings_id?: string | null;
    table_configs?: Record<string, unknown> | string | null;
    table_config?: Record<string, unknown> | string | null;
  };
}

export interface UserSettingsInputPayload {
  theme?: string;
  mode?: string;
  layout?: string;
  sidebarCollapseMode?: string;
  fontSize?: string;
  fontFamily?: string;
  tableConfigs?: Record<string, unknown>;
}

export interface CreateUserSettingsVariables {
  input: UserSettingsInputPayload & {
    user: string;
  };
}

export interface UpdateUserSettingsVariables {
  id: string;
  input: UserSettingsInputPayload;
}

export interface UpsertUserTableConfigVariables {
  key: string;
  tableConfig: unknown;
}
