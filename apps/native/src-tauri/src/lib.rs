mod db;
mod session_history;

use std::sync::Mutex;
use tauri::Manager;

pub struct AppState {
    pub db: Mutex<db::Database>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            std::fs::create_dir_all(&app_data_dir).expect("Failed to create app data dir");

            let db_path = app_data_dir.join("immergo.db");
            let database = db::Database::new(&db_path).expect("Failed to initialize database");

            app.manage(AppState {
                db: Mutex::new(database),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Session history commands
            session_history::save_session,
            session_history::get_all_sessions,
            session_history::get_session,
            session_history::delete_session,
            session_history::clear_sessions,
            session_history::count_sessions,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
