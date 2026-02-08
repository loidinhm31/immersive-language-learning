/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

use crate::db::Database;
use qm_sync_client::{
    Checkpoint, QmSyncClient, ReqwestHttpClient, SyncClientConfig, SyncRecord,
};
use rusqlite::params;
use serde::{Deserialize, Serialize};

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
    pub configured: bool,
    pub authenticated: bool,
    pub last_sync_at: Option<i64>,
    pub pending_changes: usize,
    pub server_url: Option<String>,
}

#[derive(Debug, Clone)]
pub struct SessionHistory {
    pub id: String,
    pub mission_json: Option<String>,
    pub language: String,
    pub from_language: String,
    pub mode: String,
    pub voice: String,
    pub result_json: String,
    pub completed_at: i64,
    pub sync_version: i64,
    pub synced_at: Option<i64>,
    pub deleted: bool,
    pub deleted_at: Option<i64>,
}

pub struct SyncService {
    db: Database,
}

impl SyncService {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    /// Main sync operation - pushes local changes and pulls remote changes
    #[tauri::command]
    pub async fn sync_now(
        server_url: String,
        access_token: String,
        refresh_token: String,
        app_id: String,
        api_key: String,
    ) -> Result<SyncResult, String> {
        let db = Database::new(std::path::Path::new("immergo.db")).map_err(|e| e.to_string())?;
        let service = SyncService::new(db);
        service.perform_sync(&server_url, &access_token, &refresh_token, &app_id, &api_key).await
    }

    async fn perform_sync(
        &self,
        server_url: &str,
        access_token: &str,
        refresh_token: &str,
        app_id: &str,
        api_key: &str,
    ) -> Result<SyncResult, String> {
        let synced_at = chrono::Utc::now().timestamp();

        // Create sync client
        let config = SyncClientConfig::new(server_url, app_id, api_key);
        let http = ReqwestHttpClient::new();
        let mut client = QmSyncClient::new(config, http);
        client
            .set_tokens(access_token, refresh_token, None)
            .await
            .map_err(|e| format!("Failed to set tokens: {}", e))?;

        // Collect local changes
        let local_changes = self.collect_local_changes()?;
        println!("Collected {} local changes", local_changes.len());

        // Get checkpoint
        let checkpoint = self.get_checkpoint()?;

        // Perform delta sync
        let response = client
            .delta(local_changes.clone(), checkpoint)
            .await
            .map_err(|e| format!("Sync failed: {}", e))?;

        // Process push result
        let pushed = response.push_response.synced_count;
        let conflicts = response.push_response.conflicts.as_ref().map(|c| c.len()).unwrap_or(0);

        // Mark pushed records as synced
        if pushed > 0 {
            let synced_records = &local_changes[..pushed.min(local_changes.len())];
            self.mark_records_synced(synced_records, synced_at)?;
        }

        // Process pull result
        let pulled = response.pull_response.records.len();
        if pulled > 0 {
            self.apply_remote_changes(&response.pull_response.records)?;
        }

        // Save new checkpoint
        if let Some(new_checkpoint) = response.pull_response.checkpoint {
            self.save_checkpoint(&new_checkpoint)?;
        }

        // Update last sync timestamp
        self.save_last_sync(synced_at)?;

        Ok(SyncResult {
            pushed,
            pulled,
            conflicts,
            success: true,
            error: None,
            synced_at,
        })
    }

    /// Get current sync status
    #[tauri::command]
    pub async fn get_sync_status() -> Result<SyncStatus, String> {
        let db = Database::new(std::path::Path::new("immergo.db")).map_err(|e| e.to_string())?;
        let service = SyncService::new(db);
        service.get_status()
    }

    fn get_status(&self) -> Result<SyncStatus, String> {
        let pending_changes = self.count_pending_changes()?;
        let last_sync_at = self.get_last_sync()?;

        Ok(SyncStatus {
            configured: true, // Always true if we can access the DB
            authenticated: false, // Determined by caller (has tokens?)
            last_sync_at,
            pending_changes,
            server_url: None,
        })
    }

    /// Configure sync settings
    #[tauri::command]
    pub async fn configure_sync(
        _server_url: String,
        _app_id: String,
        _api_key: String,
    ) -> Result<(), String> {
        // Configuration is handled at the app level (stored in Tauri store)
        Ok(())
    }

    /// Reset sync state (for debugging)
    #[tauri::command]
    pub async fn reset_sync() -> Result<(), String> {
        let db = Database::new(std::path::Path::new("immergo.db")).map_err(|e| e.to_string())?;
        db.conn
            .execute("DELETE FROM sync_metadata", [])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // ===== Private helper methods =====

    fn collect_local_changes(&self) -> Result<Vec<SyncRecord>, String> {
        let mut records = Vec::new();

        // Collect deleted sessions
        let deleted_sessions = self.query_deleted_sessions()?;
        for session in deleted_sessions {
            records.push(SyncRecord {
                table_name: "session_history".to_string(),
                row_id: session.id,
                data: serde_json::json!({}),
                version: session.sync_version,
                deleted: true,
            });
        }

        // Collect active unsynced sessions
        let sessions = self.query_unsynced_sessions()?;
        for session in sessions {
            records.push(self.session_to_sync_record(&session, false)?);
        }

        Ok(records)
    }

    fn query_deleted_sessions(&self) -> Result<Vec<SessionHistory>, String> {
        let mut stmt = self
            .db
            .conn
            .prepare(
                "SELECT id, mission_json, language, from_language, mode, voice, result_json,
                        completed_at, sync_version, synced_at, deleted, deleted_at
                 FROM session_history
                 WHERE deleted = 1 AND synced_at IS NULL",
            )
            .map_err(|e| e.to_string())?;

        let sessions = stmt
            .query_map([], |row| {
                Ok(SessionHistory {
                    id: row.get(0)?,
                    mission_json: row.get(1)?,
                    language: row.get(2)?,
                    from_language: row.get(3)?,
                    mode: row.get(4)?,
                    voice: row.get(5)?,
                    result_json: row.get(6)?,
                    completed_at: row.get(7)?,
                    sync_version: row.get(8)?,
                    synced_at: row.get(9)?,
                    deleted: row.get::<_, i64>(10)? == 1,
                    deleted_at: row.get(11)?,
                })
            })
            .map_err(|e| e.to_string())?;

        sessions.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
    }

    fn query_unsynced_sessions(&self) -> Result<Vec<SessionHistory>, String> {
        let mut stmt = self
            .db
            .conn
            .prepare(
                "SELECT id, mission_json, language, from_language, mode, voice, result_json,
                        completed_at, sync_version, synced_at, deleted, deleted_at
                 FROM session_history
                 WHERE deleted = 0 AND synced_at IS NULL",
            )
            .map_err(|e| e.to_string())?;

        let sessions = stmt
            .query_map([], |row| {
                Ok(SessionHistory {
                    id: row.get(0)?,
                    mission_json: row.get(1)?,
                    language: row.get(2)?,
                    from_language: row.get(3)?,
                    mode: row.get(4)?,
                    voice: row.get(5)?,
                    result_json: row.get(6)?,
                    completed_at: row.get(7)?,
                    sync_version: row.get(8)?,
                    synced_at: row.get(9)?,
                    deleted: row.get::<_, i64>(10)? == 1,
                    deleted_at: row.get(11)?,
                })
            })
            .map_err(|e| e.to_string())?;

        sessions.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
    }

    fn session_to_sync_record(
        &self,
        session: &SessionHistory,
        deleted: bool,
    ) -> Result<SyncRecord, String> {
        let mut data = serde_json::json!({
            "mission_json": session.mission_json,
            "language": session.language,
            "from_language": session.from_language,
            "mode": session.mode,
            "voice": session.voice,
            "result_json": session.result_json,
            "completed_at": session.completed_at,
        });

        // Remove null fields
        if let Some(obj) = data.as_object_mut() {
            obj.retain(|_, v| !v.is_null());
        }

        Ok(SyncRecord {
            table_name: "session_history".to_string(),
            row_id: session.id.clone(),
            data,
            version: session.sync_version,
            deleted,
        })
    }

    fn apply_remote_changes(&self, records: &[SyncRecord]) -> Result<(), String> {
        for record in records {
            if record.table_name != "session_history" {
                eprintln!("Unknown table: {}", record.table_name);
                continue;
            }

            if record.deleted {
                // Hard delete
                self.hard_delete_session(&record.row_id)?;
            } else {
                // Upsert
                let session = self.sync_record_to_session(record)?;
                let exists = self.session_exists(&record.row_id)?;

                if exists {
                    self.update_session(&session)?;
                } else {
                    self.create_session(&session)?;
                }
            }
        }
        Ok(())
    }

    fn sync_record_to_session(&self, record: &SyncRecord) -> Result<SessionHistory, String> {
        let data = &record.data;
        let now = chrono::Utc::now().timestamp();

        Ok(SessionHistory {
            id: record.row_id.clone(),
            mission_json: data.get("mission_json").and_then(|v| v.as_str()).map(String::from),
            language: data
                .get("language")
                .and_then(|v| v.as_str())
                .ok_or("Missing language")?
                .to_string(),
            from_language: data
                .get("from_language")
                .and_then(|v| v.as_str())
                .ok_or("Missing from_language")?
                .to_string(),
            mode: data
                .get("mode")
                .and_then(|v| v.as_str())
                .ok_or("Missing mode")?
                .to_string(),
            voice: data
                .get("voice")
                .and_then(|v| v.as_str())
                .ok_or("Missing voice")?
                .to_string(),
            result_json: data
                .get("result_json")
                .and_then(|v| v.as_str())
                .ok_or("Missing result_json")?
                .to_string(),
            completed_at: data
                .get("completed_at")
                .and_then(|v| v.as_i64())
                .ok_or("Missing completed_at")?,
            sync_version: record.version,
            synced_at: Some(now),
            deleted: false,
            deleted_at: None,
        })
    }

    fn session_exists(&self, id: &str) -> Result<bool, String> {
        let count: i64 = self
            .db
            .conn
            .query_row(
                "SELECT COUNT(*) FROM session_history WHERE id = ?1",
                params![id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        Ok(count > 0)
    }

    fn create_session(&self, session: &SessionHistory) -> Result<(), String> {
        self.db
            .conn
            .execute(
                "INSERT INTO session_history (id, mission_json, language, from_language, mode, voice,
                 result_json, completed_at, sync_version, synced_at, deleted, deleted_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
                params![
                    session.id,
                    session.mission_json,
                    session.language,
                    session.from_language,
                    session.mode,
                    session.voice,
                    session.result_json,
                    session.completed_at,
                    session.sync_version,
                    session.synced_at,
                    if session.deleted { 1 } else { 0 },
                    session.deleted_at,
                ],
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    fn update_session(&self, session: &SessionHistory) -> Result<(), String> {
        self.db
            .conn
            .execute(
                "UPDATE session_history
                 SET mission_json = ?2, language = ?3, from_language = ?4, mode = ?5, voice = ?6,
                     result_json = ?7, completed_at = ?8, sync_version = ?9, synced_at = ?10,
                     deleted = ?11, deleted_at = ?12
                 WHERE id = ?1",
                params![
                    session.id,
                    session.mission_json,
                    session.language,
                    session.from_language,
                    session.mode,
                    session.voice,
                    session.result_json,
                    session.completed_at,
                    session.sync_version,
                    session.synced_at,
                    if session.deleted { 1 } else { 0 },
                    session.deleted_at,
                ],
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    fn hard_delete_session(&self, id: &str) -> Result<(), String> {
        self.db
            .conn
            .execute("DELETE FROM session_history WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    fn mark_records_synced(&self, records: &[SyncRecord], synced_at: i64) -> Result<(), String> {
        for record in records {
            if record.deleted {
                self.hard_delete_session(&record.row_id)?;
            } else {
                self.db
                    .conn
                    .execute(
                        "UPDATE session_history SET synced_at = ?1, sync_version = sync_version + 1 WHERE id = ?2",
                        params![synced_at, record.row_id],
                    )
                    .map_err(|e| e.to_string())?;
            }
        }
        Ok(())
    }

    fn count_pending_changes(&self) -> Result<usize, String> {
        let count: i64 = self
            .db
            .conn
            .query_row(
                "SELECT COUNT(*) FROM session_history WHERE synced_at IS NULL",
                [],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        Ok(count as usize)
    }

    fn get_checkpoint(&self) -> Result<Option<Checkpoint>, String> {
        let result: Result<(String, String), _> = self.db.conn.query_row(
            "SELECT last_sync_timestamp, cursor FROM sync_metadata WHERE table_name = 'checkpoint'",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        );

        match result {
            Ok((updated_at, id)) => Ok(Some(Checkpoint { updated_at, id })),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    }

    fn save_checkpoint(&self, checkpoint: &Checkpoint) -> Result<(), String> {
        self.db
            .conn
            .execute(
                "INSERT OR REPLACE INTO sync_metadata (table_name, last_sync_timestamp, cursor)
                 VALUES ('checkpoint', ?1, ?2)",
                params![checkpoint.updated_at, checkpoint.id],
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    fn get_last_sync(&self) -> Result<Option<i64>, String> {
        let result: Result<i64, _> = self.db.conn.query_row(
            "SELECT last_sync_timestamp FROM sync_metadata WHERE table_name = 'last_sync'",
            [],
            |row| row.get(0),
        );

        match result {
            Ok(timestamp) => Ok(Some(timestamp)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    }

    fn save_last_sync(&self, timestamp: i64) -> Result<(), String> {
        self.db
            .conn
            .execute(
                "INSERT OR REPLACE INTO sync_metadata (table_name, last_sync_timestamp, cursor)
                 VALUES ('last_sync', ?1, '')",
                params![timestamp],
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }
}
