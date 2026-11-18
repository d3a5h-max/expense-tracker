import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { X, Minus, Square, LayoutGrid, Database, Download } from "lucide-react";
import { Dashboard } from "../../pages/Dashboard";
import { Data } from "../../pages/Data";

const appWindow = getCurrentWindow();

export function AppShell() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "data">("dashboard");
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const unlisten = appWindow.onResized(async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleMinimize = () => invoke("minimize_window");
  const handleMaximize = () => invoke("maximize_window");
  const handleClose = () => invoke("close_window");

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-navy-900 border border-navy-500/30">
      {/* Native-feeling Title Bar */}
      <header
        data-tauri-drag-region
        className="flex items-center justify-between h-10 px-4 select-none bg-navy-800/50 border-b border-navy-500/20"
      >
        <div className="flex items-center gap-3 pointer-events-none">
          <div className="w-5 h-5 bg-ice-500 rounded-sm shadow-sm flex items-center justify-center">
            <Database size={12} className="text-navy-900" />
          </div>
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Expense Tracker
          </span>
        </div>

        <div className="flex items-center -mr-4 h-full">
          <button
            onClick={handleMinimize}
            className="w-12 h-full flex items-center justify-center hover:bg-navy-700/50 transition-colors"
          >
            <Minus size={14} className="text-text-secondary" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-12 h-full flex items-center justify-center hover:bg-navy-700/50 transition-colors"
          >
            <Square size={12} className="text-text-secondary" />
          </button>
          <button
            onClick={handleClose}
            className="w-12 h-full flex items-center justify-center hover:bg-red-500/80 group transition-colors"
          >
            <X size={14} className="text-text-secondary group-hover:text-white" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-16 flex flex-col items-center py-6 gap-6 bg-navy-800/30 border-r border-navy-500/10">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`p-3 rounded-xl transition-all duration-300 ${
              activeTab === "dashboard"
                ? "bg-ice-500 text-white shadow-lg shadow-ice-500/20"
                : "text-text-secondary hover:bg-navy-700/50"
            }`}
            title="Dashboard"
          >
            <LayoutGrid size={22} />
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`p-3 rounded-xl transition-all duration-300 ${
              activeTab === "data"
                ? "bg-ice-500 text-white shadow-lg shadow-ice-500/20"
                : "text-text-secondary hover:bg-navy-700/50"
            }`}
            title="Transactions"
          >
            <Database size={22} />
          </button>
          <div className="mt-auto pb-4">
            <button className="p-3 rounded-xl text-text-secondary hover:bg-navy-700/50 transition-all">
              <Download size={20} />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(30,53,99,0.15),transparent_50%)] pointer-events-none" />
          <div className="p-8 max-w-7xl mx-auto">
            {activeTab === "dashboard" ? <Dashboard /> : <Data />}
          </div>
        </main>
      </div>
    </div>
  );
}