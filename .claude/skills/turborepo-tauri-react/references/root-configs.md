# Root Configuration Files

## Table of Contents

1. [package.json](#packagejson)
2. [pnpm-workspace.yaml](#pnpm-workspaceyaml)
3. [turbo.json](#turbojson)
4. [.gitignore](#gitignore)
5. [.prettierrc](#prettierrc)
6. [.prettierignore](#prettierignore)

---

## package.json

```json
{
  "name": "<project-name>",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "dev:web": "turbo dev --filter=@<project-name>/web",
    "dev:tauri": "cd apps/native && pnpm tauri dev",
    "build:web": "turbo build --filter=@<project-name>/web",
    "build:tauri": "cd apps/native && pnpm tauri build",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "clean": "turbo clean && rm -rf node_modules"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@types/node": "^22.15.29",
    "@vitejs/plugin-react": "^4.6.0",
    "eslint": "^9.27.0",
    "jsdom": "^26.1.0",
    "prettier": "^3.5.3",
    "turbo": "^2.5.4",
    "typescript": "^5.8.3",
    "vite": "^7.0.4",
    "vitest": "^3.2.1"
  },
  "packageManager": "pnpm@9.1.0",
  "engines": {
    "node": ">=20"
  }
}
```

**Customization Points:**

- Replace `<project-name>` with actual project name (e.g., "my-app")
- Adjust port in dev:web if needed
- Add project-specific dependencies

---

## pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

## turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    },
    "test": {
      "cache": false
    },
    "clean": {
      "cache": false
    }
  }
}
```

---

## .gitignore

```gitignore
# Dependencies
node_modules
.pnpm-store

# Build outputs
dist
.next
.turbo
target

# Tauri
apps/native/src-tauri/target
apps/native/src-tauri/Cargo.lock

# IDE
.idea
.vscode
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Testing
coverage
.vitest

# Misc
*.tsbuildinfo
```

---

## .prettierrc

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

## .prettierignore

```
node_modules
dist
.next
.turbo
coverage
*.min.js
pnpm-lock.yaml
target
```

---

## Directory Creation Commands

```bash
# Create root structure
mkdir -p apps/web apps/native packages/ui packages/shared packages/tsconfig packages/eslint-config

# Initialize git
git init

# Create root files
touch package.json pnpm-workspace.yaml turbo.json .gitignore .prettierrc .prettierignore
```
