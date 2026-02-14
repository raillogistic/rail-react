export const INTEGRATION_LOGIN_MUTATION = `
mutation IntegrationLogin($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    ok
    token
    errors
  }
}
`;

export const INTEGRATION_VIEWER_QUERY = `
query IntegrationViewer {
  viewer {
    id
    username
  }
}
`;

export interface IntegrationLoginPayload {
  ok: boolean;
  token?: string | null;
  errors?: string[] | null;
}

export interface IntegrationViewerPayload {
  id: string;
  username: string;
}

export interface GraphQLResponse<TData> {
  data?: TData;
  errors?: Array<{ message?: string; extensions?: { code?: string } }>;
}
