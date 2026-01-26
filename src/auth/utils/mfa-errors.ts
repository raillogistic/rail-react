export enum MFAErrorCode {
  INVALID_CODE = "MFA_INVALID",
  EXPIRED_CODE = "MFA_EXPIRED",
  RATE_LIMITED = "MFA_RATE_LIMITED",
  SETUP_FAILED = "MFA_SETUP_FAILED",
  ALREADY_ENABLED = "MFA_ALREADY_ENABLED",
  NOT_ENABLED = "MFA_NOT_ENABLED",
}

export interface MFAError {
  code: MFAErrorCode;
  message: string;
  suggestion?: string;
}

export class MFAErrorHandler {
  static getErrorDetails(error: any): MFAError {
    const code = error?.code || error?.extensions?.code;

    switch (code) {
      case MFAErrorCode.INVALID_CODE:
        return {
          code,
          message: "The verification code you entered is incorrect.",
          suggestion:
            "Please check your authenticator app and try again. Make sure the time on your device is synchronized.",
        };

      case MFAErrorCode.EXPIRED_CODE:
        return {
          code,
          message: "This verification code has expired.",
          suggestion:
            "TOTP codes expire after 30 seconds. Please wait for a new code and try again.",
        };

      case MFAErrorCode.RATE_LIMITED:
        return {
          code,
          message: "Too many failed attempts.",
          suggestion:
            "Please wait a few minutes before trying again.",
        };

      default:
        return {
          code: MFAErrorCode.INVALID_CODE,
          message:
            error?.message || "An error occurred during MFA verification.",
          suggestion:
            "Please try again or contact support if the problem persists.",
        };
    }
  }
}
