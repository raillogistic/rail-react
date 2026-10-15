export interface DeviceInfo {
  userAgent: string;
  ip?: string;
  browser?: string;
  os?: string;
  device?: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  lastActive: Date;
  deviceInfo: DeviceInfo;
  current: boolean;
  location?: string;
}

export interface DeviceTrustConfig {
  trustDurationDays: number;
  maxTrustedDevices: number;
}
