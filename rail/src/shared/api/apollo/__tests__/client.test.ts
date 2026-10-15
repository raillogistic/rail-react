import { ApolloLink } from "@apollo/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createUploadLinkMock } = vi.hoisted(() => ({
  createUploadLinkMock: vi.fn(),
}));

vi.mock("apollo-upload-client", () => ({
  createUploadLink: createUploadLinkMock,
}));

describe("apollo auth transport", () => {
  beforeEach(() => {
    vi.resetModules();
    createUploadLinkMock.mockReset();
    createUploadLinkMock.mockImplementation(() => new ApolloLink(() => null));
  });

  it("configures upload links to include browser credentials", async () => {
    await import("../client");

    expect(createUploadLinkMock).toHaveBeenCalledTimes(2);
    for (const [options] of createUploadLinkMock.mock.calls) {
      expect((options as { credentials?: string }).credentials).toBe("include");
    }
  });
});
