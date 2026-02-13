import { describe, expect, it } from "vitest";

import { buildNestedMutationPayload } from "../utils/nestedMutationPayload";

describe("nested mutation payload builder", () => {
  it("passes allowed nested actions through", () => {
    const payload = buildNestedMutationPayload(
      {
        tags: { connect: ["1"], create: [{ name: "new" }] },
      },
      [
        {
          path: "tags",
          label: "Tags",
          relationType: "MANY_TO_MANY",
          toMany: true,
          relatedAppLabel: "test_app",
          relatedModelName: "Tag",
          policy: {
            path: "tags",
            allowedActions: ["CONNECT", "CREATE"],
            blockedActions: [],
            nestedEnabled: true,
          },
        },
      ],
    );

    expect(payload.tags).toEqual({ connect: ["1"], create: [{ name: "new" }] });
  });

  it("throws when blocked nested action is used", () => {
    expect(() =>
      buildNestedMutationPayload(
        { tags: { delete: ["1"] } },
        [
          {
            path: "tags",
            label: "Tags",
            relationType: "MANY_TO_MANY",
            toMany: true,
            relatedAppLabel: "test_app",
            relatedModelName: "Tag",
            policy: {
              path: "tags",
              allowedActions: ["CONNECT", "CREATE"],
              blockedActions: ["DELETE"],
              nestedEnabled: true,
            },
          },
        ],
      ),
    ).toThrow("blocked");
  });
});
