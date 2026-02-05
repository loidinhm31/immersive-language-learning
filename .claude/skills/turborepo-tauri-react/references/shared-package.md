# Shared Package

## Table of Contents

1. [Package Structure](#package-structure)
2. [package.json](#packagejson)
3. [tsconfig.json](#tsconfigjson)
4. [Types](#types)
5. [Utils](#utils)
6. [Constants](#constants)

---

## Package Structure

```
packages/shared/
├── package.json
├── tsconfig.json
├── eslint.config.js
└── src/
    ├── types/
    │   ├── index.ts
    │   ├── auth.ts
    │   ├── sync.ts
    │   └── <domain>.ts
    ├── utils/
    │   ├── index.ts
    │   ├── format.ts
    │   ├── validation.ts
    │   └── <domain>.ts
    ├── constants/
    │   ├── index.ts
    │   └── <domain>.ts
    └── index.ts
```

---

## package.json

```json
{
  "name": "@<project-name>/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./types": {
      "types": "./src/types/index.ts",
      "default": "./src/types/index.ts"
    },
    "./utils": {
      "types": "./src/utils/index.ts",
      "default": "./src/utils/index.ts"
    },
    "./constants": {
      "types": "./src/constants/index.ts",
      "default": "./src/constants/index.ts"
    }
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "eslint src/"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "tailwind-merge": "^3.3.0"
  },
  "devDependencies": {
    "@<project-name>/eslint-config": "workspace:*",
    "@<project-name>/tsconfig": "workspace:*",
    "typescript": "^5.8.3"
  }
}
```

---

## tsconfig.json

```json
{
  "extends": "@<project-name>/tsconfig/base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "noEmit": false
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Types

### src/types/index.ts

```typescript
export * from './auth';
export * from './sync';
// Export domain-specific types
```

### src/types/auth.ts

```typescript
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  tokens?: AuthTokens;
  user?: {
    id: string;
    email: string;
    username?: string;
  };
}

export interface AuthStatus {
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
}

export interface SyncConfig {
  serverUrl: string;
  appId: string;
  apiKey: string;
}

export type TokenProvider = () => Promise<{
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
}>;

export type TokenSaver = (
  accessToken: string,
  refreshToken: string,
  userId: string
) => Promise<void>;
```

### src/types/sync.ts

```typescript
export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  success: boolean;
  error?: string;
  syncedAt: number;
}

export interface SyncStatus {
  lastSyncAt?: number;
  pendingChanges: number;
  isSyncing: boolean;
  error?: string;
}

export interface SyncRecord {
  id: string;
  sync_version: number;
  synced_at?: number;
  deleted?: boolean;
  deleted_at?: number;
}

export interface SyncCheckpoint {
  table: string;
  lastTimestamp: number;
  cursor?: string;
}
```

### src/types/<domain>.ts (Example)

```typescript
// Domain-specific types
export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt?: number;
  sync_version: number;
  synced_at?: number;
}

// Add your domain entities extending BaseEntity
```

---

## Utils

### src/utils/index.ts

```typescript
export * from './format';
export * from './validation';
export * from './cn';
```

### src/utils/cn.ts

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS support
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### src/utils/format.ts

```typescript
import { format, formatDistanceToNow } from 'date-fns';

export function formatDate(date: Date | number, pattern = 'PP'): string {
  return format(date, pattern);
}

export function formatDateTime(date: Date | number): string {
  return format(date, 'PPp');
}

export function formatRelativeTime(date: Date | number): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('en-US', options).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
```

### src/utils/validation.ts

```typescript
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && !isNaN(value);
}
```

---

## Constants

### src/constants/index.ts

```typescript
export * from './app';
// Export domain-specific constants
```

### src/constants/app.ts

```typescript
export const APP_NAME = '<project-name>';

export const STORAGE_KEYS = {
  AUTH_TOKENS: 'auth_tokens',
  THEME: 'theme',
  LANGUAGE: 'language',
  SYNC_CHECKPOINT: 'sync_checkpoint',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  SYNC: {
    PUSH: '/sync/push',
    PULL: '/sync/pull',
    STATUS: '/sync/status',
  },
} as const;

export const SYNC_CONFIG = {
  DEFAULT_BATCH_SIZE: 100,
  SOFT_DELETE_TTL_DAYS: 60,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
} as const;
```

---

## Main Entry (Optional)

### src/index.ts

```typescript
// Re-export everything for convenience
export * from './types';
export * from './utils';
export * from './constants';
```

---

## ESLint Config

### eslint.config.js

```javascript
import { config } from '@<project-name>/eslint-config/base';

export default config;
```
