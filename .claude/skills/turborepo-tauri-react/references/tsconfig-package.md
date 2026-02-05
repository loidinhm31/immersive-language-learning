# TypeScript Configuration Package

## Table of Contents

1. [Package Structure](#package-structure)
2. [package.json](#packagejson)
3. [base.json](#basejson)
4. [react-library.json](#react-libraryjson)
5. [vite.json](#vitejson)

---

## Package Structure

```
packages/tsconfig/
├── package.json
├── base.json
├── react-library.json
└── vite.json
```

---

## package.json

```json
{
  "name": "@<project-name>/tsconfig",
  "version": "0.0.0",
  "private": true,
  "license": "MIT",
  "publishConfig": {
    "access": "public"
  },
  "files": ["base.json", "react-library.json", "vite.json"]
}
```

---

## base.json

Base TypeScript configuration for all packages.

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Default",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "noEmit": true,
    "skipLibCheck": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "exclude": ["node_modules", "dist"]
}
```

**Key Settings:**

- `moduleResolution: "bundler"` - For Vite/modern bundlers
- `strict: true` - Full type safety
- `noEmit: true` - Type checking only, bundler handles emit

---

## react-library.json

For shared UI component libraries (packages/ui).

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "React Library",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**Key Settings:**

- Extends base.json
- Adds DOM types for React
- `noEmit: false` - Library needs to emit declarations
- `jsx: "react-jsx"` - React 17+ JSX transform

---

## vite.json

For Vite-based applications (apps/web, apps/native).

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Vite Application",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "types": ["vite/client"]
  }
}
```

**Key Settings:**

- Extends base.json
- Adds DOM types
- Includes Vite client types for import.meta.env

---

## Usage in Consuming Packages

### apps/web/tsconfig.json

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

### apps/web/tsconfig.node.json

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

### packages/ui/tsconfig.json

```json
{
  "extends": "@<project-name>/tsconfig/react-library.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": {
      "@<project-name>/ui/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### packages/shared/tsconfig.json

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
