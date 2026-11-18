// API wrapper — Tauri command bindings for the SQLite-backed expense tracker.
// All calls go through @tauri-apps/api/core invoke() to the Rust backend.

import { invoke } from "@tauri-apps/api/core";

export interface Transaction {
  id: string;
  amount: string;
  category: string;
  type_: string;
  date: string;
  note: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface TransactionSummary {
  total_income: number;
  total_expense: number;
  net_amount: number;
  transaction_count: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export async function initDb(): Promise<string> {
  return invoke("init_db", {});
}

export async function getCategories(): Promise<Category[]> {
  return invoke("get_categories", {});
}

export async function addCategory(name: string): Promise<Category> {
  return invoke("add_category", { name });
}

export async function updateCategory(id: string, name: string): Promise<string> {
  return invoke("update_category", { id, name });
}

export async function deleteCategory(id: string): Promise<string> {
  return invoke("delete_category", { id });
}

export async function addTransaction(transaction: Transaction): Promise<Transaction> {
  return invoke("add_transaction", { transaction });
}

export async function getTransactions(): Promise<Transaction[]> {
  return invoke("get_transactions", {});
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  return invoke("get_transaction", { id });
}

export async function updateTransaction(transaction: Transaction): Promise<Transaction> {
  return invoke("update_transaction", { transaction });
}

export async function deleteTransaction(id: string): Promise<string> {
  return invoke("delete_transaction", { id });
}

export async function getSummary(): Promise<TransactionSummary> {
  return invoke("get_summary", {});
}

export async function getCategoryBreakdown(): Promise<CategoryBreakdown[]> {
  return invoke("get_category_breakdown", {});
}

export async function getMonthlyTrend(): Promise<MonthlyTrend[]> {
  return invoke("get_monthly_trend", {});
}

export async function exportTransactionsToCsv(): Promise<string> {
  return invoke("export_transactions_to_csv", {});
}

export async function exportTransactionsToJson(): Promise<string> {
  return invoke("export_transactions_to_json", {});
}

export async function minimizeWindow(): Promise<void> {
  return invoke("minimize_window", {});
}

export async function maximizeWindow(): Promise<void> {
  return invoke("maximize_window", {});
}

export async function closeWindow(): Promise<void> {
  return invoke("close_window", {});
}
