# Expense Tracker

A native Windows desktop expense tracker built with **Tauri 2.0** (Rust backend) and **React + Tailwind CSS** (Vite frontend). It's fully **offline-first**, storing all financial data locally in a SQLite database under `%APPDATA%/com.expensetracker.app/expense.db`.

## 🎨 Design System

"Navy Silhouette" theme:
- Deep navy backgrounds (`#070D1E`), glassmorphism cards (`#0E1A38/80`), ice-blue borders (`#1E3563`)
- Frameless window with native-feeling title bar buttons
- Segoe UI / Inter typography for UI, JetBrains Mono for monetary values
- Fluid micro-animations for modals and tooltips

## 🛠️ Features

### Local Storage
- SQLite database in the user’s AppData directory
- No cloud dependencies — works completely offline

### Dashboard & Analytics
- Summary cards: Net Worth, Inflow, Outflow, Savings %
- Category donut chart
- 6-month trend line chart

### Data Management
- Filterable, sortable, paginated data grid
- Multi-select bulk delete
- Quick "Add Transaction" modal with automatic currency formatting

### Desktop Integration
- Native Windows file save dialog for CSV and PDF export
- Frameless window with custom title bar (minimize/maximize/close, drag)
- System tray icon (if extended)

## 🚀 Getting Started

### Prerequisites
- Windows 10/11
- Node.js 18+
- Rust 1.77+

### Installation
1. Clone the repository
   ```bash
   git clone https://github.com/d3a5h-max/expense-tracker.git
   cd expense-tracker
   ```

2. Install frontend dependencies
   ```bash
   npm install
   ```

3. Build and run the Tauri app
   ```bash
   npm run tauri dev
   ```

### Build for Production
   ```bash
   npm run tauri build
   ```
   (Generates `Cargo.toml` with embedded frontend and produces a Windows installer)

## 🔧 Tech Stack

- **Tauri 2.0** — Desktop runtime with Rust backend + JS frontend
- **React 18** — Component-based UI
- **Tailwind CSS + shadcn/ui** — Utility classes + component primitives
- **Recharts** — Financial dashboards (Pie Chart, Line Chart)
- **SQLite** — Local data store via `tauri-plugin-sqlite`
- **Rust** — Core logic, exports, PDF generation
- **Lucide React** — Icon set

## 📧 License

MIT — see `LICENSE` file for details

## 👤 Credits

Thanks to the Tauri team for making desktop app development with web technologies accessible and fast.

## 📝 Future Enhancements (in progress)

- **PDF export with professional financial report layout**
- **Real-time synchronization with cloud backup (optional)**
- **Keyboard shortcuts (Ctrl+N, etc.)**
- **Multi-window support (main + secondary)**
- **Accessibility improvements (screen reader support)**
- **Auto-categorization via AI**

---

**Note:** This project was built as a prototype to demonstrate Tauri capabilities and a modern, accessible desktop expense tracker UI. It's ready for further iteration and feature additions.