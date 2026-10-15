import { MFAErrorHandler, MFAErrorCode } from "../utils/mfa-errors";

describe("MFAErrorHandler", () => {
  it("should return correct details for INVALID_CODE", () => {
    const error = { code: MFAErrorCode.INVALID_CODE };
    const details = MFAErrorHandler.getErrorDetails(error);
    expect(details.message).toContain("incorrect");
    expect(details.code).toBe(MFAErrorCode.INVALID_CODE);
  });

  it("should return correct details for EXPIRED_CODE", () => {
    const error = { code: MFAErrorCode.EXPIRED_CODE };
    const details = MFAErrorHandler.getErrorDetails(error);
    expect(details.message).toContain("expired");
    expect(details.suggestion).toBeDefined();
  });

  it("should handle extensions.code", () => {
    const error = { extensions: { code: MFAErrorCode.RATE_LIMITED } };
    const details = MFAErrorHandler.getErrorDetails(error);
    expect(details.code).toBe(MFAErrorCode.RATE_LIMITED);
    expect(details.message).toContain("Too many failed attempts");
  });

  it("should fall back to default for unknown code", () => {
    const error = { message: "Something went wrong" };
    const details = MFAErrorHandler.getErrorDetails(error);
    expect(details.code).toBe(MFAErrorCode.INVALID_CODE);
    expect(details.message).toBe("Something went wrong");
  });
});
