# ESLint Configuration Package

## Table of Contents

1. [Package Structure](#package-structure)
2. [package.json](#packagejson)
3. [base.js](#basejs)
4. [react-internal.js](#react-internaljs)

---

## Package Structure

```
packages/eslint-config/
├── package.json
├── base.js
└── react-internal.js
```

---

## package.json

```json
{
  "name": "@<project-name>/eslint-config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./base": "./base.js",
    "./react-internal": "./react-internal.js"
  },
  "devDependencies": {
    "@eslint/js": "^9.27.0",
    "eslint-config-prettier": "^10.1.5",
    "eslint-plugin-only-warn": "^1.1.0",
    "eslint-plugin-react": "^7.37.5",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-turbo": "^2.5.4",
    "typescript-eslint": "^8.33.0"
  }
}
```

---

## base.js

Base ESLint configuration for all packages.

```javascript
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';
import onlyWarn from 'eslint-plugin-only-warn';

/**
 * Base ESLint configuration for TypeScript projects
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '.turbo/**'],
  },
];
```

**Key Features:**

- ESLint recommended rules
- TypeScript ESLint recommended rules
- Prettier compatibility (disables conflicting rules)
- Turbo environment variable checking
- Converts all errors to warnings (dev-friendly)

---

## react-internal.js

Extended configuration for React packages.

```javascript
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import { config as baseConfig } from './base.js';

/**
 * React-specific ESLint configuration
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  ...baseConfig,
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
```

**Key Features:**

- Extends base config
- React recommended rules
- React Hooks rules (critical for correctness)
- Disables prop-types (using TypeScript)
- Disables react-in-jsx-scope (React 17+ JSX transform)

---

## Usage in Consuming Packages

### packages/ui/eslint.config.js

```javascript
import { config } from '@<project-name>/eslint-config/react-internal';

export default config;
```

### packages/shared/eslint.config.js

```javascript
import { config } from '@<project-name>/eslint-config/base';

export default config;
```

### apps/web/eslint.config.js

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

### apps/native/eslint.config.js

```javascript
import { config } from '@<project-name>/eslint-config/react-internal';

export default [
  ...config,
  {
    ignores: ['src-tauri/**'],
  },
];
```

---

## Root eslint.config.js (Optional)

For running lint from root:

```javascript
import { config } from '@<project-name>/eslint-config/base';

export default [
  ...config,
  {
    ignores: ['apps/**', 'packages/**', 'node_modules/**', '.turbo/**'],
  },
];
```
