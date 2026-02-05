# UI Component Library Package

## Table of Contents

1. [Package Structure](#package-structure)
2. [package.json](#packagejson)
3. [Component Organization](#component-organization)
4. [Adapter Pattern](#adapter-pattern)
5. [Platform Context](#platform-context)
6. [Service Interfaces](#service-interfaces)
7. [Hooks](#hooks)
8. [Embed Component](#embed-component)

---

## Package Structure

```
packages/ui/
├── package.json
├── tsconfig.json
├── eslint.config.js
└── src/
    ├── components/
    │   ├── atoms/
    │   ├── molecules/
    │   ├── organisms/
    │   ├── pages/
    │   └── templates/
    ├── adapters/
    │   ├── factory/
    │   │   ├── ServiceFactory.ts
    │   │   └── interfaces/
    │   ├── tauri/
    │   ├── web/
    │   ├── http/
    │   └── shared/
    ├── platform/
    │   └── PlatformContext.tsx
    ├── contexts/
    │   ├── ThemeContext.tsx
    │   └── DialogContext.tsx
    ├── hooks/
    ├── services/
    ├── utils/
    ├── types/
    ├── assets/
    ├── styles/
    │   └── globals.css
    └── embed/
        └── <AppName>App.tsx
```

---

## package.json

```json
{
  "name": "@<project-name>/ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./components/atoms": {
      "types": "./src/components/atoms/index.ts",
      "default": "./src/components/atoms/index.ts"
    },
    "./components/molecules": {
      "types": "./src/components/molecules/index.ts",
      "default": "./src/components/molecules/index.ts"
    },
    "./components/organisms": {
      "types": "./src/components/organisms/index.ts",
      "default": "./src/components/organisms/index.ts"
    },
    "./components/pages": {
      "types": "./src/components/pages/index.ts",
      "default": "./src/components/pages/index.ts"
    },
    "./components/templates": {
      "types": "./src/components/templates/index.ts",
      "default": "./src/components/templates/index.ts"
    },
    "./adapters/factory": {
      "types": "./src/adapters/factory/index.ts",
      "default": "./src/adapters/factory/index.ts"
    },
    "./adapters/tauri": {
      "types": "./src/adapters/tauri/index.ts",
      "default": "./src/adapters/tauri/index.ts"
    },
    "./adapters/web": {
      "types": "./src/adapters/web/index.ts",
      "default": "./src/adapters/web/index.ts"
    },
    "./adapters/http": {
      "types": "./src/adapters/http/index.ts",
      "default": "./src/adapters/http/index.ts"
    },
    "./adapters/shared": {
      "types": "./src/adapters/shared/index.ts",
      "default": "./src/adapters/shared/index.ts"
    },
    "./platform": {
      "types": "./src/platform/index.ts",
      "default": "./src/platform/index.ts"
    },
    "./contexts": {
      "types": "./src/contexts/index.ts",
      "default": "./src/contexts/index.ts"
    },
    "./hooks": {
      "types": "./src/hooks/index.ts",
      "default": "./src/hooks/index.ts"
    },
    "./services": {
      "types": "./src/services/index.ts",
      "default": "./src/services/index.ts"
    },
    "./utils": {
      "types": "./src/utils/index.ts",
      "default": "./src/utils/index.ts"
    },
    "./types": {
      "types": "./src/types/index.ts",
      "default": "./src/types/index.ts"
    },
    "./embed": {
      "types": "./src/embed/index.ts",
      "default": "./src/embed/index.ts"
    },
    "./styles": "./src/styles/globals.css",
    "./assets/*": "./src/assets/*"
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "eslint src/"
  },
  "dependencies": {
    "@<project-name>/shared": "workspace:*",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-popover": "^1.1.14",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-toast": "^1.2.14",
    "@radix-ui/react-tooltip": "^1.2.7",
    "@tauri-apps/api": "^2.5.0",
    "class-variance-authority": "^0.7.1",
    "dexie": "^4.0.11",
    "framer-motion": "^12.23.24",
    "lucide-react": "^0.511.0",
    "react-hook-form": "^7.56.4",
    "react-router-dom": "^7.9.6"
  },
  "peerDependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "tailwindcss": "^4.1.17"
  },
  "devDependencies": {
    "@<project-name>/eslint-config": "workspace:*",
    "@<project-name>/tsconfig": "workspace:*",
    "@types/react": "^19.1.6",
    "@types/react-dom": "^19.1.5",
    "typescript": "^5.8.3"
  }
}
```

---

## Component Organization

### Atomic Design Hierarchy

#### atoms/ (Basic Building Blocks)

```
atoms/
├── index.ts
├── Button.tsx
├── Input.tsx
├── Label.tsx
├── Card.tsx
├── Badge.tsx
├── Spinner.tsx
├── IconButton.tsx
├── ErrorText.tsx
├── EmptyState.tsx
└── ...
```

#### molecules/ (Composed Atoms)

```
molecules/
├── index.ts
├── FormField.tsx
├── SearchInput.tsx
├── DateRangePicker.tsx
├── ConfirmDialog.tsx
└── ...
```

#### organisms/ (Complex Features)

```
organisms/
├── index.ts
├── Navbar.tsx
├── Sidebar.tsx
├── DataTable.tsx
├── Forms/
│   └── LoginForm.tsx
└── ...
```

#### templates/ (Layout Shells)

```
templates/
├── index.ts
├── AppShell.tsx
├── AuthLayout.tsx
└── ...
```

#### pages/ (Full Pages Using Templates)

```
pages/
├── index.ts
├── LoginPage.tsx
├── DashboardPage.tsx
├── SettingsPage.tsx
└── ...
```

### Example Component (Button.tsx)

```typescript
import { forwardRef, ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@<project-name>/shared/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner className="mr-2 h-4 w-4" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
```

### ErrorBoundary Component (atoms/ErrorBoundary.tsx)

```typescript
import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "./Button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-destructive">
              Something went wrong
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
          </div>
          <Button variant="outline" onClick={this.handleReset}>
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### AppShell Template (templates/AppShell.tsx)

```typescript
import { type ReactNode, Suspense } from "react";
import { Outlet } from "react-router-dom";
import { ErrorBoundary } from "../atoms/ErrorBoundary";
import { Spinner } from "../atoms/Spinner";
import { Sidebar } from "../organisms/Sidebar";
import { BottomNavigation } from "../organisms/BottomNavigation";
import { Navbar } from "../organisms/Navbar";
import { cn } from "@<project-name>/shared/utils";

export interface AppShellProps {
  children?: ReactNode;
  /** Hide sidebar (for mobile or embedded mode) */
  hideSidebar?: boolean;
  /** Show bottom navigation (mobile) */
  showBottomNav?: boolean;
  /** Hide top navbar */
  hideNavbar?: boolean;
  /** Custom sidebar content */
  sidebarContent?: ReactNode;
  /** Custom navbar content */
  navbarContent?: ReactNode;
  /** CSS class for main content area */
  contentClassName?: string;
  /** Error boundary fallback */
  errorFallback?: ReactNode;
  /** Loading fallback for Suspense */
  loadingFallback?: ReactNode;
}

export function AppShell({
  children,
  hideSidebar = false,
  showBottomNav = false,
  hideNavbar = false,
  sidebarContent,
  navbarContent,
  contentClassName,
  errorFallback,
  loadingFallback,
}: AppShellProps) {
  const defaultLoadingFallback = (
    <div className="flex h-full items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar - hidden on mobile by default */}
      {!hideSidebar && (
        <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-sidebar-bg md:block">
          {sidebarContent || <Sidebar />}
        </aside>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top navbar */}
        {!hideNavbar && (
          <header className="flex h-14 flex-shrink-0 items-center border-b border-border bg-background px-4">
            {navbarContent || <Navbar />}
          </header>
        )}

        {/* Page content with error boundary */}
        <main
          className={cn(
            "flex-1 overflow-auto",
            showBottomNav && "pb-16", // Space for bottom nav
            contentClassName
          )}
        >
          <ErrorBoundary fallback={errorFallback}>
            <Suspense fallback={loadingFallback || defaultLoadingFallback}>
              {children || <Outlet />}
            </Suspense>
          </ErrorBoundary>
        </main>

        {/* Bottom navigation - mobile */}
        {showBottomNav && (
          <div className="fixed bottom-0 left-0 right-0 md:hidden">
            <BottomNavigation />
          </div>
        )}
      </div>
    </div>
  );
}
```

### Sidebar Component (organisms/Sidebar.tsx) - Optional

```typescript
import { type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@<project-name>/shared/utils";
import {
  Home,
  Settings,
  User,
  FileText,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

export interface SidebarProps {
  items?: NavItem[];
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({
  items = defaultNavItems,
  header,
  footer,
  className,
}: SidebarProps) {
  const location = useLocation();

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Sidebar header */}
      {header && (
        <div className="flex h-14 items-center border-b border-border px-4">
          {header}
        </div>
      )}

      {/* Navigation items */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar footer */}
      {footer && (
        <div className="border-t border-border p-4">{footer}</div>
      )}
    </div>
  );
}
```

### BottomNavigation Component (organisms/BottomNavigation.tsx) - Optional

```typescript
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@<project-name>/shared/utils";
import {
  Home,
  Search,
  PlusCircle,
  Bell,
  User,
  type LucideIcon,
} from "lucide-react";

export interface BottomNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

export interface BottomNavigationProps {
  items?: BottomNavItem[];
  className?: string;
}

const defaultItems: BottomNavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Search", href: "/search", icon: Search },
  { label: "Create", href: "/create", icon: PlusCircle },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Profile", href: "/profile", icon: User },
];

export function BottomNavigation({
  items = defaultItems,
  className,
}: BottomNavigationProps) {
  const location = useLocation();

  return (
    <nav
      className={cn(
        "flex h-16 items-center justify-around border-t border-border bg-background px-2",
        className
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;

        return (
          <NavLink
            key={item.href}
            to={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </div>
            <span className="font-medium">{item.label}</span>
            {isActive && (
              <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-primary" />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
```

### Responsive AppShell Usage

```tsx
import { useMediaQuery } from '../hooks/useMediaQuery';

function App() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <AppShell
      hideSidebar={isMobile}
      showBottomNav={isMobile}
      sidebarContent={<Sidebar header={<Logo />} footer={<UserProfile />} />}
    >
      <Outlet />
    </AppShell>
  );
}
```

---

## Adapter Pattern

### adapters/factory/ServiceFactory.ts

```typescript
import { isTauri } from '../shared/platform';

// Service singletons
let authService: IAuthService | null = null;
let syncService: ISyncService | null = null;
let dataService: IDataService | null = null;

// Environment helpers
export function getServerUrl(): string {
  return import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
}

export function getAppId(): string {
  return import.meta.env.VITE_APP_ID || '<project-name>';
}

export function getApiKey(): string {
  return import.meta.env.VITE_API_KEY || '';
}

// Service factories
export function getAuthService(): IAuthService {
  if (!authService) {
    if (isTauri()) {
      const { TauriAuthAdapter } = await import('../tauri/TauriAuthAdapter');
      authService = new TauriAuthAdapter();
    } else {
      const { WebAuthAdapter } = await import('../web/WebAuthAdapter');
      authService = new WebAuthAdapter({
        serverUrl: getServerUrl(),
        appId: getAppId(),
        apiKey: getApiKey(),
      });
    }
  }
  return authService;
}

export function getSyncService(): ISyncService {
  if (!syncService) {
    if (isTauri()) {
      const { TauriSyncAdapter } = await import('../tauri/TauriSyncAdapter');
      syncService = new TauriSyncAdapter();
    } else {
      const { IndexedDBSyncAdapter } = await import('../web/sync/IndexedDBSyncAdapter');
      const auth = getAuthService();
      syncService = new IndexedDBSyncAdapter({
        serverUrl: getServerUrl(),
        appId: getAppId(),
        apiKey: getApiKey(),
        getTokens: () => auth.getTokens(),
        saveTokens: async (accessToken, refreshToken, userId) => {
          await auth.saveTokensExternal?.(accessToken, refreshToken, userId);
        },
      });
    }
  }
  return syncService;
}

export function getDataService(): IDataService {
  if (!dataService) {
    if (isTauri()) {
      const { TauriDataAdapter } = await import('../tauri/TauriDataAdapter');
      dataService = new TauriDataAdapter();
    } else {
      const { IndexedDBDataAdapter } = await import('../web/IndexedDBDataAdapter');
      dataService = new IndexedDBDataAdapter();
    }
  }
  return dataService;
}

// Reset for testing
export function resetServices(): void {
  authService = null;
  syncService = null;
  dataService = null;
}

// Inject for testing
export function injectServices(
  services: Partial<{
    auth: IAuthService;
    sync: ISyncService;
    data: IDataService;
  }>
): void {
  if (services.auth) authService = services.auth;
  if (services.sync) syncService = services.sync;
  if (services.data) dataService = services.data;
}
```

### adapters/factory/interfaces/IAuthService.ts

```typescript
import type {
  AuthResponse,
  AuthStatus,
  AuthTokens,
  SyncConfig,
} from '@<project-name>/shared/types';

export interface IAuthService {
  configureSync(config: SyncConfig): Promise<void>;
  register(username: string, email: string, password: string): Promise<AuthResponse>;
  login(email: string, password: string): Promise<AuthResponse>;
  logout(): Promise<void>;
  refreshToken(): Promise<void>;
  getStatus(): Promise<AuthStatus>;
  isAuthenticated(): Promise<boolean>;
  getAccessToken(): Promise<string | null>;
  getTokens(): Promise<Partial<AuthTokens>>;
  saveTokensExternal?(accessToken: string, refreshToken: string, userId: string): Promise<void>;
}
```

### adapters/factory/interfaces/ISyncService.ts

```typescript
import type { SyncResult, SyncStatus, SyncConfig } from '@<project-name>/shared/types';

export interface ISyncService {
  configure(config: SyncConfig): Promise<void>;
  syncNow(): Promise<SyncResult>;
  getStatus(): Promise<SyncStatus>;
  resetSync(): Promise<void>;
}
```

### adapters/shared/platform.ts

```typescript
/**
 * Detect if running in Tauri environment
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Detect if running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && !isTauri();
}

/**
 * Get current platform
 */
export function getPlatform(): 'tauri' | 'web' {
  return isTauri() ? 'tauri' : 'web';
}
```

### adapters/tauri/tauriInvoke.ts

```typescript
import { invoke } from '@tauri-apps/api/core';

/**
 * Type-safe Tauri IPC invoke wrapper
 */
export async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (import.meta.env.DEV) {
    console.log(`[Tauri] ${command}`, args);
  }
  const result = await invoke<T>(command, args);
  if (import.meta.env.DEV) {
    console.log(`[Tauri] ${command} ->`, result);
  }
  return result;
}
```

### adapters/web/database.ts

```typescript
import Dexie, { type Table } from 'dexie';

// Define your tables here
export interface DbItem {
  id: string;
  // ... domain fields
  sync_version: number;
  synced_at?: number;
  deleted?: boolean;
  deleted_at?: number;
}

export class AppDatabase extends Dexie {
  items!: Table<DbItem>;

  constructor() {
    super('<project-name>');
    this.version(1).stores({
      items: 'id, sync_version, synced_at, deleted',
      // Add more tables as needed
    });
  }
}

export const db = new AppDatabase();
```

---

## Platform Context

### platform/PlatformContext.tsx

```typescript
import { createContext, useContext, type ReactNode } from "react";
import type { IAuthService } from "../adapters/factory/interfaces/IAuthService";
import type { ISyncService } from "../adapters/factory/interfaces/ISyncService";
import type { IDataService } from "../adapters/factory/interfaces/IDataService";

export interface IPlatformServices {
  auth: IAuthService;
  sync: ISyncService;
  data: IDataService;
  // Add more services as needed
}

const PlatformContext = createContext<IPlatformServices | null>(null);

export interface PlatformProviderProps {
  services: IPlatformServices;
  children: ReactNode;
}

export function PlatformProvider({ services, children }: PlatformProviderProps) {
  return (
    <PlatformContext.Provider value={services}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatformServices(): IPlatformServices {
  const services = useContext(PlatformContext);
  if (!services) {
    throw new Error("usePlatformServices must be used within PlatformProvider");
  }
  return services;
}

// Convenience hooks
export function useAuthService(): IAuthService {
  return usePlatformServices().auth;
}

export function useSyncService(): ISyncService {
  return usePlatformServices().sync;
}

export function useDataService(): IDataService {
  return usePlatformServices().data;
}
```

---

## Hooks

### hooks/useAuth.ts

```typescript
import { useState, useEffect, useCallback } from 'react';
import type { AuthStatus } from '@<project-name>/shared/types';
import { useAuthService } from '../platform/PlatformContext';

export function useAuth() {
  const authService = useAuthService();
  const [status, setStatus] = useState<AuthStatus>({ isAuthenticated: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const authStatus = await authService.getStatus();
      setStatus(authStatus);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth check failed');
    } finally {
      setLoading(false);
    }
  }, [authService]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const response = await authService.login(email, password);
        if (response.success) {
          await checkStatus();
        }
        return response;
      } finally {
        setLoading(false);
      }
    },
    [authService, checkStatus]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
      setStatus({ isAuthenticated: false });
    } finally {
      setLoading(false);
    }
  }, [authService]);

  return {
    status,
    loading,
    error,
    login,
    logout,
    checkStatus,
    isAuthenticated: status.isAuthenticated,
  };
}
```

### hooks/useSync.ts

```typescript
import { useState, useCallback } from 'react';
import type { SyncResult, SyncStatus } from '@<project-name>/shared/types';
import { useSyncService } from '../platform/PlatformContext';

export function useSync() {
  const syncService = useSyncService();
  const [status, setStatus] = useState<SyncStatus>({
    pendingChanges: 0,
    isSyncing: false,
  });
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncNow = useCallback(async () => {
    setStatus(prev => ({ ...prev, isSyncing: true }));
    setError(null);
    try {
      const result = await syncService.syncNow();
      setLastResult(result);
      if (!result.success && result.error) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMsg);
      return { success: false, error: errorMsg, pushed: 0, pulled: 0, conflicts: 0, syncedAt: 0 };
    } finally {
      setStatus(prev => ({ ...prev, isSyncing: false }));
    }
  }, [syncService]);

  const refreshStatus = useCallback(async () => {
    try {
      const newStatus = await syncService.getStatus();
      setStatus(newStatus);
    } catch (err) {
      console.error('Failed to get sync status:', err);
    }
  }, [syncService]);

  return {
    status,
    lastResult,
    error,
    syncNow,
    refreshStatus,
    isSyncing: status.isSyncing,
  };
}
```

### hooks/useMediaQuery.ts

```typescript
import { useState, useEffect } from 'react';

/**
 * Hook to detect media query matches
 * @param query - CSS media query string (e.g., "(max-width: 768px)")
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
}

// Common breakpoint hooks
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
```

### hooks/useTheme.ts (Extended for Custom Variants)

```typescript
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { STORAGE_KEYS } from "@<project-name>/shared/constants";

export type Theme = "light" | "dark" | "chameleon" | "simple" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: string;
  setTheme: (theme: Theme) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_LIST: Theme[] = ["light", "dark", "chameleon", "simple", "system"];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem(STORAGE_KEYS.THEME) as Theme) || "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<string>("light");

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove all theme classes
    root.classList.remove("light", "dark", "chameleon", "simple");

    let resolved: string;
    if (theme === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } else {
      resolved = theme;
    }

    root.classList.add(resolved);
    root.setAttribute("data-theme", resolved);
    setResolvedTheme(resolved);
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      const resolved = e.matches ? "dark" : "light";
      root.classList.add(resolved);
      setResolvedTheme(resolved);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme, availableThemes: THEME_LIST }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
```

---

## Embed Component

### embed/<AppName>App.tsx

```typescript
import { useMemo, useEffect, useRef, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import type { AuthTokens } from "@<project-name>/shared/types";
import { isTauri } from "../adapters/shared/platform";
import { PlatformProvider, type IPlatformServices } from "../platform/PlatformContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { DialogProvider } from "../contexts/DialogContext";
import { AppRoutes } from "./AppRoutes";

// Import adapters
import { TauriAuthAdapter } from "../adapters/tauri/TauriAuthAdapter";
import { TauriSyncAdapter } from "../adapters/tauri/TauriSyncAdapter";
import { TauriDataAdapter } from "../adapters/tauri/TauriDataAdapter";
import { WebAuthAdapter } from "../adapters/web/WebAuthAdapter";
import { IndexedDBSyncAdapter } from "../adapters/web/sync/IndexedDBSyncAdapter";
import { IndexedDBDataAdapter } from "../adapters/web/IndexedDBDataAdapter";

export interface AppEmbedProps {
  /** External auth tokens for SSO integration */
  authTokens?: Partial<AuthTokens>;
  /**
   * When true, enables theme isolation mode:
   * - Theme changes dispatch custom events instead of modifying document.documentElement
   * - Prevents theme conflicts between multiple embedded apps
   * NOTE: Does NOT control navigation visibility (navigation always shows)
   */
  embedded?: boolean;
  /** Enable React Router (default: true) */
  useRouter?: boolean;
  /** Callback when logout requested */
  onLogoutRequest?: () => void;
  /** CSS class name */
  className?: string;
  /** Base path for routing */
  basePath?: string;
}

export function <AppName>App({
  authTokens,
  embedded = false,
  useRouter = true,
  onLogoutRequest,
  className,
  basePath = "",
}: AppEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      setPortalContainer(containerRef.current);
    }
  }, []);

  // Create platform-specific services
  const services = useMemo<IPlatformServices>(() => {
    if (isTauri()) {
      return {
        auth: new TauriAuthAdapter(),
        sync: new TauriSyncAdapter(),
        data: new TauriDataAdapter(),
      };
    }

    // Web: use IndexedDB + server
    const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
    const appId = import.meta.env.VITE_APP_ID || "<project-name>";
    const apiKey = import.meta.env.VITE_API_KEY || "";

    const authAdapter = new WebAuthAdapter({ serverUrl, appId, apiKey });
    const syncAdapter = new IndexedDBSyncAdapter({
      serverUrl,
      appId,
      apiKey,
      getTokens: () => authAdapter.getTokens(),
      saveTokens: async (accessToken, refreshToken, userId) => {
        await authAdapter.saveTokensExternal(accessToken, refreshToken, userId);
      },
    });

    return {
      auth: authAdapter,
      sync: syncAdapter,
      data: new IndexedDBDataAdapter(),
    };
  }, []);

  // Save external tokens if provided
  useEffect(() => {
    if (authTokens?.accessToken && authTokens?.refreshToken) {
      services.auth.saveTokensExternal?.(
        authTokens.accessToken,
        authTokens.refreshToken,
        authTokens.userId || ""
      );
    }
  }, [authTokens, services.auth]);

  const content = (
    <AppRoutes embedded={embedded} onLogoutRequest={onLogoutRequest} />
  );

  return (
    <div ref={containerRef} className={className}>
      <PlatformProvider services={services}>
        <ThemeProvider embedded={embedded}>
          <DialogProvider portalContainer={portalContainer}>
            {useRouter ? (
              <BrowserRouter basename={basePath}>{content}</BrowserRouter>
            ) : (
              content
            )}
          </DialogProvider>
        </ThemeProvider>
      </PlatformProvider>
    </div>
  );
}

export default <AppName>App;
```

---

## Contexts

### contexts/ThemeContext.tsx

```typescript
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { STORAGE_KEYS } from "@<project-name>/shared/constants";

export type Theme = "light" | "dark" | "system";

// Custom event name for theme changes (used by ShadowWrapper in parent app)
export const APP_THEME_EVENT = "<app-name>-theme-change";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  /**
   * When true, the app is embedded in another app (e.g., qm-center).
   * In embedded mode, theme changes are dispatched via custom events
   * instead of modifying document.documentElement directly.
   * This prevents theme conflicts between multiple embedded apps.
   */
  embedded?: boolean;
}

export function ThemeProvider({ children, embedded = false }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem(STORAGE_KEYS.THEME) as Theme) || "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Always save to localStorage
    localStorage.setItem(STORAGE_KEYS.THEME, theme);

    let resolved: "light" | "dark";
    if (theme === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } else {
      resolved = theme;
    }
    setResolvedTheme(resolved);

    if (embedded) {
      // In embedded mode, dispatch custom event for ShadowWrapper to handle
      // This avoids modifying document.documentElement which would affect other apps
      window.dispatchEvent(
        new CustomEvent(APP_THEME_EVENT, { detail: { theme: resolved } })
      );
    } else {
      // In standalone mode, apply theme to document element directly
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(resolved);
      root.setAttribute("data-theme", resolved);
    }
  }, [theme, embedded]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
```

> **Note**: For full embedded mode documentation including ShadowWrapper setup,
> see `references/theme-embedded-pattern.md`.

---

## Styles

### styles/globals.css

Tailwind CSS v4 uses CSS-first configuration with the `@theme` directive.

```css
@import 'tailwindcss';

/* ============================================
   Tailwind CSS v4 Theme Configuration
   Uses @theme directive instead of tailwind.config.js
   ============================================ */

@theme {
  /* Colors - using CSS color functions */
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(222.2 84% 4.9%);

  --color-card: hsl(0 0% 100%);
  --color-card-foreground: hsl(222.2 84% 4.9%);

  --color-popover: hsl(0 0% 100%);
  --color-popover-foreground: hsl(222.2 84% 4.9%);

  --color-primary: hsl(222.2 47.4% 11.2%);
  --color-primary-foreground: hsl(210 40% 98%);

  --color-secondary: hsl(210 40% 96.1%);
  --color-secondary-foreground: hsl(222.2 47.4% 11.2%);

  --color-muted: hsl(210 40% 96.1%);
  --color-muted-foreground: hsl(215.4 16.3% 46.9%);

  --color-accent: hsl(210 40% 96.1%);
  --color-accent-foreground: hsl(222.2 47.4% 11.2%);

  --color-destructive: hsl(0 84.2% 60.2%);
  --color-destructive-foreground: hsl(210 40% 98%);

  --color-border: hsl(214.3 31.8% 91.4%);
  --color-input: hsl(214.3 31.8% 91.4%);
  --color-ring: hsl(222.2 84% 4.9%);

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}

/* Dark mode theme overrides */
@theme dark {
  --color-background: hsl(222.2 84% 4.9%);
  --color-foreground: hsl(210 40% 98%);

  --color-card: hsl(222.2 84% 4.9%);
  --color-card-foreground: hsl(210 40% 98%);

  --color-popover: hsl(222.2 84% 4.9%);
  --color-popover-foreground: hsl(210 40% 98%);

  --color-primary: hsl(210 40% 98%);
  --color-primary-foreground: hsl(222.2 47.4% 11.2%);

  --color-secondary: hsl(217.2 32.6% 17.5%);
  --color-secondary-foreground: hsl(210 40% 98%);

  --color-muted: hsl(217.2 32.6% 17.5%);
  --color-muted-foreground: hsl(215 20.2% 65.1%);

  --color-accent: hsl(217.2 32.6% 17.5%);
  --color-accent-foreground: hsl(210 40% 98%);

  --color-destructive: hsl(0 62.8% 30.6%);
  --color-destructive-foreground: hsl(210 40% 98%);

  --color-border: hsl(217.2 32.6% 17.5%);
  --color-input: hsl(217.2 32.6% 17.5%);
  --color-ring: hsl(212.7 26.8% 83.9%);
}

/* Base layer styles */
@layer base {
  * {
    border-color: var(--color-border);
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
  }
}
```

### Alternative: Using CSS Variables with @theme inline

For projects that need runtime theme switching (not just prefers-color-scheme):

```css
@import 'tailwindcss';

/* Define CSS variables that can be toggled at runtime */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}

/* Map CSS variables to Tailwind theme using @theme inline */
@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --radius-md: var(--radius);
}

@layer base {
  * {
    border-color: var(--color-border);
  }
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
  }
}
```

### Key Tailwind CSS v4 Differences

| v3 (Legacy)                           | v4 (Current)                        |
| ------------------------------------- | ----------------------------------- |
| `tailwind.config.js`                  | `@theme` in CSS                     |
| `@tailwind base/components/utilities` | `@import "tailwindcss"`             |
| PostCSS plugin                        | `@tailwindcss/vite` plugin          |
| JavaScript theme config               | CSS-first configuration             |
| `theme.extend.colors`                 | `--color-*` in `@theme`             |
| `@apply border-border`                | `border-color: var(--color-border)` |

### Custom Variants for Multiple Themes

Use `@custom-variant` for theme switching beyond just light/dark:

```css
@import 'tailwindcss';

/* Custom theme variants */
@custom-variant dark (&:where(.dark, .dark *));
@custom-variant chameleon (&:where(.chameleon, .chameleon *));
@custom-variant simple (&:where(.simple, .simple *));

@theme {
  /* Default/Light theme */
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(222.2 84% 4.9%);
  --color-primary: hsl(222.2 47.4% 11.2%);
  --color-primary-foreground: hsl(210 40% 98%);
  --color-sidebar-bg: hsl(210 40% 96.1%);
  --color-sidebar-foreground: hsl(222.2 47.4% 11.2%);
  /* ... other colors */
}

/* Dark theme overrides */
.dark {
  --color-background: hsl(222.2 84% 4.9%);
  --color-foreground: hsl(210 40% 98%);
  --color-primary: hsl(210 40% 98%);
  --color-primary-foreground: hsl(222.2 47.4% 11.2%);
  --color-sidebar-bg: hsl(217.2 32.6% 12%);
  --color-sidebar-foreground: hsl(210 40% 98%);
}

/* Chameleon theme - vibrant colors */
.chameleon {
  --color-background: hsl(280 65% 98%);
  --color-foreground: hsl(280 84% 10%);
  --color-primary: hsl(280 70% 50%);
  --color-primary-foreground: hsl(0 0% 100%);
  --color-sidebar-bg: hsl(280 60% 95%);
  --color-sidebar-foreground: hsl(280 84% 10%);
}

/* Simple theme - minimalist */
.simple {
  --color-background: hsl(0 0% 98%);
  --color-foreground: hsl(0 0% 10%);
  --color-primary: hsl(0 0% 20%);
  --color-primary-foreground: hsl(0 0% 98%);
  --color-sidebar-bg: hsl(0 0% 95%);
  --color-sidebar-foreground: hsl(0 0% 10%);
}
```

### Usage with Custom Variants

```tsx
// Components automatically adapt to theme class on parent
<html className="chameleon">
  <div className="bg-background text-foreground">
    {/* Uses chameleon theme colors */}
  </div>
</html>

// Conditional styling per theme variant
<div className="
  bg-white
  dark:bg-gray-900
  chameleon:bg-purple-50
  simple:bg-gray-50
">
  Theme-aware content
</div>

// Theme switcher
function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="chameleon">Chameleon</option>
      <option value="simple">Simple</option>
    </select>
  );
}
```
