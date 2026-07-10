import type { InternalStaffRole } from '../auth/hospital/types';

/** Phase 1 canonical session contract — token-bound staff identity */
export type StaffSession = {
  employeeId: string;
  activeToken: string;
  assignedRole: InternalStaffRole;
  expiresAt: string;
};

export type DeviceType = 'desktop' | 'tablet' | 'mobile' | 'unknown';

export type DeviceMetadata = {
  deviceType: DeviceType;
  browserFingerprint: string;
  ipAddress: string;
  isTrustedHardware: boolean;
};

export type LoginHistoryStatus = 'SUCCESS' | 'MFA_CHALLENGE' | 'FAILED';

export type LoginHistoryEvent = {
  eventId: string;
  timestamp: string;
  employeeId: string;
  status: LoginHistoryStatus;
  geoLocHint: string;
};

export type SessionPingRequest = {
  activeToken: string;
  employeeId: string;
  assignedRole?: InternalStaffRole;
  expiresAt?: string;
  lastActivityAt: string;
  device: DeviceMetadata;
};

export type SessionPingResponse =
  | {
      valid: true;
      expiresAt: string;
      serverTime: string;
      remainingMs: number;
      idleBreached: false;
    }
  | {
      valid: false;
      reason: 'EXPIRED' | 'INVALID_TOKEN' | 'IDLE_TIMEOUT' | 'NOT_FOUND';
      serverTime: string;
    };

export type PendingMfaChallenge = {
  challengeId: string;
  employeeId: string;
  issuedAt: string;
  expiresAt: string;
  method: 'otp';
  /** Simulated OTP for demo environments */
  demoCode: string;
};
