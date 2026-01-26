import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { MFAManagement } from "../components/MFAManagement";
import { GET_MFA_STATUS } from "@/graphql/queries";
import { DISABLE_MFA_MUTATION } from "@/graphql/mutations";
import { vi, describe, it, expect } from "vitest";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("MFAManagement", () => {
  it("renders enabled state correctly", async () => {
    const mocks = [
      {
        request: {
          query: GET_MFA_STATUS,
        },
        result: {
          data: {
            me: {
              __typename: "User",
              id: "1",
              mfa_enabled: true,
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <MFAManagement />
      </MockedProvider>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText("Enabled")).toBeInTheDocument();
    });
    
    expect(screen.getByText("Your account is currently protected with Two-Factor Authentication.")).toBeInTheDocument();
    expect(screen.getByText("Disable Two-Factor Authentication")).toBeInTheDocument();
  });

  it("renders disabled state correctly", async () => {
    const mocks = [
      {
        request: {
          query: GET_MFA_STATUS,
        },
        result: {
          data: {
            me: {
              __typename: "User",
              id: "1",
              mfa_enabled: false,
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <MFAManagement />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Disabled")).toBeInTheDocument();
    });
    
    expect(screen.getByText("Enable Two-Factor Authentication")).toBeInTheDocument();
  });
});
