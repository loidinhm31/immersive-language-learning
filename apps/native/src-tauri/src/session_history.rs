use serde::{Deserialize, Serialize};
use tauri::State;
use crate::AppState;
use rusqlite::params;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionHistoryEntry {
    pub id: String,
    pub mission: Option<serde_json::Value>,
    pub language: String,
    #[serde(rename = "fromLanguage")]
    pub from_language: String,
    pub mode: String,
    pub voice: String,
    pub result: serde_json::Value,
    #[serde(rename = "completedAt")]
    pub completed_at: i64,
    pub sync_version: Option<i64>,
    pub synced_at: Option<i64>,
    pub deleted: Option<bool>,
    pub deleted_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SessionHistoryFilter {
    pub language: Option<String>,
    #[serde(rename = "fromLanguage")]
    pub from_language: Option<String>,
    pub mode: Option<String>,
    #[serde(rename = "fromDate")]
    pub from_date: Option<i64>,
    #[serde(rename = "toDate")]
    pub to_date: Option<i64>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[tauri::command]
pub async fn save_session(
    state: State<'_, AppState>,
    entry: SessionHistoryEntry,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let mission_json = entry.mission.map(|m| m.to_string());
    let result_json = entry.result.to_string();

    db.conn.execute(
        "INSERT OR REPLACE INTO session_history
         (id, mission_json, language, from_language, mode, voice, result_json, completed_at,
          sync_version, synced_at, deleted, deleted_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            entry.id,
            mission_json,
            entry.language,
            entry.from_language,
            entry.mode,
            entry.voice,
            result_json,
            entry.completed_at,
            entry.sync_version.unwrap_or(1),
            entry.synced_at,
            if entry.deleted.unwrap_or(false) { 1 } else { 0 },
            entry.deleted_at,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_all_sessions(
    state: State<'_, AppState>,
    filter: Option<SessionHistoryFilter>,
) -> Result<Vec<SessionHistoryEntry>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let filter = filter.unwrap_or_default();

    let mut sql = String::from(
        "SELECT id, mission_json, language, from_language, mode, voice, result_json,
                completed_at, sync_version, synced_at, deleted, deleted_at
         FROM session_history WHERE deleted = 0"
    );

    let mut conditions = Vec::new();

    if filter.language.is_some() {
        conditions.push("language = ?");
    }
    if filter.from_language.is_some() {
        conditions.push("from_language = ?");
    }
    if filter.mode.is_some() {
        conditions.push("mode = ?");
    }
    if filter.from_date.is_some() {
        conditions.push("completed_at >= ?");
    }
    if filter.to_date.is_some() {
        conditions.push("completed_at <= ?");
    }

    for cond in &conditions {
        sql.push_str(" AND ");
        sql.push_str(cond);
    }

    sql.push_str(" ORDER BY completed_at DESC");

    if let Some(limit) = filter.limit {
        sql.push_str(&format!(" LIMIT {}", limit));
    }
    if let Some(offset) = filter.offset {
        sql.push_str(&format!(" OFFSET {}", offset));
    }

    let mut stmt = db.conn.prepare(&sql).map_err(|e| e.to_string())?;

    // Build params dynamically
    let mut param_idx = 1usize;
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(ref lang) = filter.language {
        params.push(Box::new(lang.clone()));
        param_idx += 1;
    }
    if let Some(ref from_lang) = filter.from_language {
        params.push(Box::new(from_lang.clone()));
        param_idx += 1;
    }
    if let Some(ref mode) = filter.mode {
        params.push(Box::new(mode.clone()));
        param_idx += 1;
    }
    if let Some(from_date) = filter.from_date {
        params.push(Box::new(from_date));
        param_idx += 1;
    }
    if let Some(to_date) = filter.to_date {
        params.push(Box::new(to_date));
        let _ = param_idx; // Suppress unused warning
    }

    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let rows = stmt.query_map(params_refs.as_slice(), |row| {
        let mission_json: Option<String> = row.get(1)?;
        let result_json: String = row.get(6)?;
        let deleted_int: i64 = row.get(10)?;

        Ok(SessionHistoryEntry {
            id: row.get(0)?,
            mission: mission_json.map(|s| serde_json::from_str(&s).unwrap_or(serde_json::Value::Null)),
            language: row.get(2)?,
            from_language: row.get(3)?,
            mode: row.get(4)?,
            voice: row.get(5)?,
            result: serde_json::from_str(&result_json).unwrap_or(serde_json::Value::Null),
            completed_at: row.get(7)?,
            sync_version: row.get(8)?,
            synced_at: row.get(9)?,
            deleted: Some(deleted_int != 0),
            deleted_at: row.get(11)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }

    Ok(results)
}

#[tauri::command]
pub async fn get_session(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<SessionHistoryEntry>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let result = db.conn.query_row(
        "SELECT id, mission_json, language, from_language, mode, voice, result_json,
                completed_at, sync_version, synced_at, deleted, deleted_at
         FROM session_history WHERE id = ?1 AND deleted = 0",
        [&id],
        |row| {
            let mission_json: Option<String> = row.get(1)?;
            let result_json: String = row.get(6)?;
            let deleted_int: i64 = row.get(10)?;

            Ok(SessionHistoryEntry {
                id: row.get(0)?,
                mission: mission_json.map(|s| serde_json::from_str(&s).unwrap_or(serde_json::Value::Null)),
                language: row.get(2)?,
                from_language: row.get(3)?,
                mode: row.get(4)?,
                voice: row.get(5)?,
                result: serde_json::from_str(&result_json).unwrap_or(serde_json::Value::Null),
                completed_at: row.get(7)?,
                sync_version: row.get(8)?,
                synced_at: row.get(9)?,
                deleted: Some(deleted_int != 0),
                deleted_at: row.get(11)?,
            })
        },
    );

    match result {
        Ok(entry) => Ok(Some(entry)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn delete_session(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().timestamp_millis();

    db.conn.execute(
        "UPDATE session_history
         SET deleted = 1, deleted_at = ?1, sync_version = sync_version + 1, synced_at = NULL
         WHERE id = ?2",
        params![now, id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn clear_sessions(state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().timestamp_millis();

    db.conn.execute(
        "UPDATE session_history
         SET deleted = 1, deleted_at = ?1, synced_at = NULL
         WHERE deleted = 0",
        [now],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn count_sessions(
    state: State<'_, AppState>,
    filter: Option<SessionHistoryFilter>,
) -> Result<i64, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let filter = filter.unwrap_or_default();

    let mut sql = String::from("SELECT COUNT(*) FROM session_history WHERE deleted = 0");

    if filter.language.is_some() {
        sql.push_str(" AND language = ?");
    }
    if filter.from_language.is_some() {
        sql.push_str(" AND from_language = ?");
    }
    if filter.mode.is_some() {
        sql.push_str(" AND mode = ?");
    }

    let mut stmt = db.conn.prepare(&sql).map_err(|e| e.to_string())?;

    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    if let Some(ref lang) = filter.language {
        params.push(Box::new(lang.clone()));
    }
    if let Some(ref from_lang) = filter.from_language {
        params.push(Box::new(from_lang.clone()));
    }
    if let Some(ref mode) = filter.mode {
        params.push(Box::new(mode.clone()));
    }

    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let count: i64 = stmt.query_row(params_refs.as_slice(), |row| row.get(0))
        .map_err(|e| e.to_string())?;

    Ok(count)
}
