# Web Application (apps/web)

## Table of Contents

1. [Package Structure](#package-structure)
2. [package.json](#packagejson)
3. [Vite Configuration](#vite-configuration)
4. [TypeScript Configuration](#typescript-configuration)
5. [Entry Files](#entry-files)
6. [Environment Variables](#environment-variables)

---

## Package Structure

```
apps/web/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
├── index.html
├── .env.example
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── vite-env.d.ts
    └── assets/
        └── (optional local assets)
```

---

## package.json

```json
{
  "name": "@<project-name>/web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@<project-name>/shared": "workspace:*",
    "@<project-name>/ui": "workspace:*",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.9.6"
  },
  "devDependencies": {
    "@<project-name>/eslint-config": "workspace:*",
    "@<project-name>/tsconfig": "workspace:*",
    "@tailwindcss/vite": "^4.1.17",
    "@types/react": "^19.1.6",
    "@types/react-dom": "^19.1.5",
    "@vitejs/plugin-react": "^4.6.0",
    "tailwindcss": "^4.1.17",
    "typescript": "^5.8.3",
    "vite": "^7.0.4"
  }
}
```

---

## Vite Configuration

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 25001, // Customize per project (250xx range)
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

**Key Points:**

- Tailwind CSS v4 via `@tailwindcss/vite` plugin (NOT PostCSS)
- Path alias `@` maps to `./src`
- Use ports in 250xx range to avoid conflicts

---

## TypeScript Configuration

### tsconfig.json

```json
{
  "extends": "@<project-name>/tsconfig/vite.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### tsconfig.node.json

```json
{
  "extends": "@<project-name>/tsconfig/base.json",
  "compilerOptions": {
    "composite": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

---

## Entry Files

### index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><Project Name></title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### src/main.tsx

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Import global styles from UI package
import "@<project-name>/ui/styles";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### src/App.tsx

```typescript
// Option 1: Use the embeddable component from UI package
import { <AppName>App } from "@<project-name>/ui/embed";

export default function App() {
  return (
    <<AppName>App
      embedded={false}  // false = standalone mode (theme applied to document.documentElement)
                        // true = embedded in parent app (theme dispatched via custom event)
      useRouter={true}
    />
  );
}
```

```typescript
// Option 2: Build custom app structure
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  PlatformProvider,
  ThemeProvider,
  DialogProvider,
} from "@<project-name>/ui/contexts";
import {
  getAuthService,
  getSyncService,
  getDataService,
} from "@<project-name>/ui/adapters/factory";
import { AppShell } from "@<project-name>/ui/components/templates";
import { DashboardPage, LoginPage } from "@<project-name>/ui/components/pages";

export default function App() {
  const services = {
    auth: getAuthService(),
    sync: getSyncService(),
    data: getDataService(),
  };

  return (
    <PlatformProvider services={services}>
      <ThemeProvider>  {/* embedded defaults to false for standalone mode */}
        <DialogProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<AppShell />}>
                <Route index element={<DashboardPage />} />
                {/* Add more routes */}
              </Route>
            </Routes>
          </BrowserRouter>
        </DialogProvider>
      </ThemeProvider>
    </PlatformProvider>
  );
}
```

### src/vite-env.d.ts

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVER_URL: string;
  readonly VITE_APP_ID: string;
  readonly VITE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## Environment Variables

### .env.example

```bash
# Server URL for sync and auth
VITE_SERVER_URL=http://localhost:3000

# App identifier for sync
VITE_APP_ID=<project-name>

# API key for app authentication
VITE_API_KEY=your-api-key-here
```

### .env.local (gitignored)

```bash
VITE_SERVER_URL=http://localhost:3000
VITE_APP_ID=<project-name>
VITE_API_KEY=actual-api-key
```

---

## ESLint Configuration

### eslint.config.js

```javascript
import { config } from '@<project-name>/eslint-config/react-internal';

export default [
  ...config,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
];
```

---

## Build Output

After `pnpm build`:

```
apps/web/dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── vite.svg
```

---

## Development Commands

```bash
# From apps/web directory
pnpm dev        # Start dev server on port 250xx
pnpm build      # Build for production
pnpm preview    # Preview production build
pnpm lint       # Run ESLint
pnpm type-check # TypeScript check

# From root directory
pnpm dev:web    # Start web app via Turborepo
pnpm build:web  # Build web app via Turborepo
```
