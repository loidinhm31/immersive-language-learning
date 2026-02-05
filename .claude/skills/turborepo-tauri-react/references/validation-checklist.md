# Validation Checklist

Use this checklist to validate existing repos against the standard architecture.

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Root Configuration](#root-configuration)
3. [Package Configurations](#package-configurations)
4. [TypeScript Setup](#typescript-setup)
5. [Component Organization](#component-organization)
6. [Adapter Pattern](#adapter-pattern)
7. [Auth Architecture](#auth-architecture)
8. [Sync Architecture](#sync-architecture)
9. [Theme & Embedded Pattern](#theme--embedded-pattern)
10. [Common Issues](#common-issues)

---

## Directory Structure

### Required Structure

```
<project>/
├── apps/
│   ├── web/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   └── src/
│   └── native/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html
│       ├── src/
│       └── src-tauri/
│           ├── Cargo.toml
│           ├── tauri.conf.json
│           └── src/
├── packages/
│   ├── ui/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   ├── shared/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   ├── tsconfig/
│   │   ├── package.json
│   │   ├── base.json
│   │   ├── react-library.json
│   │   └── vite.json
│   └── eslint-config/
│       ├── package.json
│       ├── base.js
│       └── react-internal.js
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

### Checklist

- [ ] `apps/web/` exists with Vite + React setup
- [ ] `apps/native/` exists with Tauri v2 setup
- [ ] `apps/native/src-tauri/` contains Rust backend
- [ ] `packages/ui/` contains shared components
- [ ] `packages/shared/` contains types/utils
- [ ] `packages/tsconfig/` contains TypeScript configs
- [ ] `packages/eslint-config/` contains ESLint configs
- [ ] Root `package.json` defines workspace scripts
- [ ] `pnpm-workspace.yaml` includes apps/_ and packages/_
- [ ] `turbo.json` defines build/dev/lint tasks

---

## Root Configuration

### package.json

- [ ] `"private": true`
- [ ] `"packageManager": "pnpm@9.x.x"`
- [ ] Workspace scripts: `build`, `dev`, `dev:web`, `dev:tauri`, `lint`, `type-check`
- [ ] devDependencies include: `turbo`, `typescript`, `vitest`, `prettier`

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### turbo.json

- [ ] `build` task with `dependsOn: ["^build"]`
- [ ] `dev` task with `cache: false`, `persistent: true`
- [ ] `lint` task with dependencies
- [ ] `type-check` task with dependencies

---

## Package Configurations

### packages/tsconfig

- [ ] `base.json` - moduleResolution: "bundler", strict: true
- [ ] `react-library.json` - extends base, jsx: "react-jsx"
- [ ] `vite.json` - extends base, includes vite/client types

### packages/eslint-config

- [ ] `base.js` - typescript-eslint, prettier, turbo plugin
- [ ] `react-internal.js` - extends base, react/react-hooks plugins

### packages/shared

- [ ] Exports: `./types`, `./utils`, `./constants`
- [ ] Dependencies: `clsx`, `date-fns`, `tailwind-merge`
- [ ] Contains `cn()` utility function

### packages/ui

- [ ] Fine-grained exports for components/adapters/hooks/contexts
- [ ] Path alias: `@<project>/ui/*` → `./src/*`
- [ ] Peer dependencies: react, react-dom, tailwindcss
- [ ] Contains atomic design component structure

---

## TypeScript Setup

### Path Aliases

- [ ] Apps use `@/*` → `./src/*`
- [ ] UI package uses `@<project>/ui/*` → `./src/*`
- [ ] Shared package accessible via `@<project>/shared/*`

### Configuration Inheritance

- [ ] Apps extend `@<project>/tsconfig/vite.json`
- [ ] UI package extends `@<project>/tsconfig/react-library.json`
- [ ] Shared package extends `@<project>/tsconfig/base.json`

### Compiler Options

- [ ] `strict: true` in all configs
- [ ] `moduleResolution: "bundler"` for Vite compatibility
- [ ] `jsx: "react-jsx"` for React 17+ transform

---

## Component Organization

### Atomic Design Hierarchy

```
packages/ui/src/components/
├── atoms/      # Basic components (Button, Input, Card)
├── molecules/  # Composed atoms (FormField, SearchInput)
├── organisms/  # Feature components (Navbar, DataTable)
├── templates/  # Layout shells (AppShell, AuthLayout)
└── pages/      # Full pages using templates (LoginPage, DashboardPage)
```

### Checklist

- [ ] atoms/ contains basic reusable components
- [ ] molecules/ composes atoms into common patterns
- [ ] organisms/ implements business features
- [ ] templates/ provides layout structures
- [ ] pages/ provides complete page components using templates
- [ ] Each level exports via `index.ts`
- [ ] Components use `cn()` for class merging
- [ ] Components use Tailwind CSS for styling
- [ ] Components use Radix UI for accessible primitives

### AppShell & Layout Pattern

```
templates/
├── AppShell.tsx      # Main layout with ErrorBoundary, Suspense
├── AuthLayout.tsx    # Layout for auth pages
organisms/
├── Sidebar.tsx       # Desktop navigation (optional)
├── BottomNavigation.tsx  # Mobile navigation (optional)
├── Navbar.tsx        # Top navigation bar
atoms/
├── ErrorBoundary.tsx # Error handling component
```

**AppShell Checklist:**

- [ ] ErrorBoundary wraps main content area
- [ ] Suspense with loading fallback for lazy routes
- [ ] Responsive: hideSidebar on mobile, showBottomNav on mobile
- [ ] Uses Outlet from react-router-dom for nested routes
- [ ] Supports embedded mode (hide navigation)

**Sidebar (Optional):**

- [ ] NavLink with active state styling
- [ ] Icon + label + optional badge
- [ ] Header and footer slots
- [ ] Scrollable nav items

**BottomNavigation (Optional):**

- [ ] Fixed at bottom on mobile
- [ ] 4-5 nav items max
- [ ] Active indicator
- [ ] Badge support for notifications

---

## Tailwind CSS v4 Configuration

### Required Setup

- [ ] `@tailwindcss/vite` in devDependencies (NOT PostCSS)
- [ ] `tailwindcss()` in vite.config.ts plugins array
- [ ] NO `tailwind.config.js` file (use CSS-first config)
- [ ] NO `postcss.config.js` for Tailwind

### globals.css Structure

```css
@import 'tailwindcss';

@theme {
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(222.2 84% 4.9%);
  --color-primary: hsl(222.2 47.4% 11.2%);
  /* ... other colors */
}

@theme dark {
  --color-background: hsl(222.2 84% 4.9%);
  /* ... dark mode colors */
}
```

### Checklist

- [ ] Uses `@import "tailwindcss"` (NOT `@tailwind base/components/utilities`)
- [ ] Theme defined with `@theme` directive
- [ ] Colors use `--color-*` naming convention
- [ ] Dark mode uses `@theme dark` block or `@custom-variant`
- [ ] No `@apply` with custom theme classes (use CSS variables directly)
- [ ] Styles imported in main.tsx: `import "@<project>/ui/styles"`

### Custom Theme Variants (Optional)

```css
@custom-variant dark (&:where(.dark, .dark *));
@custom-variant chameleon (&:where(.chameleon, .chameleon *));
@custom-variant simple (&:where(.simple, .simple *));
```

- [ ] Custom variants defined for multi-theme support
- [ ] Theme classes applied to html/root element
- [ ] ThemeProvider supports all custom themes

---

## Adapter Pattern

### Structure

```
packages/ui/src/adapters/
├── factory/
│   ├── ServiceFactory.ts
│   └── interfaces/
│       ├── IAuthService.ts
│       ├── ISyncService.ts
│       └── IDataService.ts
├── tauri/
│   ├── TauriAuthAdapter.ts
│   ├── TauriSyncAdapter.ts
│   └── TauriDataAdapter.ts
├── web/
│   ├── WebAuthAdapter.ts
│   ├── IndexedDBSyncAdapter.ts
│   └── IndexedDBDataAdapter.ts
├── http/
│   └── HttpClient.ts
└── shared/
    └── platform.ts
```

### Checklist

- [ ] `ServiceFactory.ts` exports getters for all services
- [ ] Factory uses lazy singleton pattern
- [ ] `platform.ts` exports `isTauri()` detection
- [ ] Each interface has Tauri and Web implementations
- [ ] Tauri adapters use `tauriInvoke()` wrapper
- [ ] Web adapters use IndexedDB (Dexie) for local storage
- [ ] Services are injected via React Context

---

## Auth Architecture

### Single Source of Truth

```
┌─────────────────────────────────────────────────────┐
│                    AuthService                       │
│  ┌─────────────────────────────────────────────────┐│
│  │ - Stores access/refresh tokens                  ││
│  │ - Provides getTokens() for other services       ││
│  │ - Accepts saveTokensExternal() for updates      ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌─────────────────────┐     ┌─────────────────────────┐
│    SyncService      │     │    Other Services       │
│  - Calls getTokens()│     │  - Calls getTokens()    │
│  - On refresh, calls│     │                         │
│    saveTokensExt()  │     │                         │
└─────────────────────┘     └─────────────────────────┘
```

### Checklist

- [ ] `IAuthService` defines token management interface
- [ ] `getTokens()` returns current tokens
- [ ] `saveTokensExternal()` allows external token updates
- [ ] Tauri auth encrypts tokens with ChaCha20Poly1305
- [ ] Web auth stores tokens in localStorage
- [ ] JWT validation on token access
- [ ] Refresh token rotation support

---

## Sync Architecture

### Required Columns

Every synced table must have:

- [ ] `id: string` (UUID, client-generated)
- [ ] `sync_version: number` (incremented on changes)
- [ ] `synced_at: number | null` (null = pending sync)
- [ ] `deleted: boolean` (for soft delete)
- [ ] `deleted_at: number | null` (TTL tracking)

### Checkpoint-Based Sync

```
┌──────────────┐     push(changes)     ┌──────────────┐
│    Client    │ ──────────────────────▶│    Server    │
│              │                        │              │
│  ┌────────┐  │  pull(checkpoint) ->   │  ┌────────┐  │
│  │ SQLite │  │◀──────────────────────│  │ MongoDB│  │
│  │   or   │  │  <- changes + cursor   │  │        │  │
│  │IndexedDB│ │                        │  └────────┘  │
│  └────────┘  │                        │              │
└──────────────┘                        └──────────────┘
```

### Checklist

- [ ] `sync_metadata` table tracks checkpoints per table
- [ ] Pending changes query: `WHERE synced_at IS NULL`
- [ ] Pull uses checkpoint/cursor for pagination
- [ ] Server-wins conflict resolution (or custom)
- [ ] Soft delete with TTL (default 60 days)
- [ ] Client generates UUIDs for offline creation

---

## Common Issues

### Issue: Module resolution errors

**Symptom**: "Cannot find module '@project/shared'"
**Fix**: Ensure `moduleResolution: "bundler"` in tsconfig

### Issue: Tailwind not working

**Symptom**: Styles not applied
**Fixes**:

- Use `@tailwindcss/vite` plugin, not PostCSS config
- Check `@import "tailwindcss"` in globals.css (not `@tailwind` directives)
- Ensure styles imported in main.tsx before App component
- Verify no conflicting `tailwind.config.js` or `postcss.config.js`

### Issue: Custom colors not working

**Symptom**: `bg-primary` or custom colors undefined
**Fix**: Define colors in `@theme` block with `--color-*` prefix:

```css
@theme {
  --color-primary: hsl(222.2 47.4% 11.2%);
}
```

### Issue: Tauri commands not found

**Symptom**: "command not found: xyz"
**Fix**: Add command to `generate_handler![]` in lib.rs

### Issue: Platform detection wrong

**Symptom**: Wrong adapter used
**Fix**: Check `isTauri()` uses `"__TAURI__" in window`

### Issue: Tokens not persisting (Tauri)

**Symptom**: Logout on restart
**Fix**: Verify encryption key derivation is deterministic

### Issue: Sync conflicts

**Symptom**: Data overwritten unexpectedly
**Fix**: Implement proper `sync_version` comparison

### Issue: IndexedDB not syncing

**Symptom**: Changes not pushed
**Fix**: Verify `synced_at` set to null on local changes

### Issue: Theme conflicts between embedded apps

**Symptom**: Changing theme in App A affects App B
**Fix**: See [Theme & Embedded Pattern](#theme--embedded-pattern) section

---

## Theme & Embedded Pattern

When embedding apps in a parent application, theme management requires isolation.

### Checklist

- [ ] `ThemeProvider` accepts `embedded` prop
- [ ] When `embedded=true`, dispatches custom event instead of modifying `document.documentElement`
- [ ] App uses unique localStorage key (e.g., `"my-app-theme"`)
- [ ] App uses unique event name (e.g., `"my-app-theme-change"`)
- [ ] All theme toggles use `useTheme()` hook (NO direct DOM manipulation)
- [ ] `AppShell` always shows navigation (`showNavigation = true`)
- [ ] `embedded` prop controls theme isolation ONLY, not navigation visibility

### Files to Check

```
packages/ui/src/
├── contexts/
│   └── ThemeContext.tsx        # Must accept embedded prop
├── components/
│   ├── templates/
│   │   └── AppShell.tsx        # showNavigation should NOT depend on embedded
│   ├── organisms/
│   │   └── Sidebar.tsx         # Must use useTheme() hook
│   └── molecules/
│       └── BottomNav.tsx       # Must use useTheme() hook
└── embed/
    └── MyApp.tsx               # Pass embedded to ThemeProvider
```

### Anti-Patterns to Detect

```typescript
// BAD: Direct DOM manipulation in theme toggle
document.documentElement.classList.toggle('dark');
localStorage.setItem('theme', 'dark'); // Generic key

// BAD: Hiding navigation based on embedded
const showNavigation = !embedded;

// GOOD: Using ThemeContext
const { theme, toggleTheme } = useTheme();

// GOOD: Always show navigation
const showNavigation = true;
```

### Validation Commands

```bash
# Check for direct theme manipulation (should be minimal/none outside ThemeContext)
grep -r "document.documentElement.classList" packages/ui/src/components/

# Check for generic theme localStorage key
grep -r 'localStorage.*"theme"' packages/ui/src/

# Check showNavigation depends on embedded (should NOT)
grep -r "showNavigation.*embedded" packages/ui/src/
```

---

## Validation Script

Run this to validate structure:

```bash
#!/bin/bash
# validate-structure.sh

check_exists() {
    if [ -e "$1" ]; then
        echo "✓ $1"
    else
        echo "✗ $1 MISSING"
    fi
}

echo "=== Directory Structure ==="
check_exists "apps/web/package.json"
check_exists "apps/web/vite.config.ts"
check_exists "apps/native/package.json"
check_exists "apps/native/src-tauri/Cargo.toml"
check_exists "apps/native/src-tauri/tauri.conf.json"
check_exists "packages/ui/package.json"
check_exists "packages/shared/package.json"
check_exists "packages/tsconfig/base.json"
check_exists "packages/eslint-config/base.js"
check_exists "pnpm-workspace.yaml"
check_exists "turbo.json"

echo ""
echo "=== Component Structure ==="
check_exists "packages/ui/src/components/atoms"
check_exists "packages/ui/src/components/molecules"
check_exists "packages/ui/src/components/organisms"
check_exists "packages/ui/src/adapters/factory"
check_exists "packages/ui/src/platform"

echo ""
echo "=== Adapter Pattern ==="
check_exists "packages/ui/src/adapters/factory/ServiceFactory.ts"
check_exists "packages/ui/src/adapters/factory/interfaces"
check_exists "packages/ui/src/adapters/tauri"
check_exists "packages/ui/src/adapters/web"
check_exists "packages/ui/src/adapters/shared/platform.ts"
```
