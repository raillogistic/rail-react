import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { SettingsLayout } from "../SettingsLayout";
import { ROUTES } from "@/shared/routing/routes";

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "1" },
  }),
}));

vi.mock("@apollo/client", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    gql: (value: TemplateStringsArray) => value[0],
    useQuery: () => ({
      data: {
        me: {
          isSuperuser: false,
          modelPermissions: [],
        },
      },
    }),
  };
});

describe("SettingsLayout", () => {
  it("keeps account and appearance tabs while removing the disposition tab", () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.SETTINGS_ACCOUNT]}>
        <SettingsLayout>
          <div>Contenu</div>
        </SettingsLayout>
      </MemoryRouter>,
    );

    expect(screen.getByText("Compte")).toBeInTheDocument();
    expect(screen.getByText("Apparence")).toBeInTheDocument();
    expect(screen.queryByText("Disposition")).not.toBeInTheDocument();
  });
});
