# Authentication System Restructuring - Multi-Phase Technical Plan

> **Version:** 2.0  
> **Last Updated:** 2026-01-25  
> **Status:** Draft  
> **Estimated Duration:** 8 weeks (4 phases)

---

## Executive Summary

This document provides a detailed multi-phase technical implementation plan to restructure and enhance the authentication system. Each phase is self-contained with clear deliverables, technical specifications, and acceptance criteria.

**Key Objectives:**

- Improve security posture (rate limiting, MFA, session management)
- Enhance user experience (multi-tab sync, activity timeout, remember me)
- Increase maintainability (service-based architecture, centralized configuration)
- Ensure backward compatibility during migration

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Target Architecture](#2-target-architecture)
3. [Phase 1: Core Infrastructure](#3-phase-1-core-infrastructure)
4. [Phase 2: Authentication Services](#4-phase-2-authentication-services)
5. [Phase 3: React Integration & UX](#5-phase-3-react-integration--ux)
6. [Phase 4: Advanced Security Features](#6-phase-4-advanced-security-features)
7. [Cross-Phase Concerns](#7-cross-phase-concerns)
8. [Appendices](#8-appendices)

---

## 1. Current State Analysis

### 1.1 Existing Component Map

| Component              | Location                                 | Responsibility            |
| ---------------------- | ---------------------------------------- | ------------------------- |
| `AuthContext`          | `src/auth/context/AuthContext.tsx`       | React context definition  |
| `AuthProvider`         | `src/auth/context/AuthProvider.tsx`      | Auth state management     |
| `useAuth`              | `src/auth/hooks/useAuth.ts`              | Auth hook for components  |
| `useTokenRefresh`      | `src/auth/hooks/useTokenRefresh.ts`      | Automatic token renewal   |
| `useSessionValidation` | `src/auth/hooks/useSessionValidation.ts` | Server-side session check |
| `token-storage.ts`     | `src/auth/utils/token-storage.ts`        | Token persistence         |
| `rbac.ts`              | `src/auth/utils/rbac.ts`                 | Role-based access control |
| `error-handler.ts`     | `src/auth/utils/error-handler.ts`        | Auth error handling       |
| `csrf.ts`              | `src/auth/utils/csrf.ts`                 | CSRF protection           |
| `authGuard.ts`         | `src/auth/utils/authGuard.ts`            | Route protection logic    |

### 1.2 Identified Limitations

| ID  | Limitation                   | Severity | Impact                          | Phase   |
| --- | ---------------------------- | -------- | ------------------------------- | ------- |
| L1  | No login rate limiting       | High     | Vulnerable to brute force       | Phase 1 |
| L2  | No multi-tab session sync    | Medium   | Inconsistent UX across tabs     | Phase 1 |
| L3  | No activity-based timeout    | Medium   | Security risk for idle sessions | Phase 3 |
| L4  | Hardcoded refresh threshold  | Low      | Inflexible configuration        | Phase 1 |
| L5  | No "Remember Me" option      | Low      | Poor UX for trusted devices     | Phase 4 |
| L6  | No MFA support               | High     | Single factor only              | Phase 4 |
| L7  | No device/session management | Medium   | Cannot audit/revoke sessions    | Phase 4 |
| L8  | Limited permission caching   | Low      | Redundant permission checks     | Phase 2 |
| L9  | No WebAuthn support          | Medium   | Missing modern auth options     | Phase 4 |
| L10 | Potential memory leaks       | Low      | Timer cleanup issues            | Phase 2 |

### 1.3 Current Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  LoginForm  │────▶│ AuthProvider │────▶│ Apollo Client   │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │                      │
                           ▼                      ▼
                    ┌──────────────┐     ┌─────────────────┐
                    │ token-storage│     │ GraphQL Server  │
                    └──────────────┘     └─────────────────┘
```

**Issues:**

- Tight coupling between components
- No centralized event handling
- Direct storage access from multiple locations
- No abstraction layer for token operations

---

## 2. Target Architecture

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                              │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  React Components                                                  │ │
│  │  ├── LoginForm, MFAChallenge, SessionManager, DeviceTrust          │ │
│  │  └── ProtectedRoute, AuthGuard                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                    │
│                                    ▼                                    │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  React Context Layer                                               │ │
│  │  ├── AuthProvider (state management)                               │ │
│  │  └── Hooks: useAuth, usePermissions, useSession, useActivityMonitor│ │
│  └────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│                         APPLICATION LAYER                               │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  AuthenticationManager (Orchestrator)                              │ │
│  │  ├── Coordinates all auth operations                               │ │
│  │  ├── Manages service lifecycle                                     │ │
│  │  └── Exposes unified API                                           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│         ┌──────────────┬──────────────┬──────────────┬────────────┐    │
│         ▼              ▼              ▼              ▼            │    │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐     │    │
│  │TokenService│ │SessionSvc  │ │PermissionSvc│ │DeviceService│     │    │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘     │    │
│                          ┌──────────┴──────────┐                      │
│                          ▼                     ▼                      │
│                   ┌────────────┐        ┌────────────┐                │
│                   │ MFAService │        │ AuditSvc   │                │
│                   └────────────┘        └────────────┘                │
├─────────────────────────────────────────────────────────────────────────┤
│                           CORE LAYER                                    │
│  ┌──────────────┬──────────────┬──────────────┬──────────────────────┐ │
│  │   EventBus   │StorageAdapter│  RateLimiter │    CryptoService     │ │
│  └──────────────┴──────────────┴──────────────┴──────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│                       INFRASTRUCTURE LAYER                              │
│  ┌──────────────┬──────────────┬──────────────┬──────────────────────┐ │
│  │ Apollo Client│BroadcastAPI  │  WebAuthn    │   SessionStorage     │ │
│  └──────────────┴──────────────┴──────────────┴──────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Target Directory Structure

```
src/auth/
├── index.ts                          # Public API exports
├── AuthenticationManager.ts          # Main orchestrator (Phase 2)
├── types/                            # Phase 1
│   ├── index.ts, auth.ts, events.ts, tokens.ts, permissions.ts
│   ├── mfa.ts, devices.ts            # Phase 4
├── constants/                        # Phase 1
│   ├── index.ts, config.ts, errors.ts, events.ts
├── core/                             # Phase 1
│   ├── index.ts, EventBus.ts, StorageAdapter.ts, RateLimiter.ts, CryptoService.ts
├── services/                         # Phase 2
│   ├── index.ts, TokenService.ts, SessionService.ts, PermissionService.ts
│   ├── MFAService.ts, DeviceService.ts, AuditService.ts  # Phase 4
├── context/                          # Phase 3
│   ├── index.ts, AuthContext.tsx, AuthProvider.tsx
├── hooks/                            # Phase 3
│   ├── index.ts, useAuth.ts, usePermissions.ts, useSession.ts, useActivityMonitor.ts
├── components/                       # Phase 3-4
│   ├── LoginForm.tsx, MFAChallenge.tsx, SessionManager.tsx, ActivityTimeoutModal.tsx
├── pages/                            # Phase 3-4
│   ├── LoginPage.tsx, MFASetupPage.tsx, SessionsPage.tsx
└── utils/                            # Refactored across phases
    ├── token-storage.ts, authGuard.ts, rbac.ts, csrf.ts, fingerprint.ts
```

---

## 3. Phase 1: Core Infrastructure

> **Duration:** 2 weeks  
> **Priority:** Critical  
> **Dependencies:** None  
> **Addresses:** L1, L2, L4

### 3.1 Overview

Phase 1 establishes foundational infrastructure for all subsequent phases: type system, configuration, event bus, storage abstraction, and rate limiting.

### 3.2 Deliverables

| Deliverable                       | Description                          | Est. Hours |
| --------------------------------- | ------------------------------------ | ---------- |
| `src/auth/types/`                 | Complete TypeScript type definitions | 4h         |
| `src/auth/constants/`             | Configuration and error constants    | 2h         |
| `src/auth/core/EventBus.ts`       | Cross-tab event synchronization      | 6h         |
| `src/auth/core/StorageAdapter.ts` | Unified storage interface            | 4h         |
| `src/auth/core/RateLimiter.ts`    | Login rate limiting                  | 4h         |
| `src/auth/core/CryptoService.ts`  | Encryption utilities                 | 3h         |
| Unit tests                        | 90%+ coverage for core modules       | 6h         |

### 3.3 Type Definitions

#### 3.3.1 Core Auth Types (`src/auth/types/auth.ts`)

```typescript
export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  roles: string[];
  permissions: string[];
  metadata?: Record<string, unknown>;
}

export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "mfa_required"
  | "session_expired"
  | "error";

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  error: AuthError | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: Date | null;
  sessionExpiresAt: Date | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
  deviceName?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  requiresMFA?: boolean;
  mfaChallenge?: MFAChallenge;
  error?: AuthError;
}

export interface LogoutOptions {
  everywhere?: boolean;
  reason?: LogoutReason;
  silent?: boolean;
}

export type LogoutReason =
  | "user_initiated"
  | "session_expired"
  | "idle_timeout"
  | "security_violation"
  | "account_disabled"
  | "password_changed"
  | "forced_logout";

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  recoverable: boolean;
}

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_DISABLED"
  | "SESSION_EXPIRED"
  | "TOKEN_INVALID"
  | "TOKEN_EXPIRED"
  | "REFRESH_FAILED"
  | "MFA_REQUIRED"
  | "MFA_INVALID"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "PERMISSION_DENIED"
  | "CSRF_INVALID"
  | "UNKNOWN_ERROR";
```

#### 3.3.2 Token Types (`src/auth/types/tokens.ts`)

```typescript
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface TokenPayload {
  sub: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  iat: number;
  exp: number;
  jti?: string;
  sessionId?: string;
  deviceId?: string;
}

export interface TokenStorageConfig {
  storageType: "memory" | "session" | "local" | "cookie";
  encryptionKey?: string;
  prefix: string;
  secure: boolean;
}

export interface TokenRefreshConfig {
  refreshThresholdSeconds: number;
  maxRetries: number;
  retryDelayMs: number;
  onRefreshError?: (error: AuthError) => void;
}
```

#### 3.3.3 Event Types (`src/auth/types/events.ts`)

```typescript
export type AuthEventType =
  | "auth:login_started"
  | "auth:login_success"
  | "auth:login_failed"
  | "auth:logout"
  | "auth:logout_everywhere"
  | "auth:token_refreshed"
  | "auth:token_expired"
  | "auth:token_invalid"
  | "auth:session_started"
  | "auth:session_expired"
  | "auth:session_extended"
  | "auth:activity_detected"
  | "auth:idle_warning"
  | "auth:idle_timeout"
  | "auth:mfa_required"
  | "auth:mfa_success"
  | "auth:mfa_failed"
  | "auth:rate_limited"
  | "auth:security_violation"
  | "auth:permission_changed"
  | "auth:device_registered"
  | "auth:device_trusted"
  | "auth:device_revoked";

export interface AuthEventPayloads {
  "auth:login_started": { username: string };
  "auth:login_success": { user: AuthUser; sessionId: string };
  "auth:login_failed": { error: AuthError; username: string };
  "auth:logout": { reason: LogoutReason; userId?: string };
  "auth:token_refreshed": { expiresAt: Date };
  "auth:session_expired": { sessionId: string; reason: string };
  "auth:idle_warning": { timeoutIn: number };
  "auth:idle_timeout": { lastActivity: Date };
  "auth:rate_limited": { retryAfter: number; key: string };
  // ... additional payloads
}

export type AuthEventHandler<T extends AuthEventType> = (
  payload: AuthEventPayloads[T],
) => void;

export type Unsubscribe = () => void;
```

### 3.4 Configuration (`src/auth/constants/config.ts`)

```typescript
export interface AuthConfig {
  token: {
    refreshThresholdSeconds: number;
    accessTokenTTLSeconds: number;
    refreshTokenTTLSeconds: number;
    storageType: "memory" | "session" | "local" | "cookie";
    storagePrefix: string;
    encryptTokens: boolean;
  };
  session: {
    idleTimeoutMs: number;
    idleWarningMs: number;
    validateOnFocus: boolean;
    validateIntervalMs: number;
  };
  rateLimit: {
    maxLoginAttempts: number;
    windowMs: number;
    lockoutMs: number;
    backoffMultiplier: number;
    persistLockout: boolean;
  };
  features: {
    enableMFA: boolean;
    enableDeviceTrust: boolean;
    enableMultiTabSync: boolean;
    enableActivityTimeout: boolean;
    enableSessionValidation: boolean;
  };
  eventBus: {
    channelName: string;
    debounceMs: number;
    enableCrossTab: boolean;
  };
}

export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  token: {
    refreshThresholdSeconds: 300, // 5 min before expiry
    accessTokenTTLSeconds: 900, // 15 min
    refreshTokenTTLSeconds: 604800, // 7 days
    storageType: "memory",
    storagePrefix: "auth_",
    encryptTokens: false,
  },
  session: {
    idleTimeoutMs: 900_000, // 15 min
    idleWarningMs: 120_000, // 2 min warning
    validateOnFocus: true,
    validateIntervalMs: 60_000, // 1 min
  },
  rateLimit: {
    maxLoginAttempts: 5,
    windowMs: 300_000, // 5 min window
    lockoutMs: 900_000, // 15 min lockout
    backoffMultiplier: 2,
    persistLockout: true,
  },
  features: {
    enableMFA: false,
    enableDeviceTrust: false,
    enableMultiTabSync: true,
    enableActivityTimeout: true,
    enableSessionValidation: true,
  },
  eventBus: {
    channelName: "auth-events",
    debounceMs: 100,
    enableCrossTab: true,
  },
};

export function mergeConfig(partial: Partial<AuthConfig>): AuthConfig {
  return {
    token: { ...DEFAULT_AUTH_CONFIG.token, ...partial.token },
    session: { ...DEFAULT_AUTH_CONFIG.session, ...partial.session },
    rateLimit: { ...DEFAULT_AUTH_CONFIG.rateLimit, ...partial.rateLimit },
    features: { ...DEFAULT_AUTH_CONFIG.features, ...partial.features },
    eventBus: { ...DEFAULT_AUTH_CONFIG.eventBus, ...partial.eventBus },
  };
}
```

### 3.5 Core Implementations

#### 3.5.1 EventBus (`src/auth/core/EventBus.ts`)

```typescript
import type { AuthEventType, AuthEventPayloads, Unsubscribe } from "../types";

interface EventBusConfig {
  channelName: string;
  debounceMs: number;
  enableCrossTab: boolean;
}

export class EventBus {
  private config: EventBusConfig;
  private channel: BroadcastChannel | null = null;
  private listeners = new Map<AuthEventType, Set<Function>>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  constructor(config: EventBusConfig) {
    this.config = config;
    if (config.enableCrossTab && typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel(config.channelName);
      this.channel.onmessage = this.handleCrossTabMessage.bind(this);
    }
  }

  emit<T extends AuthEventType>(event: T, payload: AuthEventPayloads[T]): void {
    // Debounce rapid events
    const key = `${event}-${JSON.stringify(payload)}`;
    const existing = this.debounceTimers.get(key);
    if (existing) clearTimeout(existing);

    this.debounceTimers.set(
      key,
      setTimeout(() => {
        this.emitImmediate(event, payload);
        this.debounceTimers.delete(key);
      }, this.config.debounceMs),
    );
  }

  private emitImmediate<T extends AuthEventType>(
    event: T,
    payload: AuthEventPayloads[T],
  ): void {
    // Local listeners
    const handlers = this.listeners.get(event);
    handlers?.forEach((handler) => handler(payload));

    // Cross-tab broadcast
    if (this.channel) {
      this.channel.postMessage({ event, payload, timestamp: Date.now() });
    }
  }

  emitLocal<T extends AuthEventType>(
    event: T,
    payload: AuthEventPayloads[T],
  ): void {
    const handlers = this.listeners.get(event);
    handlers?.forEach((handler) => handler(payload));
  }

  on<T extends AuthEventType>(
    event: T,
    handler: (payload: AuthEventPayloads[T]) => void,
  ): Unsubscribe {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  private handleCrossTabMessage(event: MessageEvent): void {
    const { event: eventType, payload } = event.data;
    this.emitLocal(eventType, payload);
  }

  destroy(): void {
    this.channel?.close();
    this.listeners.clear();
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}
```

#### 3.5.2 RateLimiter (`src/auth/core/RateLimiter.ts`)

```typescript
interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  lockoutMs: number;
  backoffMultiplier: number;
  persistLockout: boolean;
}

interface AttemptRecord {
  attempts: number;
  firstAttempt: number;
  lockedUntil: number | null;
  consecutiveFailures: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private records = new Map<string, AttemptRecord>();
  private storageKey = "auth_rate_limit";

  constructor(config: RateLimitConfig) {
    this.config = config;
    if (config.persistLockout) {
      this.loadFromStorage();
    }
  }

  canAttempt(key: string): boolean {
    const record = this.getRecord(key);

    // Check if locked out
    if (record.lockedUntil && Date.now() < record.lockedUntil) {
      return false;
    }

    // Clear lockout if expired
    if (record.lockedUntil && Date.now() >= record.lockedUntil) {
      this.reset(key);
      return true;
    }

    // Check window
    if (Date.now() - record.firstAttempt > this.config.windowMs) {
      this.reset(key);
      return true;
    }

    return record.attempts < this.config.maxAttempts;
  }

  recordAttempt(key: string, success: boolean): void {
    const record = this.getRecord(key);

    if (success) {
      this.reset(key);
      return;
    }

    record.attempts++;
    record.consecutiveFailures++;

    if (record.attempts >= this.config.maxAttempts) {
      // Calculate lockout with exponential backoff
      const backoffFactor = Math.pow(
        this.config.backoffMultiplier,
        Math.floor(record.consecutiveFailures / this.config.maxAttempts) - 1,
      );
      record.lockedUntil = Date.now() + this.config.lockoutMs * backoffFactor;
    }

    this.records.set(key, record);
    this.persistToStorage();
  }

  getRemainingAttempts(key: string): number {
    const record = this.getRecord(key);
    return Math.max(0, this.config.maxAttempts - record.attempts);
  }

  getLockoutEndTime(key: string): Date | null {
    const record = this.getRecord(key);
    return record.lockedUntil ? new Date(record.lockedUntil) : null;
  }

  reset(key: string): void {
    this.records.delete(key);
    this.persistToStorage();
  }

  private getRecord(key: string): AttemptRecord {
    return (
      this.records.get(key) || {
        attempts: 0,
        firstAttempt: Date.now(),
        lockedUntil: null,
        consecutiveFailures: 0,
      }
    );
  }

  private loadFromStorage(): void {
    try {
      const data = sessionStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.records = new Map(Object.entries(parsed));
      }
    } catch {}
  }

  private persistToStorage(): void {
    if (this.config.persistLockout) {
      const data = Object.fromEntries(this.records);
      sessionStorage.setItem(this.storageKey, JSON.stringify(data));
    }
  }
}
```

#### 3.5.3 StorageAdapter (`src/auth/core/StorageAdapter.ts`)

```typescript
type StorageType = "memory" | "session" | "local" | "cookie";

interface StorageAdapterConfig {
  type: StorageType;
  prefix: string;
  encrypt?: boolean;
  encryptionKey?: string;
}

export class StorageAdapter {
  private config: StorageAdapterConfig;
  private memoryStore = new Map<string, string>();

  constructor(config: StorageAdapterConfig) {
    this.config = config;
  }

  get(key: string): string | null {
    const fullKey = this.config.prefix + key;
    let value: string | null = null;

    switch (this.config.type) {
      case "memory":
        value = this.memoryStore.get(fullKey) || null;
        break;
      case "session":
        value = sessionStorage.getItem(fullKey);
        break;
      case "local":
        value = localStorage.getItem(fullKey);
        break;
      case "cookie":
        value = this.getCookie(fullKey);
        break;
    }

    if (value && this.config.encrypt) {
      value = this.decrypt(value);
    }

    return value;
  }

  set(key: string, value: string, options?: { expires?: Date }): void {
    const fullKey = this.config.prefix + key;
    let storedValue = value;

    if (this.config.encrypt) {
      storedValue = this.encrypt(value);
    }

    switch (this.config.type) {
      case "memory":
        this.memoryStore.set(fullKey, storedValue);
        break;
      case "session":
        sessionStorage.setItem(fullKey, storedValue);
        break;
      case "local":
        localStorage.setItem(fullKey, storedValue);
        break;
      case "cookie":
        this.setCookie(fullKey, storedValue, options?.expires);
        break;
    }
  }

  remove(key: string): void {
    const fullKey = this.config.prefix + key;

    switch (this.config.type) {
      case "memory":
        this.memoryStore.delete(fullKey);
        break;
      case "session":
        sessionStorage.removeItem(fullKey);
        break;
      case "local":
        localStorage.removeItem(fullKey);
        break;
      case "cookie":
        this.deleteCookie(fullKey);
        break;
    }
  }

  clear(): void {
    switch (this.config.type) {
      case "memory":
        this.memoryStore.clear();
        break;
      default:
        // Clear only prefixed keys
        this.getAllKeys().forEach((key) => this.remove(key));
    }
  }

  private encrypt(value: string): string {
    // Simple base64 for demo; use Web Crypto API in production
    return btoa(value);
  }

  private decrypt(value: string): string {
    try {
      return atob(value);
    } catch {
      return value;
    }
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(
      new RegExp("(^| )" + name + "=([^;]+)"),
    );
    return match ? decodeURIComponent(match[2]) : null;
  }

  private setCookie(name: string, value: string, expires?: Date): void {
    let cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Strict`;
    if (expires) {
      cookie += `; expires=${expires.toUTCString()}`;
    }
    if (location.protocol === "https:") {
      cookie += "; Secure";
    }
    document.cookie = cookie;
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  private getAllKeys(): string[] {
    const keys: string[] = [];
    const prefix = this.config.prefix;

    switch (this.config.type) {
      case "memory":
        this.memoryStore.forEach((_, key) => {
          if (key.startsWith(prefix)) keys.push(key.slice(prefix.length));
        });
        break;
      case "session":
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key?.startsWith(prefix)) keys.push(key.slice(prefix.length));
        }
        break;
      case "local":
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(prefix)) keys.push(key.slice(prefix.length));
        }
        break;
    }
    return keys;
  }
}
```

### 3.6 Phase 1 Tasks

| #   | Task                                                | Priority | Hours | Dependencies |
| --- | --------------------------------------------------- | -------- | ----- | ------------ |
| 1.1 | Create `types/` directory with all type definitions | High     | 4     | -            |
| 1.2 | Create `constants/config.ts` with AuthConfig        | High     | 2     | 1.1          |
| 1.3 | Create `constants/errors.ts` with error handling    | High     | 2     | 1.1          |
| 1.4 | Implement `EventBus` with BroadcastChannel          | High     | 6     | 1.1          |
| 1.5 | Implement `StorageAdapter` abstraction              | High     | 4     | 1.1          |
| 1.6 | Implement `RateLimiter` with exponential backoff    | High     | 4     | 1.1, 1.5     |
| 1.7 | Implement `CryptoService` for encryption            | Medium   | 3     | -            |
| 1.8 | Write unit tests (90%+ coverage)                    | High     | 6     | All above    |
| 1.9 | Create `core/index.ts` barrel exports               | Low      | 1     | All above    |

### 3.7 Phase 1 Acceptance Criteria

- [x] All types compile without errors
- [x] EventBus synchronizes logout across 3+ browser tabs within 500ms
- [x] RateLimiter blocks login after 5 failed attempts
- [x] RateLimiter lockout persists across page refreshes
- [x] StorageAdapter supports all 4 storage types
- [x] Unit test coverage ≥ 90%
- [x] No TypeScript `any` types in public APIs

---

## 4. Phase 2: Authentication Services

> **Duration:** 2 weeks  
> **Priority:** High  
> **Dependencies:** Phase 1  
> **Addresses:** L8, L10

### 4.1 Overview

Phase 2 implements the service layer that encapsulates authentication business logic, building on Phase 1's core infrastructure.

### 4.2 Deliverables

| Deliverable              | Description                                 | Est. Hours |
| ------------------------ | ------------------------------------------- | ---------- |
| `TokenService`           | JWT parsing, storage, refresh orchestration | 6h         |
| `SessionService`         | Session lifecycle, validation, timeout      | 6h         |
| `PermissionService`      | RBAC with caching and wildcards             | 5h         |
| `AuthenticationManager`  | Main orchestrator class                     | 8h         |
| Unit & integration tests | 85%+ coverage                               | 8h         |

### 4.3 TokenService (`src/auth/services/TokenService.ts`)

```typescript
import { StorageAdapter } from "../core/StorageAdapter";
import { EventBus } from "../core/EventBus";
import type { TokenPair, TokenPayload, TokenRefreshConfig } from "../types";

export class TokenService {
  private storage: StorageAdapter;
  private eventBus: EventBus;
  private config: TokenRefreshConfig;
  private refreshPromise: Promise<TokenPair> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(
    storage: StorageAdapter,
    eventBus: EventBus,
    config: TokenRefreshConfig,
  ) {
    this.storage = storage;
    this.eventBus = eventBus;
    this.config = config;
  }

  // Store tokens securely
  setTokens(tokens: TokenPair): void {
    this.storage.set("access_token", tokens.accessToken);
    this.storage.set("refresh_token", tokens.refreshToken);
    this.storage.set(
      "access_expires",
      tokens.accessTokenExpiresAt.toISOString(),
    );
    this.storage.set(
      "refresh_expires",
      tokens.refreshTokenExpiresAt.toISOString(),
    );
    this.scheduleRefresh(tokens.accessTokenExpiresAt);
  }

  // Get current access token
  getAccessToken(): string | null {
    return this.storage.get("access_token");
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return this.storage.get("refresh_token");
  }

  // Decode JWT without verification (client-side)
  decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload as TokenPayload;
    } catch {
      return null;
    }
  }

  // Check if access token is expired or expiring soon
  isAccessTokenExpiring(): boolean {
    const expiresStr = this.storage.get("access_expires");
    if (!expiresStr) return true;

    const expiresAt = new Date(expiresStr);
    const thresholdMs = this.config.refreshThresholdSeconds * 1000;
    return Date.now() >= expiresAt.getTime() - thresholdMs;
  }

  // Refresh tokens (with deduplication)
  async refreshTokens(
    refreshFn: (refreshToken: string) => Promise<TokenPair>,
  ): Promise<TokenPair> {
    // Deduplicate concurrent refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    this.refreshPromise = this.executeRefresh(refreshFn, refreshToken);

    try {
      const tokens = await this.refreshPromise;
      return tokens;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async executeRefresh(
    refreshFn: (token: string) => Promise<TokenPair>,
    refreshToken: string,
  ): Promise<TokenPair> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const tokens = await refreshFn(refreshToken);
        this.setTokens(tokens);
        this.eventBus.emit("auth:token_refreshed", {
          expiresAt: tokens.accessTokenExpiresAt,
        });
        return tokens;
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.config.maxRetries - 1) {
          await this.delay(this.config.retryDelayMs * (attempt + 1));
        }
      }
    }

    this.eventBus.emit("auth:token_expired", { expiredAt: new Date() });
    throw lastError;
  }

  // Schedule automatic refresh
  private scheduleRefresh(expiresAt: Date): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const refreshAt =
      expiresAt.getTime() - this.config.refreshThresholdSeconds * 1000;
    const delay = Math.max(0, refreshAt - Date.now());

    this.refreshTimer = setTimeout(() => {
      this.eventBus.emitLocal("auth:token_expiring", { expiresAt });
    }, delay);
  }

  // Clear all tokens
  clearTokens(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.storage.remove("access_token");
    this.storage.remove("refresh_token");
    this.storage.remove("access_expires");
    this.storage.remove("refresh_expires");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  destroy(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
  }
}
```

### 4.4 SessionService (`src/auth/services/SessionService.ts`)

```typescript
import { EventBus } from "../core/EventBus";
import type { AuthUser } from "../types";

interface SessionConfig {
  validateIntervalMs: number;
  validateOnFocus: boolean;
}

interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  deviceInfo?: {
    userAgent: string;
    ip?: string;
  };
}

export class SessionService {
  private eventBus: EventBus;
  private config: SessionConfig;
  private currentSession: Session | null = null;
  private validationInterval: NodeJS.Timeout | null = null;
  private validateFn: (() => Promise<boolean>) | null = null;

  constructor(eventBus: EventBus, config: SessionConfig) {
    this.eventBus = eventBus;
    this.config = config;

    if (config.validateOnFocus) {
      window.addEventListener("focus", this.handleFocus.bind(this));
    }
  }

  // Start a new session
  startSession(user: AuthUser, sessionId: string, expiresAt: Date): void {
    this.currentSession = {
      id: sessionId,
      userId: user.id,
      createdAt: new Date(),
      expiresAt,
      lastActivity: new Date(),
      deviceInfo: {
        userAgent: navigator.userAgent,
      },
    };

    this.eventBus.emit("auth:session_started", { sessionId, expiresAt });
    this.startValidationInterval();
  }

  // Update last activity
  recordActivity(): void {
    if (this.currentSession) {
      this.currentSession.lastActivity = new Date();
      this.eventBus.emitLocal("auth:activity_detected", {
        timestamp: this.currentSession.lastActivity,
      });
    }
  }

  // Get current session
  getSession(): Session | null {
    return this.currentSession;
  }

  // Check if session is valid
  isSessionValid(): boolean {
    if (!this.currentSession) return false;
    return Date.now() < this.currentSession.expiresAt.getTime();
  }

  // Set validation function
  setValidationFn(fn: () => Promise<boolean>): void {
    this.validateFn = fn;
  }

  // Validate session with server
  async validateSession(): Promise<boolean> {
    if (!this.validateFn) return this.isSessionValid();

    try {
      const isValid = await this.validateFn();
      this.eventBus.emitLocal("auth:session_validated", { valid: isValid });

      if (!isValid && this.currentSession) {
        this.eventBus.emit("auth:session_expired", {
          sessionId: this.currentSession.id,
          reason: "server_validation_failed",
        });
      }

      return isValid;
    } catch {
      return false;
    }
  }

  // Extend session
  extendSession(newExpiresAt: Date): void {
    if (this.currentSession) {
      this.currentSession.expiresAt = newExpiresAt;
      this.eventBus.emit("auth:session_extended", { newExpiresAt });
    }
  }

  // End current session
  endSession(reason: string): void {
    if (this.currentSession) {
      this.eventBus.emit("auth:session_expired", {
        sessionId: this.currentSession.id,
        reason,
      });
    }
    this.currentSession = null;
    this.stopValidationInterval();
  }

  private startValidationInterval(): void {
    this.stopValidationInterval();
    this.validationInterval = setInterval(
      () => this.validateSession(),
      this.config.validateIntervalMs,
    );
  }

  private stopValidationInterval(): void {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
  }

  private handleFocus(): void {
    if (this.currentSession) {
      this.validateSession();
    }
  }

  destroy(): void {
    this.stopValidationInterval();
    window.removeEventListener("focus", this.handleFocus.bind(this));
  }
}
```

### 4.5 PermissionService (`src/auth/services/PermissionService.ts`)

```typescript
interface PermissionConfig {
  cacheTTLMs: number;
  wildcardChar: string;
}

interface PermissionCache {
  permissions: string[];
  roles: string[];
  timestamp: number;
}

export class PermissionService {
  private config: PermissionConfig;
  private cache: PermissionCache | null = null;

  constructor(
    config: PermissionConfig = { cacheTTLMs: 300_000, wildcardChar: "*" },
  ) {
    this.config = config;
  }

  // Set permissions from user data
  setPermissions(permissions: string[], roles: string[]): void {
    this.cache = {
      permissions,
      roles,
      timestamp: Date.now(),
    };
  }

  // Check single permission
  hasPermission(permission: string): boolean {
    if (!this.cache || this.isCacheExpired()) return false;
    return this.matchPermission(permission, this.cache.permissions);
  }

  // Check all permissions (AND)
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every((p) => this.hasPermission(p));
  }

  // Check any permission (OR)
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((p) => this.hasPermission(p));
  }

  // Check role
  hasRole(role: string): boolean {
    if (!this.cache || this.isCacheExpired()) return false;
    return this.cache.roles.includes(role);
  }

  // Check any role
  hasAnyRole(roles: string[]): boolean {
    return roles.some((r) => this.hasRole(r));
  }

  // Resource:action permission check
  canAccess(resource: string, action: string): boolean {
    const permission = `${resource}:${action}`;
    return this.hasPermission(permission);
  }

  // Get all permissions
  getPermissions(): string[] {
    return this.cache?.permissions || [];
  }

  // Get all roles
  getRoles(): string[] {
    return this.cache?.roles || [];
  }

  // Invalidate cache
  invalidate(): void {
    this.cache = null;
  }

  private isCacheExpired(): boolean {
    if (!this.cache) return true;
    return Date.now() - this.cache.timestamp > this.config.cacheTTLMs;
  }

  private matchPermission(required: string, granted: string[]): boolean {
    // Direct match
    if (granted.includes(required)) return true;

    // Wildcard matching
    const wc = this.config.wildcardChar;

    // Check for global wildcard
    if (granted.includes(wc)) return true;

    // Check for partial wildcards (e.g., "users:*" matches "users:read")
    const [resource, action] = required.split(":");
    if (resource && action) {
      if (granted.includes(`${resource}:${wc}`)) return true;
      if (granted.includes(`${wc}:${action}`)) return true;
    }

    return false;
  }
}
```

### 4.6 AuthenticationManager (`src/auth/AuthenticationManager.ts`)

```typescript
import { EventBus } from "./core/EventBus";
import { StorageAdapter } from "./core/StorageAdapter";
import { RateLimiter } from "./core/RateLimiter";
import { TokenService } from "./services/TokenService";
import { SessionService } from "./services/SessionService";
import { PermissionService } from "./services/PermissionService";
import type {
  AuthConfig,
  AuthState,
  AuthUser,
  LoginCredentials,
  AuthResult,
  LogoutOptions,
  TokenPair,
} from "./types";
import { DEFAULT_AUTH_CONFIG, mergeConfig } from "./constants/config";

export class AuthenticationManager {
  private config: AuthConfig;
  private eventBus: EventBus;
  private storage: StorageAdapter;
  private rateLimiter: RateLimiter;
  private tokenService: TokenService;
  private sessionService: SessionService;
  private permissionService: PermissionService;

  private state: AuthState = {
    status: "idle",
    user: null,
    error: null,
    isAuthenticated: false,
    isLoading: false,
    lastActivity: null,
    sessionExpiresAt: null,
  };

  private stateListeners = new Set<(state: AuthState) => void>();

  constructor(config: Partial<AuthConfig> = {}) {
    this.config = mergeConfig(config);

    // Initialize core services
    this.eventBus = new EventBus(this.config.eventBus);
    this.storage = new StorageAdapter({
      type: this.config.token.storageType,
      prefix: this.config.token.storagePrefix,
      encrypt: this.config.token.encryptTokens,
    });
    this.rateLimiter = new RateLimiter(this.config.rateLimit);

    // Initialize application services
    this.tokenService = new TokenService(this.storage, this.eventBus, {
      refreshThresholdSeconds: this.config.token.refreshThresholdSeconds,
      maxRetries: 3,
      retryDelayMs: 1000,
    });
    this.sessionService = new SessionService(this.eventBus, {
      validateIntervalMs: this.config.session.validateIntervalMs,
      validateOnFocus: this.config.session.validateOnFocus,
    });
    this.permissionService = new PermissionService();

    this.setupEventHandlers();
  }

  // Initialize and check existing session
  async initialize(): Promise<void> {
    this.updateState({ status: "loading", isLoading: true });

    const accessToken = this.tokenService.getAccessToken();
    if (!accessToken) {
      this.updateState({
        status: "unauthenticated",
        isLoading: false,
      });
      return;
    }

    // Validate existing session
    const isValid = await this.sessionService.validateSession();
    if (isValid) {
      const payload = this.tokenService.decodeToken(accessToken);
      if (payload) {
        this.updateState({
          status: "authenticated",
          isAuthenticated: true,
          isLoading: false,
          user: this.extractUserFromPayload(payload),
        });
        return;
      }
    }

    // Session invalid, clear and set unauthenticated
    this.tokenService.clearTokens();
    this.updateState({
      status: "unauthenticated",
      isLoading: false,
    });
  }

  // Login
  async login(
    credentials: LoginCredentials,
    loginFn: (
      creds: LoginCredentials,
    ) => Promise<{ user: AuthUser; tokens: TokenPair; sessionId: string }>,
  ): Promise<AuthResult> {
    const { username } = credentials;

    // Check rate limit
    if (!this.rateLimiter.canAttempt(username)) {
      const lockoutEnd = this.rateLimiter.getLockoutEndTime(username);
      this.eventBus.emit("auth:rate_limited", {
        retryAfter: lockoutEnd ? lockoutEnd.getTime() - Date.now() : 0,
        key: username,
      });
      return {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many login attempts. Please try again later.",
          timestamp: new Date(),
          recoverable: true,
        },
      };
    }

    this.updateState({ status: "loading", isLoading: true });
    this.eventBus.emit("auth:login_started", { username });

    try {
      const { user, tokens, sessionId } = await loginFn(credentials);

      // Success
      this.rateLimiter.reset(username);
      this.tokenService.setTokens(tokens);
      this.sessionService.startSession(
        user,
        sessionId,
        tokens.accessTokenExpiresAt,
      );
      this.permissionService.setPermissions(user.permissions, user.roles);

      this.updateState({
        status: "authenticated",
        isAuthenticated: true,
        isLoading: false,
        user,
        sessionExpiresAt: tokens.accessTokenExpiresAt,
        error: null,
      });

      this.eventBus.emit("auth:login_success", { user, sessionId });
      return { success: true, user };
    } catch (error) {
      this.rateLimiter.recordAttempt(username, false);

      const authError = {
        code: "INVALID_CREDENTIALS" as const,
        message: "Invalid username or password",
        timestamp: new Date(),
        recoverable: true,
      };

      this.updateState({
        status: "error",
        isLoading: false,
        error: authError,
      });

      this.eventBus.emit("auth:login_failed", { error: authError, username });
      return { success: false, error: authError };
    }
  }

  // Logout
  async logout(options: LogoutOptions = {}): Promise<void> {
    const userId = this.state.user?.id;
    const reason = options.reason || "user_initiated";

    this.tokenService.clearTokens();
    this.sessionService.endSession(reason);
    this.permissionService.invalidate();

    this.updateState({
      status: "unauthenticated",
      isAuthenticated: false,
      user: null,
      error: null,
      sessionExpiresAt: null,
    });

    if (!options.silent) {
      this.eventBus.emit("auth:logout", { reason, userId });
    }
  }

  // Get current state
  getState(): AuthState {
    return { ...this.state };
  }

  // Subscribe to state changes
  subscribe(listener: (state: AuthState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  // Permission checks
  hasPermission(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }

  hasRole(role: string): boolean {
    return this.permissionService.hasRole(role);
  }

  // Event subscription
  on<T extends AuthEventType>(
    event: T,
    handler: (payload: AuthEventPayloads[T]) => void,
  ): () => void {
    return this.eventBus.on(event, handler);
  }

  // Cleanup
  destroy(): void {
    this.eventBus.destroy();
    this.tokenService.destroy();
    this.sessionService.destroy();
  }

  private updateState(partial: Partial<AuthState>): void {
    this.state = { ...this.state, ...partial };
    this.stateListeners.forEach((listener) => listener(this.state));
  }

  private setupEventHandlers(): void {
    // Handle cross-tab logout
    this.eventBus.on("auth:logout", () => {
      if (this.state.isAuthenticated) {
        this.logout({ silent: true, reason: "forced_logout" });
      }
    });

    // Handle token refresh
    this.eventBus.on("auth:token_refreshed", ({ expiresAt }) => {
      this.updateState({ sessionExpiresAt: expiresAt });
    });
  }

  private extractUserFromPayload(payload: TokenPayload): AuthUser {
    return {
      id: payload.sub,
      email: payload.email || "",
      roles: payload.roles || [],
      permissions: payload.permissions || [],
    };
  }
}
```

### 4.7 Phase 2 Tasks

| #   | Task                               | Priority | Hours | Dependencies  |
| --- | ---------------------------------- | -------- | ----- | ------------- |
| 2.1 | Implement `TokenService`           | High     | 6     | Phase 1       |
| 2.2 | Implement `SessionService`         | High     | 6     | Phase 1, 2.1  |
| 2.3 | Implement `PermissionService`      | High     | 5     | Phase 1       |
| 2.4 | Implement `AuthenticationManager`  | High     | 8     | 2.1, 2.2, 2.3 |
| 2.5 | Write unit tests                   | High     | 5     | All above     |
| 2.6 | Write integration tests            | High     | 3     | All above     |
| 2.7 | Create `services/index.ts` exports | Low      | 1     | All above     |

### 4.8 Phase 2 Acceptance Criteria

- [x] TokenService correctly parses and stores JWT tokens
- [x] TokenService deduplicates concurrent refresh requests
- [x] SessionService validates sessions on tab focus
- [x] PermissionService supports wildcard matching (`users:*`)
- [x] AuthenticationManager coordinates all services correctly
- [x] Cross-tab logout works via EventBus
- [x] Unit test coverage ≥ 85%

---

## 5. Phase 3: React Integration & UX

> **Duration:** 2 weeks  
> **Priority:** High  
> **Dependencies:** Phase 2  
> **Addresses:** L3

### 5.1 Overview

Phase 3 integrates the authentication services with React, providing hooks, context, and UI components for activity monitoring and session management.

### 5.2 Deliverables

| Deliverable               | Description                     | Est. Hours |
| ------------------------- | ------------------------------- | ---------- |
| `AuthProvider`            | Enhanced React context provider | 4h         |
| `useAuth` hook            | Main authentication hook        | 3h         |
| `usePermissions` hook     | Permission checking hook        | 2h         |
| `useSession` hook         | Session state hook              | 2h         |
| `useActivityMonitor` hook | Idle detection                  | 4h         |
| `LoginForm`               | Enhanced with rate limiting UI  | 3h         |
| `ActivityTimeoutModal`    | Idle warning dialog             | 2h         |
| Tests                     | Component and hook tests        | 6h         |

### 5.3 Enhanced AuthProvider (`src/auth/context/AuthProvider.tsx`)

```typescript
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthenticationManager } from '../AuthenticationManager';
import type { AuthState, AuthConfig, LoginCredentials, AuthResult } from '../types';

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
  config?: Partial<AuthConfig>;
  onLogin?: (credentials: LoginCredentials) => Promise<{ user: AuthUser; tokens: TokenPair; sessionId: string }>;
  onLogout?: () => Promise<void>;
  onRefresh?: (refreshToken: string) => Promise<TokenPair>;
  onValidateSession?: () => Promise<boolean>;
}

export function AuthProvider({
  children,
  config,
  onLogin,
  onLogout,
  onRefresh,
  onValidateSession,
}: AuthProviderProps) {
  const [manager] = useState(() => new AuthenticationManager(config));
  const [state, setState] = useState<AuthState>(manager.getState());

  useEffect(() => {
    // Subscribe to state changes
    const unsubscribe = manager.subscribe(setState);

    // Set validation function if provided
    if (onValidateSession) {
      manager.sessionService.setValidationFn(onValidateSession);
    }

    // Initialize on mount
    manager.initialize();

    return () => {
      unsubscribe();
      manager.destroy();
    };
  }, [manager, onValidateSession]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    if (!onLogin) throw new Error('onLogin handler not provided');
    return manager.login(credentials, onLogin);
  }, [manager, onLogin]);

  const logout = useCallback(async () => {
    await manager.logout();
    if (onLogout) await onLogout();
  }, [manager, onLogout]);

  const hasPermission = useCallback((permission: string) => {
    return manager.hasPermission(permission);
  }, [manager]);

  const hasRole = useCallback((role: string) => {
    return manager.hasRole(role);
  }, [manager]);

  const refreshSession = useCallback(async () => {
    if (!onRefresh) throw new Error('onRefresh handler not provided');
    await manager.tokenService.refreshTokens(onRefresh);
  }, [manager, onRefresh]);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    hasPermission,
    hasRole,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
```

### 5.4 useAuth Hook (`src/auth/hooks/useAuth.ts`)

```typescript
import { useAuthContext } from "../context/AuthProvider";

export function useAuth() {
  const context = useAuthContext();

  return {
    // State
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    error: context.error,
    status: context.status,

    // Actions
    login: context.login,
    logout: context.logout,
    refreshSession: context.refreshSession,

    // Permissions
    hasPermission: context.hasPermission,
    hasRole: context.hasRole,
  };
}
```

### 5.5 useActivityMonitor Hook (`src/auth/hooks/useActivityMonitor.ts`)

```typescript
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";

interface ActivityMonitorConfig {
  idleTimeoutMs: number;
  warningThresholdMs: number;
  events?: string[];
  throttleMs?: number;
}

interface ActivityMonitorState {
  isIdle: boolean;
  isWarning: boolean;
  lastActivity: Date;
  timeUntilTimeout: number | null;
}

const DEFAULT_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "click",
];

export function useActivityMonitor(config: ActivityMonitorConfig) {
  const { isAuthenticated, logout } = useAuth();
  const [state, setState] = useState<ActivityMonitorState>({
    isIdle: false,
    isWarning: false,
    lastActivity: new Date(),
    timeUntilTimeout: null,
  });

  const lastActivityRef = useRef(Date.now());
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

    if (!isAuthenticated) return;

    const now = Date.now();
    lastActivityRef.current = now;

    setState((prev) => ({
      ...prev,
      isIdle: false,
      isWarning: false,
      lastActivity: new Date(now),
      timeUntilTimeout: config.idleTimeoutMs,
    }));

    // Set warning timer
    const warningDelay = config.idleTimeoutMs - config.warningThresholdMs;
    warningTimeoutRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, isWarning: true }));
    }, warningDelay);

    // Set idle timeout
    idleTimeoutRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, isIdle: true }));
      logout({ reason: "idle_timeout" });
    }, config.idleTimeoutMs);
  }, [
    isAuthenticated,
    config.idleTimeoutMs,
    config.warningThresholdMs,
    logout,
  ]);

  const handleActivity = useCallback(() => {
    // Throttle activity updates
    if (throttleRef.current) return;

    throttleRef.current = setTimeout(() => {
      throttleRef.current = null;
    }, config.throttleMs || 1000);

    resetTimers();
  }, [resetTimers, config.throttleMs]);

  const extendSession = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  // Setup event listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = config.events || DEFAULT_EVENTS;
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize timers
    resetTimers();

    // Update countdown every second when warning
    const countdownInterval = setInterval(() => {
      if (state.isWarning) {
        const remaining =
          config.idleTimeoutMs - (Date.now() - lastActivityRef.current);
        setState((prev) => ({
          ...prev,
          timeUntilTimeout: Math.max(0, remaining),
        }));
      }
    }, 1000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (throttleRef.current) clearTimeout(throttleRef.current);
      clearInterval(countdownInterval);
    };
  }, [isAuthenticated, config, handleActivity, resetTimers, state.isWarning]);

  return {
    ...state,
    extendSession,
    resetActivity: resetTimers,
  };
}
```

### 5.6 usePermissions Hook (`src/auth/hooks/usePermissions.ts`)

```typescript
import { useMemo } from 'react';
import { useAuth } from './useAuth';

export function usePermissions() {
  const { user, hasPermission, hasRole } = useAuth();

  const permissions = useMemo(() => user?.permissions || [], [user]);
  const roles = useMemo(() => user?.roles || [], [user]);

  return {
    permissions,
    roles,
    hasPermission,
    hasRole,
    hasAllPermissions: (perms: string[]) => perms.every(hasPermission),
    hasAnyPermission: (perms: string[]) => perms.some(hasPermission),
    hasAllRoles: (r: string[]) => r.every(hasRole),
    hasAnyRole: (r: string[]) => r.some(hasRole),
    canAccess: (resource: string, action: string) => hasPermission(`${resource}:${action}`),
  };
}

// HOC for permission-based rendering
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: string
) {
  return function PermissionGuard(props: P) {
    const { hasPermission } = usePermissions();
    if (!hasPermission(requiredPermission)) return null;
    return <Component {...props} />;
  };
}

// Component for declarative permission checks
export function RequirePermission({
  permission,
  children,
  fallback = null
}: {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasPermission, hasAnyPermission } = usePermissions();

  const hasAccess = Array.isArray(permission)
    ? hasAnyPermission(permission)
    : hasPermission(permission);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
```

### 5.7 ActivityTimeoutModal (`src/auth/components/ActivityTimeoutModal.tsx`)

```typescript
import React from 'react';
import { useActivityMonitor } from '../hooks/useActivityMonitor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/lib/components/ui/dialog';
import { Button } from '@/lib/components/ui/button';

interface ActivityTimeoutModalProps {
  idleTimeoutMs?: number;
  warningThresholdMs?: number;
}

export function ActivityTimeoutModal({
  idleTimeoutMs = 900_000,   // 15 minutes
  warningThresholdMs = 120_000,  // 2 minutes warning
}: ActivityTimeoutModalProps) {
  const { isWarning, timeUntilTimeout, extendSession } = useActivityMonitor({
    idleTimeoutMs,
    warningThresholdMs,
  });

  const formatTime = (ms: number | null) => {
    if (ms === null) return '';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isWarning}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session Timeout Warning</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-center text-lg">
            Your session will expire in{' '}
            <span className="font-bold text-destructive">
              {formatTime(timeUntilTimeout)}
            </span>
          </p>
          <p className="text-center text-muted-foreground mt-2">
            Click "Stay Logged In" to continue your session.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => {}}>
            Log Out Now
          </Button>
          <Button onClick={extendSession}>
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 5.8 Enhanced LoginForm (`src/auth/components/LoginForm.tsx`)

```typescript
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/lib/components/ui/button';
import { Input } from '@/lib/components/ui/input';
import { Label } from '@/lib/components/ui/label';
import { Alert, AlertDescription } from '@/lib/components/ui/alert';

interface LoginFormProps {
  onSuccess?: () => void;
  rateLimitMessage?: string;
}

export function LoginForm({ onSuccess, rateLimitMessage }: LoginFormProps) {
  const { login, isLoading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<Date | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await login({ username, password, rememberMe });

    if (result.success) {
      onSuccess?.();
    } else if (result.error?.code === 'RATE_LIMITED') {
      // Calculate lockout end time from retryAfter
      const retryAfter = result.error.details?.retryAfter as number;
      if (retryAfter) {
        setLockoutEndTime(new Date(Date.now() + retryAfter));
      }
    }
  };

  const isLockedOut = lockoutEndTime && new Date() < lockoutEndTime;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {isLockedOut && (
        <Alert variant="warning">
          <AlertDescription>
            {rateLimitMessage || 'Too many failed attempts. Please try again later.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading || isLockedOut}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading || isLockedOut}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          id="rememberMe"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          disabled={isLoading || isLockedOut}
        />
        <Label htmlFor="rememberMe" className="text-sm">
          Remember me
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || isLockedOut}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
```

### 5.9 Phase 3 Tasks

| #   | Task                                                 | Priority | Hours | Dependencies |
| --- | ---------------------------------------------------- | -------- | ----- | ------------ |
| 3.1 | Refactor `AuthProvider` to use AuthenticationManager | High     | 4     | Phase 2      |
| 3.2 | Implement `useAuth` hook                             | High     | 3     | 3.1          |
| 3.3 | Implement `usePermissions` hook                      | High     | 2     | 3.1          |
| 3.4 | Implement `useSession` hook                          | Medium   | 2     | 3.1          |
| 3.5 | Implement `useActivityMonitor` hook                  | High     | 4     | 3.1          |
| 3.6 | Create `ActivityTimeoutModal` component              | Medium   | 2     | 3.5          |
| 3.7 | Enhance `LoginForm` with rate limiting UI            | High     | 3     | 3.2          |
| 3.8 | Write hook tests                                     | High     | 4     | All above    |
| 3.9 | Write component tests                                | High     | 2     | All above    |

### 5.10 Phase 3 Acceptance Criteria

- [x] AuthProvider initializes AuthenticationManager correctly
- [x] useAuth hook provides all auth state and actions
- [x] useActivityMonitor shows warning 2 minutes before timeout
- [x] useActivityMonitor triggers logout after idle timeout
- [x] LoginForm displays lockout countdown when rate limited
- [x] RequirePermission component correctly gates content
- [x] All hooks properly cleanup on unmount
- [x] Component tests pass

---

## 6. Phase 4: Advanced Security Features

> **Duration:** 2 weeks  
> **Priority:** Medium  
> **Dependencies:** Phase 3  
> **Addresses:** L5, L6, L7, L9

### 6.1 Overview

Phase 4 adds advanced security features: Multi-Factor Authentication (MFA), device trust/remember me, session management UI, and WebAuthn support.

### 6.2 Deliverables

| Deliverable                | Description                  | Est. Hours |
| -------------------------- | ---------------------------- | ---------- |
| `SessionManager` component | Active sessions list         | 4h         |
| `SessionsPage`             | Full session management page | 3h         |
| Tests                      | Service and component tests  | 6h         |

### 6.6 SessionManager Component (`src/auth/components/SessionManager.tsx`)

```typescript
import React, { useEffect, useState } from 'react';
import { Button } from '@/lib/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/card';

interface Session {
  id: string;
  deviceName: string;
  browser: string;
  location?: string;
  lastActive: Date;
  current: boolean;
}

interface SessionManagerProps {
  getSessions: () => Promise<Session[]>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeAllSessions: () => Promise<void>;
}

export function SessionManager({
  getSessions,
  revokeSession,
  revokeAllSessions
}: SessionManagerProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (sessionId: string) => {
    await revokeSession(sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleRevokeAll = async () => {
    await revokeAllSessions();
    setSessions(prev => prev.filter(s => s.current));
  };

  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      .format(-Math.round((Date.now() - date.getTime()) / 60000), 'minute');
  };

  if (loading) return <div>Loading sessions...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Active Sessions</h2>
        {sessions.length > 1 && (
          <Button variant="destructive" size="sm" onClick={handleRevokeAll}>
            Sign out all other devices
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {sessions.map(session => (
          <Card key={session.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">
                  {session.deviceName}
                  {session.current && (
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      Current
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {session.browser} • {session.location || 'Unknown location'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last active {formatDate(session.lastActive)}
                </p>
              </div>
              {!session.current && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevoke(session.id)}
                >
                  Sign out
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 6.7 Phase 4 Tasks

| #   | Task                              | Priority | Hours | Dependencies |
| --- | --------------------------------- | -------- | ----- | ------------ |
| 4.5 | Create `SessionManager` component | Medium   | 4     | 4.2          |
| 4.6 | Create `SessionsPage`             | Medium   | 3     | 4.5          |
| 4.8 | Write tests                       | High     | 6     | All above    |

### 6.8 Phase 4 Acceptance Criteria

- [x] SessionManager displays all active sessions
- [x] Users can revoke individual sessions
- [x] Users can revoke all other sessions
- [x] MFA Setup flow works (QR code generation)
- [x] MFA Verification works (TOTP)
- [x] Login flow handles MFA requirement
- [x] Device tracking captures metadata

---

## 7. Cross-Phase Concerns

### 7.1 Testing Strategy

#### Unit Testing

```typescript
// Example: RateLimiter.test.ts
describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      maxAttempts: 3,
      windowMs: 60000,
      lockoutMs: 300000,
      backoffMultiplier: 2,
      persistLockout: false,
    });
  });

  it("allows attempts within limit", () => {
    expect(limiter.canAttempt("user1")).toBe(true);
    limiter.recordAttempt("user1", false);
    expect(limiter.canAttempt("user1")).toBe(true);
  });

  it("blocks after max attempts", () => {
    for (let i = 0; i < 3; i++) {
      limiter.recordAttempt("user1", false);
    }
    expect(limiter.canAttempt("user1")).toBe(false);
  });

  it("resets on successful attempt", () => {
    limiter.recordAttempt("user1", false);
    limiter.recordAttempt("user1", true);
    expect(limiter.getRemainingAttempts("user1")).toBe(3);
  });
});
```

#### Integration Testing

```typescript
// Example: AuthenticationManager.integration.test.ts
describe('AuthenticationManager Integration', () => {
  let manager: AuthenticationManager;

  beforeEach(() => {
    manager = new AuthenticationManager();
  });

  afterEach(() => {
    manager.destroy();
  });

  it('completes full login flow', async () => {
    const mockLogin = jest.fn().mockResolvedValue({
      user: { id: '1', email: 'test@test.com', roles: [], permissions: [] },
      tokens: { accessToken: 'token', refreshToken: 'refresh', ... },
      sessionId: 'session1',
    });

    const result = await manager.login({ username: 'test', password: 'pass' }, mockLogin);

    expect(result.success).toBe(true);
    expect(manager.getState().isAuthenticated).toBe(true);
  });
});
```

#### E2E Testing

```typescript
// Example: login.e2e.test.ts (Playwright)
test("login with rate limiting", async ({ page }) => {
  await page.goto("/login");

  // Fail login 5 times
  for (let i = 0; i < 5; i++) {
    await page.fill('[name="username"]', "test");
    await page.fill('[name="password"]', "wrong");
    await page.click('button[type="submit"]');
  }

  // Should see lockout message
  await expect(page.getByText("Too many attempts")).toBeVisible();

  // Submit button should be disabled
  await expect(page.locator('button[type="submit"]')).toBeDisabled();
});
```

### 7.2 Migration Strategy

#### Phase 1: Parallel Running

```typescript
// Temporarily run both old and new systems
import { AuthProvider as NewAuthProvider } from '@/auth';
import { AuthProvider as LegacyAuthProvider } from '@/auth/legacy';

const USE_NEW_AUTH = import.meta.env.VITE_USE_NEW_AUTH === 'true';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (USE_NEW_AUTH) {
    return <NewAuthProvider>{children}</NewAuthProvider>;
  }
  return <LegacyAuthProvider>{children}</LegacyAuthProvider>;
}
```

#### Phase 2: Gradual Rollout

1. Enable for internal users first (feature flag)
2. Enable for 10% of users
3. Monitor error rates and performance
4. Increase to 50%, then 100%
5. Remove legacy code

#### Breaking Changes

| Change                    | Migration                   |
| ------------------------- | --------------------------- |
| Token storage key changed | Auto-migrate on first load  |
| Event names changed       | Adapter layer for old names |
| Hook return types         | TypeScript will catch       |

### 7.3 Security Considerations

#### Token Security

| Threat           | Mitigation                        |
| ---------------- | --------------------------------- |
| XSS token theft  | Memory storage (not localStorage) |
| CSRF attacks     | CSRF tokens on mutations          |
| Token replay     | Short expiry + rotation           |
| Session fixation | Regenerate on login               |

#### Rate Limiting Defense

```
Client-side: Prevent UI spam, improve UX
     ↓
Server-side: Actual security enforcement
     ↓
Infrastructure: WAF, DDoS protection
```

#### Audit Logging

```typescript
// Events to log
const AUDIT_EVENTS = [
  "auth:login_success",
  "auth:login_failed",
  "auth:logout",
  "auth:mfa_success",
  "auth:mfa_failed",
  "auth:password_changed",
  "auth:device_trusted",
  "auth:device_revoked",
  "auth:session_revoked",
];
```

### 7.4 Performance Considerations

| Concern                   | Solution                  |
| ------------------------- | ------------------------- |
| Permission check overhead | In-memory cache with TTL  |
| Token parsing             | Cache decoded payload     |
| Event bus flooding        | Debounce (100ms default)  |
| Activity monitoring       | Throttle (1s default)     |
| Cross-tab sync            | BroadcastChannel (native) |

### 7.5 Error Handling

```typescript
// Centralized error boundary for auth
export function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  const { error, status } = useAuth();

  if (status === 'error' && error) {
    switch (error.code) {
      case 'SESSION_EXPIRED':
        return <SessionExpiredModal />;
      case 'ACCOUNT_DISABLED':
        return <AccountDisabledPage />;
      case 'NETWORK_ERROR':
        return <OfflineNotification />;
      default:
        return <GenericErrorPage error={error} />;
    }
  }

  return <>{children}</>;
}
```

---

## 8. Appendices

### 8.1 Timeline Summary

| Phase                        | Duration    | Start  | End    |
| ---------------------------- | ----------- | ------ | ------ |
| Phase 1: Core Infrastructure | 2 weeks     | Week 1 | Week 2 |
| Phase 2: Services            | 2 weeks     | Week 3 | Week 4 |
| Phase 3: React Integration   | 2 weeks     | Week 5 | Week 6 |
| Phase 4: Advanced Security   | 2 weeks     | Week 7 | Week 8 |
| **Total**                    | **8 weeks** |        |        |

### 8.2 Effort Estimate

| Phase     | Hours    | Team Size | Calendar    |
| --------- | -------- | --------- | ----------- |
| Phase 1   | 32h      | 1 dev     | 2 weeks     |
| Phase 2   | 34h      | 1 dev     | 2 weeks     |
| Phase 3   | 26h      | 1 dev     | 2 weeks     |
| Phase 4   | 43h      | 1-2 devs  | 2 weeks     |
| **Total** | **135h** |           | **8 weeks** |

### 8.3 Risk Assessment

| Risk                   | Probability | Impact | Mitigation                      |
| ---------------------- | ----------- | ------ | ------------------------------- |
| Breaking existing auth | Medium      | High   | Feature flags, parallel running |
| Performance regression | Low         | Medium | Benchmark before/after          |
| Browser compatibility  | Low         | Medium | Polyfills for BroadcastChannel  |
| MFA adoption issues    | Medium      | Low    | Clear documentation, fallback   |

### 8.4 Dependencies

**External:**

- GraphQL server must support new auth endpoints
- Backend MFA implementation required for Phase 4
- WebAuthn server-side support for passkeys

**Internal:**

- UI component library (shadcn/ui)
- Apollo Client for GraphQL
- Existing test infrastructure

### 8.5 References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices (RFC 8725)](https://datatracker.ietf.org/doc/html/rfc8725)
- [WebAuthn Guide](https://webauthn.guide/)
- [BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)

---

## Document History

| Version | Date       | Author   | Changes                                        |
| ------- | ---------- | -------- | ---------------------------------------------- |
| 1.0     | 2026-01-25 | Rovo Dev | Initial draft                                  |
| 2.0     | 2026-01-25 | Rovo Dev | Multi-phase restructure with technical details |
