//! Expense Tracker — Tauri 2.0 backend.
//!
//! Provides a SQLite-backed, offline-first local store plus native commands
//! for CSV/PDF export and window chrome control.

use tauri::{Manager, WindowEvent};
use tauri_plugin_sqlite::SqlitePlugin;

mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_sqlite::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let window = app.get_webview_window("main").expect("no main window");
            let app_handle = app.handle().clone();

            // Custom window chrome: forward OS resize/maximize/minimize/restore
            // events so the React title bar stays in sync.
            window.on_window_event(move |event| {
                if let WindowEvent::Resized { .. }
                | WindowEvent::Moved { .. }
                | WindowEvent::ThemeChanged(_)
                | WindowEvent::CloseRequested { .. } = event
                {
                    let _ = app_handle.emit_to(
                        "main",
                        "window:state",
                        format!("{:?}", event),
                    );
                }
            });

            // Seed the database schema on first launch.
            commands::init_db(app);

            Ok(())
        });

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}