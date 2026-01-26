export type MFAMethod = 'totp' | 'email' | 'sms' | 'webauthn';

export interface MFAChallenge {
  challengeId: string;
  method: MFAMethod;
  hint?: string;
  expiresAt: Date;
}

export interface MFASetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAVerifyResponse {
  success: boolean;
  backupCodesRemaining?: number;
}
