use rusqlite::{Connection, Result, params};
use std::path::Path;

pub struct Database {
    pub conn: Connection,
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
            -- Session history table
            CREATE TABLE IF NOT EXISTS session_history (
                id TEXT PRIMARY KEY,
                mission_json TEXT,
                language TEXT NOT NULL,
                from_language TEXT NOT NULL,
                mode TEXT NOT NULL,
                voice TEXT NOT NULL,
                result_json TEXT NOT NULL,
                completed_at INTEGER NOT NULL,
                -- Sync columns
                sync_version INTEGER NOT NULL DEFAULT 1,
                synced_at INTEGER,
                deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at INTEGER
            );

            -- Indexes for common queries
            CREATE INDEX IF NOT EXISTS idx_session_history_completed_at
                ON session_history(completed_at);
            CREATE INDEX IF NOT EXISTS idx_session_history_language
                ON session_history(language);
            CREATE INDEX IF NOT EXISTS idx_session_history_deleted
                ON session_history(deleted);
            CREATE INDEX IF NOT EXISTS idx_session_history_synced_at
                ON session_history(synced_at);

            -- Sync metadata table for future sync support
            CREATE TABLE IF NOT EXISTS sync_metadata (
                table_name TEXT PRIMARY KEY,
                last_sync_timestamp INTEGER NOT NULL DEFAULT 0,
                cursor TEXT
            );
            "
        )?;
        Ok(())
    }
}
