import { ApolloLink, Observable, gql } from "@apollo/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createUploadLinkMock } = vi.hoisted(() => ({
  createUploadLinkMock: vi.fn(),
}));

const transport = vi.hoisted(() => ({ token: "expired", active: true }));
vi.mock("@/shared/api/auth/csrf", () => ({ ensureCsrfCookie: vi.fn() }));
vi.mock("@/shared/api/auth/token-storage", () => ({
  AUTH_SESSION_EVENT: "auth-session-change",
  getSecureHeaders: () => ({}),
  tokenStorage: {
    getAccessToken: () => transport.token,
    getRefreshToken: () => null,
    setAccessToken: (token: string) => { transport.token = token; },
    setSessionActive: (active: boolean) => { transport.active = active; },
    clearAllTokens: () => { transport.token = ""; },
  },
}));

vi.mock("apollo-upload-client", () => ({
  createUploadLink: createUploadLinkMock,
}));

describe("apollo auth transport", () => {
  beforeEach(() => {
    vi.resetModules();
    createUploadLinkMock.mockReset();
    createUploadLinkMock.mockImplementation(() => new ApolloLink(() => null));
    transport.token = "expired";
    transport.active = true;
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  it("configures upload links to include browser credentials", async () => {
    await import("../client");

    expect(createUploadLinkMock).toHaveBeenCalledTimes(2);
    for (const [options] of createUploadLinkMock.mock.calls) {
      expect((options as { credentials?: string }).credentials).toBe("include");
    }
  });

  it("retries concurrent authentication failures with the new token and one refresh", async () => {
    const sent: string[] = [];
    createUploadLinkMock.mockImplementation(() => new ApolloLink(operation =>
      new Observable(observer => {
        const header = operation.getContext().headers.authorization;
        sent.push(header);
        observer.next(header === "Bearer expired"
          ? { errors: [{ message: "Authentication required", extensions: { code: "UNAUTHENTICATED" } }] }
          : { data: { viewer: "allowed" } });
        observer.complete();
      }),
    ));
    const refresh = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: { refresh_token: { ok: true, token: "fresh" } },
    })));
    vi.stubGlobal("fetch", refresh);
    const { default: client } = await import("../client");
    try {
      const responses = await Promise.all(Array.from({ length: 12 }, (_, id) =>
        client.query({ query: gql`query Read($id: Int!) { viewer(id: $id) }`, variables: { id }, fetchPolicy: "no-cache" }),
      ));
      expect(responses.every(response => response.data?.viewer === "allowed")).toBe(true);
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(sent.filter(header => header === "Bearer fresh")).toHaveLength(12);
    } finally { client.stop(); }
  });

  it("does not refresh a permission-denied HTTP 403", async () => {
    createUploadLinkMock.mockImplementation(() => new ApolloLink(() =>
      new Observable(observer => observer.error(Object.assign(new Error("Forbidden"), { statusCode: 403 }))),
    ));
    const refresh = vi.fn();
    vi.stubGlobal("fetch", refresh);
    const { default: client } = await import("../client");
    try {
      await expect(client.query({ query: gql`query Denied { viewer }`, fetchPolicy: "no-cache" })).rejects.toThrow();
      expect(refresh).not.toHaveBeenCalled();
      expect(transport.token).toBe("expired");
    } finally { client.stop(); }
  });

  it("preserves explicit credentials supplied by the caller", async () => {
    const sent: unknown[] = [];
    createUploadLinkMock.mockImplementation(() => new ApolloLink(operation =>
      new Observable(observer => {
        sent.push(operation.getContext().headers);
        observer.next({ data: { viewer: "explicit" } });
        observer.complete();
      }),
    ));
    const { default: client } = await import("../client");
    try {
      await client.query({ query: gql`query Explicit { viewer }`, fetchPolicy: "no-cache", context: { headers: { Authorization: "Bearer explicit" } } });
      expect(sent).toEqual([{ Authorization: "Bearer explicit" }]);
    } finally { client.stop(); }
  });

  it("does not resurrect a session or clear its replacement after a late refresh", async () => {
    createUploadLinkMock.mockImplementation(() => new ApolloLink(() =>
      new Observable(observer => {
        observer.next({ errors: [{ message: "Authentication required", extensions: { code: "UNAUTHENTICATED" } }] });
        observer.complete();
      }),
    ));
    let finish!: (response: Response) => void;
    const refresh = vi.fn(() => new Promise<Response>(resolve => { finish = resolve; }));
    vi.stubGlobal("fetch", refresh);
    const { default: client } = await import("../client");
    try {
      const pending = client.query({ query: gql`query Late { viewer }`, fetchPolicy: "no-cache" });
      const outcome = pending.catch(error => error);
      await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce());
      window.dispatchEvent(new CustomEvent("auth-session-change", { detail: { isActive: false } }));
      transport.token = "new-account";
      finish(new Response(JSON.stringify({ data: { refresh_token: { ok: true, token: "late" } } })));
      expect(await outcome).toBeInstanceOf(Error);
      expect(transport.token).toBe("new-account");
    } finally { client.stop(); }
  });
});
