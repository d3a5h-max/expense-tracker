//! Expense Tracker — Tauri 2.0 backend.
//!
//! Provides a SQLite-backed, offline-first local store plus native commands
//! for CSV/PDF export and window chrome control.

use tauri::{Emitter, Manager, WindowEvent};

mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::init_db,
            commands::get_categories,
            commands::add_category,
            commands::update_category,
            commands::delete_category,
            commands::add_transaction,
            commands::get_transactions,
            commands::get_transaction,
            commands::update_transaction,
            commands::delete_transaction,
            commands::get_summary,
            commands::get_category_breakdown,
            commands::get_monthly_trend,
            commands::export_transactions_to_csv,
            commands::export_transactions_to_json,
            commands::minimize_window,
            commands::maximize_window,
            commands::close_window,
            commands::cleanup_resources,
        ])
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
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = commands::init_db(handle).await {
                    eprintln!("Failed to initialize database: {}", e);
                }
            });

            Ok(())
        });

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
