# Native Application (apps/native) - Tauri V2

## Table of Contents

1. [Package Structure](#package-structure)
2. [Frontend package.json](#frontend-packagejson)
3. [Vite Configuration](#vite-configuration)
4. [TypeScript Configuration](#typescript-configuration)
5. [Frontend Entry Files](#frontend-entry-files)
6. [Tauri Configuration](#tauri-configuration)
7. [Rust Backend](#rust-backend)
8. [SQLite Database](#sqlite-database)
9. [Sync Implementation](#sync-implementation)
10. [Auth Implementation](#auth-implementation)
11. [Environment Variables](#environment-variables)
12. [Android Setup](#android-setup-optional)

---

## Package Structure

```
apps/native/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
├── index.html
├── .env.example
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   └── vite-env.d.ts
└── src-tauri/
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── capabilities/
    │   └── default.json
    ├── icons/
    │   └── (app icons)
    └── src/
        ├── lib.rs
        ├── db.rs
        ├── sync.rs
        ├── auth.rs
        └── commands/
            └── mod.rs
```

---

## Frontend package.json

```json
{
  "name": "@<project-name>/native",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@<project-name>/shared": "workspace:*",
    "@<project-name>/ui": "workspace:*",
    "@tauri-apps/api": "^2.5.0",
    "@tauri-apps/plugin-opener": "^2.3.0",
    "@tauri-apps/plugin-store": "^2.3.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.9.6"
  },
  "devDependencies": {
    "@<project-name>/eslint-config": "workspace:*",
    "@<project-name>/tsconfig": "workspace:*",
    "@tailwindcss/vite": "^4.1.17",
    "@tauri-apps/cli": "^2.5.0",
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

// Tauri expects fixed host/port for dev
const host = process.env.TAURI_DEV_HOST || 'localhost';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

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

## Frontend Entry Files

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
import "@<project-name>/ui/styles";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### src/App.tsx

```typescript
import { <AppName>App } from "@<project-name>/ui/embed";

export default function App() {
  return <<AppName>App embedded={false} useRouter={true} />;
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

## Tauri Configuration

### src-tauri/tauri.conf.json

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "<Project Name>",
  "version": "0.1.0",
  "identifier": "com.yourcompany.<project-name>",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "<Project Name>",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false,
        "decorations": true
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  },
  "plugins": {
    "opener": {},
    "store": {}
  }
}
```

### src-tauri/capabilities/default.json

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "identifier": "default",
  "description": "Default capabilities for the app",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default",
    "store:default",
    {
      "identifier": "http:default",
      "allow": [{ "url": "http://localhost:*" }, { "url": "https://*.yourserver.com" }]
    }
  ]
}
```

---

## Rust Backend

### src-tauri/Cargo.toml

```toml
[package]
name = "<project-name>-app"
version = "0.1.0"
description = "<Project Name> Desktop Application"
authors = ["Your Name"]
edition = "2021"

[lib]
name = "<project_name>_app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
# Tauri core
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
tauri-plugin-store = "2"

# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Database
rusqlite = { version = "0.37", features = ["bundled"] }

# Async runtime
tokio = { version = "1", features = ["sync", "rt-multi-thread"] }

# HTTP client for sync
reqwest = { version = "0.12", features = ["json", "rustls-tls"] }

# UUID generation
uuid = { version = "1.0", features = ["v4", "serde"] }

# Time utilities
chrono = { version = "0.4", features = ["serde"] }

# Encryption for secure token storage
chacha20poly1305 = "0.10"
argon2 = "0.5"
base64 = "0.22"
rand = "0.8"
sha2 = "0.10"
hex = "0.4"

# JWT validation
jsonwebtoken = "9"

# Logging
log = "0.4"
env_logger = "0.11"

# Error handling
thiserror = "2"
anyhow = "1"

# Optional: Sync client library (if using qm-sync)
# qm-sync-client = { version = "0.1.0", features = ["reqwest-client"] }

# Machine ID for encryption (desktop only)
[target.'cfg(not(target_os = "android"))'.dependencies]
machine-uid = "0.5"

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

### src-tauri/src/lib.rs

```rust
mod auth;
mod db;
mod sync;

use tauri::Manager;
use std::sync::Mutex;

pub struct AppState {
    pub db: Mutex<db::Database>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().expect("Failed to get app data dir");
            std::fs::create_dir_all(&app_data_dir).expect("Failed to create app data dir");

            let db_path = app_data_dir.join("data.db");
            let database = db::Database::new(&db_path).expect("Failed to initialize database");

            app.manage(AppState {
                db: Mutex::new(database),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Auth commands
            auth::login,
            auth::logout,
            auth::register,
            auth::get_auth_status,
            auth::configure_sync,
            auth::save_tokens_external,
            // Sync commands
            sync::sync_now,
            sync::get_sync_status,
            // Data commands (add your domain commands)
            // db::get_items,
            // db::create_item,
            // db::update_item,
            // db::delete_item,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## SQLite Database

### src-tauri/src/db.rs

```rust
use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use std::path::Path;

pub struct Database {
    conn: Connection,
}

/// Base fields required for sync
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncFields {
    pub sync_version: i64,
    pub synced_at: Option<i64>,
    pub deleted: bool,
    pub deleted_at: Option<i64>,
}

impl Default for SyncFields {
    fn default() -> Self {
        Self {
            sync_version: 1,
            synced_at: None,
            deleted: false,
            deleted_at: None,
        }
    }
}

/// Example domain entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Item {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: i64,
    pub updated_at: Option<i64>,
    // Sync fields
    pub sync_version: i64,
    pub synced_at: Option<i64>,
    pub deleted: bool,
    pub deleted_at: Option<i64>,
}

impl Database {
    pub fn new(path: &Path) -> Result<Self> {
        let conn = Connection::open(path)?;
        let db = Self { conn };
        db.init_schema()?;
        Ok(db)
    }

    fn init_schema(&self) -> Result<()> {
        self.conn.execute_batch(
            "
            -- Sync metadata table
            CREATE TABLE IF NOT EXISTS sync_metadata (
                table_name TEXT PRIMARY KEY,
                last_sync_timestamp INTEGER NOT NULL DEFAULT 0,
                cursor TEXT
            );

            -- Auth tokens table
            CREATE TABLE IF NOT EXISTS auth_tokens (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                access_token_encrypted BLOB,
                refresh_token_encrypted BLOB,
                user_id TEXT,
                updated_at INTEGER
            );

            -- Sync config table
            CREATE TABLE IF NOT EXISTS sync_config (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                server_url TEXT,
                app_id TEXT,
                api_key TEXT
            );

            -- Example domain table (customize for your domain)
            CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER,
                -- Sync columns (required)
                sync_version INTEGER NOT NULL DEFAULT 1,
                synced_at INTEGER,
                deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at INTEGER
            );

            -- Index for sync queries
            CREATE INDEX IF NOT EXISTS idx_items_synced_at ON items(synced_at);
            CREATE INDEX IF NOT EXISTS idx_items_deleted ON items(deleted);
            "
        )?;
        Ok(())
    }

    // CRUD operations
    pub fn get_items(&self, include_deleted: bool) -> Result<Vec<Item>> {
        let sql = if include_deleted {
            "SELECT * FROM items ORDER BY created_at DESC"
        } else {
            "SELECT * FROM items WHERE deleted = 0 ORDER BY created_at DESC"
        };

        let mut stmt = self.conn.prepare(sql)?;
        let items = stmt.query_map([], |row| {
            Ok(Item {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
                sync_version: row.get(5)?,
                synced_at: row.get(6)?,
                deleted: row.get::<_, i64>(7)? != 0,
                deleted_at: row.get(8)?,
            })
        })?.collect::<Result<Vec<_>>>()?;

        Ok(items)
    }

    pub fn create_item(&self, item: &Item) -> Result<()> {
        self.conn.execute(
            "INSERT INTO items (id, name, description, created_at, updated_at, sync_version, synced_at, deleted, deleted_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                item.id,
                item.name,
                item.description,
                item.created_at,
                item.updated_at,
                item.sync_version,
                item.synced_at,
                item.deleted as i64,
                item.deleted_at
            ],
        )?;
        Ok(())
    }

    pub fn update_item(&self, item: &Item) -> Result<()> {
        self.conn.execute(
            "UPDATE items SET name = ?1, description = ?2, updated_at = ?3,
             sync_version = sync_version + 1, synced_at = NULL
             WHERE id = ?4",
            params![item.name, item.description, item.updated_at, item.id],
        )?;
        Ok(())
    }

    pub fn delete_item(&self, id: &str) -> Result<()> {
        let now = chrono::Utc::now().timestamp();
        self.conn.execute(
            "UPDATE items SET deleted = 1, deleted_at = ?1,
             sync_version = sync_version + 1, synced_at = NULL
             WHERE id = ?2",
            params![now, id],
        )?;
        Ok(())
    }

    // Sync operations
    pub fn get_pending_changes(&self, table: &str) -> Result<Vec<serde_json::Value>> {
        let sql = format!(
            "SELECT * FROM {} WHERE synced_at IS NULL OR synced_at < updated_at",
            table
        );
        // Implementation depends on your sync protocol
        todo!("Implement based on your sync protocol")
    }

    pub fn mark_synced(&self, table: &str, id: &str, sync_version: i64) -> Result<()> {
        let now = chrono::Utc::now().timestamp();
        let sql = format!(
            "UPDATE {} SET synced_at = ?1, sync_version = ?2 WHERE id = ?3",
            table
        );
        self.conn.execute(&sql, params![now, sync_version, id])?;
        Ok(())
    }

    pub fn get_sync_checkpoint(&self, table: &str) -> Result<(i64, Option<String>)> {
        let mut stmt = self.conn.prepare(
            "SELECT last_sync_timestamp, cursor FROM sync_metadata WHERE table_name = ?1"
        )?;

        match stmt.query_row([table], |row| {
            Ok((row.get::<_, i64>(0)?, row.get::<_, Option<String>>(1)?))
        }) {
            Ok(result) => Ok(result),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok((0, None)),
            Err(e) => Err(e),
        }
    }

    pub fn update_sync_checkpoint(&self, table: &str, timestamp: i64, cursor: Option<&str>) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO sync_metadata (table_name, last_sync_timestamp, cursor)
             VALUES (?1, ?2, ?3)",
            params![table, timestamp, cursor],
        )?;
        Ok(())
    }
}
```

---

## Sync Implementation

### src-tauri/src/sync.rs

```rust
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub pushed: usize,
    pub pulled: usize,
    pub conflicts: usize,
    pub success: bool,
    pub error: Option<String>,
    pub synced_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStatus {
    pub last_sync_at: Option<i64>,
    pub pending_changes: usize,
    pub is_syncing: bool,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn sync_now(state: State<'_, AppState>) -> Result<SyncResult, String> {
    // Get sync config from database
    // let db = state.db.lock().map_err(|e| e.to_string())?;

    // Implementation:
    // 1. Get pending local changes
    // 2. Push to server
    // 3. Pull changes from server (with checkpoint)
    // 4. Apply remote changes with conflict resolution
    // 5. Update sync checkpoints

    // Example using qm-sync-client (if available):
    // let sync_client = qm_sync_client::SyncClient::new(config);
    // let result = sync_client.sync().await?;

    Ok(SyncResult {
        pushed: 0,
        pulled: 0,
        conflicts: 0,
        success: true,
        error: None,
        synced_at: chrono::Utc::now().timestamp(),
    })
}

#[tauri::command]
pub async fn get_sync_status(state: State<'_, AppState>) -> Result<SyncStatus, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Count pending changes (records where synced_at is NULL)
    // let pending = db.count_pending_changes()?;

    Ok(SyncStatus {
        last_sync_at: None,
        pending_changes: 0,
        is_syncing: false,
        error: None,
    })
}
```

---

## Auth Implementation

### src-tauri/src/auth.rs

```rust
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::AppState;

// Encryption utilities for secure token storage
mod crypto {
    use chacha20poly1305::{
        aead::{Aead, KeyInit},
        ChaCha20Poly1305, Nonce,
    };
    use argon2::Argon2;
    use rand::Rng;

    const SALT: &[u8] = b"your-app-salt-here";

    pub fn derive_key() -> [u8; 32] {
        // Use machine-specific identifier for key derivation
        #[cfg(not(target_os = "android"))]
        let machine_id = machine_uid::get().unwrap_or_else(|_| "fallback-id".to_string());

        #[cfg(target_os = "android")]
        let machine_id = "android-device".to_string();

        let mut key = [0u8; 32];
        Argon2::default()
            .hash_password_into(machine_id.as_bytes(), SALT, &mut key)
            .expect("Key derivation failed");
        key
    }

    pub fn encrypt(data: &[u8]) -> Vec<u8> {
        let key = derive_key();
        let cipher = ChaCha20Poly1305::new_from_slice(&key).unwrap();
        let mut nonce_bytes = [0u8; 12];
        rand::rng().fill(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = cipher.encrypt(nonce, data).expect("Encryption failed");

        let mut result = nonce_bytes.to_vec();
        result.extend(ciphertext);
        result
    }

    pub fn decrypt(data: &[u8]) -> Option<Vec<u8>> {
        if data.len() < 12 {
            return None;
        }

        let key = derive_key();
        let cipher = ChaCha20Poly1305::new_from_slice(&key).unwrap();
        let nonce = Nonce::from_slice(&data[..12]);

        cipher.decrypt(nonce, &data[12..]).ok()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConfig {
    pub server_url: String,
    pub app_id: String,
    pub api_key: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResponse {
    pub success: bool,
    pub message: Option<String>,
    pub tokens: Option<AuthTokens>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthTokens {
    pub access_token: String,
    pub refresh_token: String,
    pub user_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthStatus {
    pub is_authenticated: bool,
    pub user_id: Option<String>,
    pub email: Option<String>,
}

#[tauri::command]
pub async fn configure_sync(
    state: State<'_, AppState>,
    config: SyncConfig,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    db.conn.execute(
        "INSERT OR REPLACE INTO sync_config (id, server_url, app_id, api_key) VALUES (1, ?1, ?2, ?3)",
        rusqlite::params![config.server_url, config.app_id, config.api_key],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn login(
    state: State<'_, AppState>,
    email: String,
    password: String,
) -> Result<AuthResponse, String> {
    // Get sync config
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Call server auth endpoint
    // let client = reqwest::Client::new();
    // let response = client.post(format!("{}/auth/login", server_url))
    //     .json(&LoginRequest { email, password })
    //     .send()
    //     .await
    //     .map_err(|e| e.to_string())?;

    // Store tokens encrypted
    // if let Some(tokens) = &response.tokens {
    //     let encrypted_access = crypto::encrypt(tokens.access_token.as_bytes());
    //     let encrypted_refresh = crypto::encrypt(tokens.refresh_token.as_bytes());
    //     db.store_tokens(&encrypted_access, &encrypted_refresh, &tokens.user_id)?;
    // }

    Ok(AuthResponse {
        success: true,
        message: None,
        tokens: None,
    })
}

#[tauri::command]
pub async fn logout(state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    db.conn.execute("DELETE FROM auth_tokens WHERE id = 1", [])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn register(
    state: State<'_, AppState>,
    username: String,
    email: String,
    password: String,
) -> Result<AuthResponse, String> {
    // Similar to login, call server register endpoint
    Ok(AuthResponse {
        success: true,
        message: Some("Registration successful".to_string()),
        tokens: None,
    })
}

#[tauri::command]
pub async fn get_auth_status(state: State<'_, AppState>) -> Result<AuthStatus, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let result: Result<(Vec<u8>, String), _> = db.conn.query_row(
        "SELECT access_token_encrypted, user_id FROM auth_tokens WHERE id = 1",
        [],
        |row| Ok((row.get(0)?, row.get(1)?)),
    );

    match result {
        Ok((encrypted_token, user_id)) => {
            let is_valid = crypto::decrypt(&encrypted_token).is_some();
            Ok(AuthStatus {
                is_authenticated: is_valid,
                user_id: if is_valid { Some(user_id) } else { None },
                email: None,
            })
        }
        Err(_) => Ok(AuthStatus {
            is_authenticated: false,
            user_id: None,
            email: None,
        }),
    }
}

#[tauri::command]
pub async fn save_tokens_external(
    state: State<'_, AppState>,
    access_token: String,
    refresh_token: String,
    user_id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let encrypted_access = crypto::encrypt(access_token.as_bytes());
    let encrypted_refresh = crypto::encrypt(refresh_token.as_bytes());
    let now = chrono::Utc::now().timestamp();

    db.conn.execute(
        "INSERT OR REPLACE INTO auth_tokens (id, access_token_encrypted, refresh_token_encrypted, user_id, updated_at)
         VALUES (1, ?1, ?2, ?3, ?4)",
        rusqlite::params![encrypted_access, encrypted_refresh, user_id, now],
    ).map_err(|e| e.to_string())?;

    Ok(())
}
```

---

## Environment Variables

### .env.example

```bash
# Sync server URL
VITE_SERVER_URL=http://localhost:3000

# App identifier
VITE_APP_ID=<project-name>

# API key
VITE_API_KEY=your-api-key
```

---

## Android Setup (Optional)

### Enable Android target

1. Install Android Studio and SDK
2. Add to Cargo.toml:

```toml
[target.'cfg(target_os = "android")'.dependencies]
# Android-specific deps
```

3. Configure in tauri.conf.json:

```json
{
  "bundle": {
    "android": {
      "minSdkVersion": 24
    }
  }
}
```

4. Build commands:

```bash
pnpm tauri android init
pnpm tauri android dev
pnpm tauri android build
```

---

## Development Commands

```bash
# From apps/native directory
pnpm dev        # Start Vite dev server only
pnpm tauri dev  # Start full Tauri development
pnpm tauri build # Build release binary

# From root directory
pnpm dev:tauri  # Start Tauri via Turborepo
```

---

## Build Output

After `pnpm tauri build`:

- **Windows**: `src-tauri/target/release/bundle/msi/`
- **macOS**: `src-tauri/target/release/bundle/dmg/`
- **Linux**: `src-tauri/target/release/bundle/deb/` or `/appimage/`
