---
name: turborepo-tauri-react
description: |
  Create and validate Turborepo monorepos with Tauri V2 + React TypeScript. Use when:
  (1) Creating new monorepo projects with apps/web, apps/native (Tauri v2), and shared packages
  (2) Validating existing repos against the standard architecture
  (3) Adding Tauri desktop/mobile apps to existing web projects
  (4) Setting up atomic design component libraries with platform adapters
  (5) Implementing offline-first sync with SQLite (Tauri) and IndexedDB (web)
  (6) Configuring auth patterns with secure token storage
  Triggers: "create monorepo", "turborepo tauri", "tauri react project", "validate monorepo structure", "add tauri to project"
---

# Turborepo + Tauri V2 + React TypeScript Monorepo

Create or validate monorepos following the proven architecture from qm-sync embed apps.

## Quick Reference

### Target Structure

```
<project-name>/
├── apps/
│   ├── web/                    # Vite + React (port 250xx)
│   └── native/                 # Tauri v2 + React (port 1420)
│       └── src-tauri/          # Rust backend
├── packages/
│   ├── ui/                     # Atomic design components + adapters
│   ├── shared/                 # Types, utils, constants
│   ├── tsconfig/               # TS configs (base, react-library, vite)
│   └── eslint-config/          # ESLint (base, react-internal)
├── package.json                # pnpm workspace root
├── pnpm-workspace.yaml
└── turbo.json
```

## Actions

### CREATE: New Monorepo

1. Create root configuration files from `references/root-configs.md`
2. Create `packages/tsconfig/` from `references/tsconfig-package.md`
3. Create `packages/eslint-config/` from `references/eslint-package.md`
4. Create `packages/shared/` from `references/shared-package.md`
5. Create `packages/ui/` from `references/ui-package.md`
6. Create `apps/web/` from `references/web-app.md`
7. Create `apps/native/` from `references/native-app.md`
8. Run `pnpm install`

### VALIDATE: Existing Repo

Check against `references/validation-checklist.md` for:

- Directory structure compliance
- Package.json configurations
- TypeScript paths and exports
- Adapter pattern implementation
- Auth/sync architecture

### MODIFY: Add Missing Parts

Use specific reference files to add missing components while preserving existing code.

## Architecture Principles

### Adapter Pattern (Dependency Injection)

```
packages/ui/src/adapters/
├── factory/
│   ├── ServiceFactory.ts       # Platform detection + lazy singletons
│   └── interfaces/             # Service contracts
├── tauri/                      # Rust IPC adapters
├── web/                        # IndexedDB adapters
├── http/                       # REST API adapters
└── shared/                     # Cross-platform adapters
```

### Component Organization (Atomic Design)

```
packages/ui/src/components/
├── atoms/          # Button, Input, Card, Badge...
├── molecules/      # FormField, DateRangePicker...
├── organisms/      # Complex feature components
├── templates/      # Layout shells (AppShell, AuthLayout)
└── pages/          # Full page components using templates
```

### Auth Token Flow

1. `IAuthService` is single source of truth for tokens
2. `ISyncService.getTokens()` callback retrieves from auth
3. Token refresh updates auth via `saveTokensExternal()`

### Theme Management (Embedded Mode)

When embedding apps in a parent app, use isolated theme management:

```
┌─ Parent App ─────────────────────────────────────────┐
│                                                      │
│  ┌─ ShadowWrapper (storageKey, themeEventName) ───┐ │
│  │                                                │ │
│  │  ┌─ Embedded App (embedded=true) ───────────┐ │ │
│  │  │                                          │ │ │
│  │  │  ThemeProvider → dispatchEvent()         │ │ │
│  │  │       │              │                   │ │ │
│  │  │       ▼              ▼                   │ │ │
│  │  │  localStorage    ShadowWrapper           │ │ │
│  │  │  [app-theme]     updates Shadow DOM      │ │ │
│  │  └──────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

Key rules:

- `embedded` prop controls **theme isolation only**, NOT navigation visibility
- Each app uses unique localStorage key (e.g., `"my-app-theme"`)
- Each app uses unique event name (e.g., `"my-app-theme-change"`)
- All theme toggles must use `useTheme()` hook (no direct DOM manipulation)
- AppShell always shows Sidebar/BottomNav (`showNavigation = true`)

See `references/theme-embedded-pattern.md` for full implementation.

### Sync Architecture

- Tauri: SQLite with `qm-sync-client` Rust crate
- Web: IndexedDB (Dexie) with `QmSyncClient` TypeScript
- Required columns: `sync_version`, `synced_at`, `deleted?`, `deleted_at?`

## Key Technologies

| Layer    | Technology                             |
| -------- | -------------------------------------- |
| Build    | Turborepo, pnpm 9.x                    |
| Frontend | React 19, Vite 7, Tailwind CSS 4       |
| Desktop  | Tauri v2, Rust                         |
| Database | SQLite (Tauri), IndexedDB/Dexie (Web)  |
| Auth     | JWT, secure encrypted storage          |
| Sync     | Checkpoint-based, server-wins conflict |

### Tailwind CSS v4 Notes

- **Plugin**: Use `@tailwindcss/vite` (NOT PostCSS)
- **Import**: `@import "tailwindcss"` (NOT `@tailwind base/components/utilities`)
- **Config**: CSS-first with `@theme` directive (NOT `tailwind.config.js`)
- **Colors**: Define as `--color-*` variables in `@theme`
- **Dark mode**: Use `@theme dark` block for automatic switching

## Reference Files

- `references/root-configs.md` - Root package.json, turbo.json, workspace
- `references/tsconfig-package.md` - TypeScript configuration package
- `references/eslint-package.md` - ESLint configuration package
- `references/shared-package.md` - Shared types/utils package
- `references/ui-package.md` - UI component library with adapters
- `references/web-app.md` - Web application setup
- `references/native-app.md` - Tauri native application setup
- `references/validation-checklist.md` - Structure validation guide
- `references/theme-embedded-pattern.md` - Theme isolation for embedded apps
