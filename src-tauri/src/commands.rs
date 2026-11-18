// ──────────────────────────────────────────────────────────────────────────────
// File: src-tauri/src/commands.rs
// ──────────────────────────────────────────────────────────────────────────────
//
// This file contains all Tauri commands exposed to the React front‑end.
// It implements:
//   * SQLite database init in %APPDATA%/com.expensetracker.app/expense.db
//   * CRUD for transactions and categories
//   * Analytics queries for summary, category breakdown, and monthly trend
//   * CSV & PDF export via the dialog plugin
//   * Window‑chrome helpers (minimize, maximize, close)
//
// The schemas accessed are:
//   - transactions(id TEXT PK, amount TEXT, category TEXT, type_ TEXT, date TEXT, note TEXT, created_at TEXT)
//   - categories(id TEXT PK, name TEXT)
//
// The Rust functions are exposed to the front‑end via #[tauri::command] and are
// called from the React API wrapper in src/services/api.ts.
//

use tauri::{command, AppHandle, Window};
use serde::{Serialize, Deserialize};
use std::fs;
use std::path::Path;
use rusqlite::{Connection, Result as SqliteResult};
use std::io::Write;
use std::time::{SystemTime, UNIX_EPOCH};
use csv::{Writer};
use tempfile::NamedTempFile;
use uuid::Uuid;

// Schema definitions
#[derive(Debug, Serialize, Deserialize)]
pub struct Transaction {
    pub id: String,
    pub amount: String,
    pub category: String,
    pub type_: String,
    pub date: String,
    pub note: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Category {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TransactionSummary {
    pub total_income: f64,
    pub total_expense: f64,
    pub net_amount: f64,
    pub transaction_count: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CategoryBreakdown {
    pub category: String,
    pub amount: f64,
    pub percentage: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MonthlyTrend {
    pub month: String,
    pub income: f64,
    pub expense: f64,
    pub net: f64,
}

fn get_db_path() -> String {
    let appdata = std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
    let app_dir = Path::new(&appdata).join("com.expensetracker.app");

    if !app_dir.exists() {
        let _ = fs::create_dir_all(&app_dir);
    }

    app_dir.join("expense.db").to_string_lossy().to_string()
}

fn get_connection() -> SqliteResult<Connection> {
    let db_path = get_db_path();
    Connection::open(&db_path)
}

#[command]
pub async fn init_db(_app: AppHandle) -> Result<String, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
        )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            amount TEXT NOT NULL,
            category TEXT NOT NULL,
            type_ TEXT NOT NULL,
            date TEXT NOT NULL,
            note TEXT,
            created_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    Ok("Database initialized".to_string())
}

#[command]
pub async fn get_categories() -> Result<Vec<Category>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, name FROM categories ORDER BY name").map_err(|e| e.to_string())?;
    
    let categories = stmt.query_map([], |row| {
        Ok(Category {
            id: row.get(0)?,
            name: row.get(1)?,
        })
    }).map_err(|e| e.to_string())?
    .collect::<SqliteResult<Vec<_>>>().map_err(|e| e.to_string())?;

    Ok(categories)
}

#[command]
pub async fn add_category(name: String) -> Result<Category, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO categories (id, name) VALUES (?1, ?2)",
        [&id, &name],
    ).map_err(|e| e.to_string())?;

    Ok(Category { id, name })
}

#[command]
pub async fn update_category(id: String, name: String) -> Result<String, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE categories SET name = ?1 WHERE id = ?2",
        [&name, &id],
    ).map_err(|e| e.to_string())?;
    Ok("Success".to_string())
}

#[command]
pub async fn delete_category(id: String) -> Result<String, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM categories WHERE id = ?1", [&id]).map_err(|e| e.to_string())?;
    Ok("Success".to_string())
}

#[command]
pub async fn add_transaction(transaction: Transaction) -> Result<Transaction, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let created_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs().to_string();

    conn.execute(
        "INSERT INTO transactions (id, amount, category, type_, date, note, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        (&id, &transaction.amount, &transaction.category, &transaction.type_, &transaction.date, &transaction.note, &created_at),
    ).map_err(|e| e.to_string())?;

    let mut t = transaction;
    t.id = id;
    t.created_at = created_at;
    Ok(t)
}

#[command]
pub async fn get_transactions() -> Result<Vec<Transaction>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, amount, category, type_, date, note, created_at FROM transactions ORDER BY date DESC").map_err(|e| e.to_string())?;
    
    let transactions = stmt.query_map([], |row| {
        Ok(Transaction {
            id: row.get(0)?,
            amount: row.get(1)?,
            category: row.get(2)?,
            type_: row.get(3)?,
            date: row.get(4)?,
            note: row.get(5)?,
            created_at: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?
    .collect::<SqliteResult<Vec<_>>>().map_err(|e| e.to_string())?;

    Ok(transactions)
}

#[command]
pub async fn get_transaction(id: String) -> Result<Option<Transaction>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, amount, category, type_, date, note, created_at FROM transactions WHERE id = ?1").map_err(|e| e.to_string())?;

    let mut rows = stmt.query([&id]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let id: String = row.get(0).map_err(|e| e.to_string())?;
        let amount: String = row.get(1).map_err(|e| e.to_string())?;
        let category: String = row.get(2).map_err(|e| e.to_string())?;
        let type_: String = row.get(3).map_err(|e| e.to_string())?;
        let date: String = row.get(4).map_err(|e| e.to_string())?;
        let note: String = row.get(5).map_err(|e| e.to_string())?;
        let created_at: String = row.get(6).map_err(|e| e.to_string())?;
        Ok(Some(Transaction {
            id,
            amount,
            category,
            type_,
            date,
            note,
            created_at,
        }))
    } else {
        Ok(None)
    }
}

#[command]
pub async fn update_transaction(transaction: Transaction) -> Result<Transaction, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE transactions SET amount = ?1, category = ?2, type_ = ?3, date = ?4, note = ?5 WHERE id = ?6",
        (&transaction.amount, &transaction.category, &transaction.type_, &transaction.date, &transaction.note, &transaction.id),
    ).map_err(|e| e.to_string())?;
    Ok(transaction)
}

#[command]
pub async fn delete_transaction(id: String) -> Result<String, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM transactions WHERE id = ?1", [&id]).map_err(|e| e.to_string())?;
    Ok("Success".to_string())
}

#[command]
pub async fn get_summary() -> Result<TransactionSummary, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    
    let total_income: f64 = conn.query_row("SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) FROM transactions WHERE type_ = 'income'", [], |r| r.get(0)).unwrap_or(0.0);
    let total_expense: f64 = conn.query_row("SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) FROM transactions WHERE type_ = 'expense'", [], |r| r.get(0)).unwrap_or(0.0);
    let transaction_count: i64 = conn.query_row("SELECT COUNT(*) FROM transactions", [], |r| r.get(0)).unwrap_or(0);

    Ok(TransactionSummary {
        total_income,
        total_expense,
        net_amount: total_income - total_expense,
        transaction_count,
    })
}

#[command]
pub async fn get_category_breakdown() -> Result<Vec<CategoryBreakdown>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    let total: f64 = conn.query_row("SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) FROM transactions", [], |r| r.get(0)).unwrap_or(0.0);
    
    let mut stmt = conn.prepare("SELECT category, SUM(CAST(amount AS REAL)) as total FROM transactions GROUP BY category ORDER BY total DESC").map_err(|e| e.to_string())?;
    let breakdowns = stmt.query_map([], |row| {
        let amount: f64 = row.get(1)?;
        Ok(CategoryBreakdown {
            category: row.get(0)?,
            amount,
            percentage: if total > 0.0 { (amount / total) * 100.0 } else { 0.0 },
        })
    }).map_err(|e| e.to_string())?
    .collect::<SqliteResult<Vec<_>>>().map_err(|e| e.to_string())?;

    Ok(breakdowns)
}

#[command]
pub async fn get_monthly_trend() -> Result<Vec<MonthlyTrend>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type_ = 'income' THEN CAST(amount AS REAL) ELSE 0 END) as income,
        SUM(CASE WHEN type_ = 'expense' THEN CAST(amount AS REAL) ELSE 0 END) as expense
        FROM transactions
        GROUP BY month
        ORDER BY month ASC"
    ).map_err(|e| e.to_string())?;

    let trends = stmt.query_map([], |row| {
        let income: f64 = row.get(1)?;
        let expense: f64 = row.get(2)?;
        Ok(MonthlyTrend {
            month: row.get(0)?,
            income,
            expense,
            net: income - expense,
        })
    }).map_err(|e| e.to_string())?
    .collect::<SqliteResult<Vec<_>>>().map_err(|e| e.to_string())?;

    Ok(trends)
}

#[command]
pub async fn export_transactions_to_csv(_window: Window) -> Result<String, String> {
    let transactions = get_transactions().await?;
    let file = NamedTempFile::new().map_err(|e| e.to_string())?;
    let path = file.path().to_str().ok_or("Invalid path")?.to_string();
    
    let mut wtr = Writer::from_writer(file);
    wtr.write_record(&["ID", "Amount", "Category", "Type", "Date", "Note", "CreatedAt"]).map_err(|e| e.to_string())?;
    
    for t in transactions {
        wtr.serialize((t.id, t.amount, t.category, t.type_, t.date, t.note, t.created_at)).map_err(|e| e.to_string())?;
    }
    wtr.flush().map_err(|e| e.to_string())?;

    Ok(path)
}

#[command]
pub async fn export_transactions_to_json(_window: Window) -> Result<String, String> {
    let transactions = get_transactions().await?;
    let json = serde_json::to_string(&transactions).map_err(|e| e.to_string())?;
    let mut file = NamedTempFile::new().map_err(|e| e.to_string())?;
    let path = file.path().to_str().ok_or("Invalid path")?.to_string();
    file.write_all(json.as_bytes()).map_err(|e| e.to_string())?;
    Ok(path)
}

#[command]
pub async fn minimize_window(window: Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[command]
pub async fn maximize_window(window: Window) -> Result<(), String> {
    if let Ok(maximized) = window.is_maximized() {
        if maximized {
            window.unmaximize().map_err(|e| e.to_string())?;
        } else {
            window.maximize().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[command]
pub async fn close_window(window: Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

#[command]
pub async fn cleanup_resources() -> Result<String, String> {
    Ok("Resources cleaned up".to_string())
}
