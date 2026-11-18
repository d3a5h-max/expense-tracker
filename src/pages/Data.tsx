import React, { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, Search, Trash2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "../components/ui/GlassCard";
import { StatCard } from "../components/ui/StatCard";
import { Modal } from "../components/ui/Modal";

interface Transaction {
  id: string;
  amount: string;
  category: string;
  type_: string;
  date: string;
  note: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

const ITEMS_PER_PAGE = 10;

export function Data() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState("");

  // Form state
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formType, setFormType] = useState("expense");
  const [formDate, setFormDate] = useState("");
  const [formNote, setFormNote] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [txs, cats] = await Promise.all([
          invoke<Transaction[]>("get_transactions"),
          invoke<Category[]>("get_categories"),
        ]);
        if (mounted) {
          setTransactions(txs);
          setCategories(cats);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setFormDate(today);
  }, []);

  // Filtered & paginated data
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.note.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
      const matchesType = typeFilter === "all" || t.type_ === typeFilter;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [transactions, searchTerm, categoryFilter, typeFilter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginated.map((t) => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedIds.size} selected transaction(s)?`)) return;
    try {
      for (const id of selectedIds) {
        await invoke("delete_transaction", { id });
      }
      setSelectedIds(new Set());
      await refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to delete transactions");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await invoke("delete_transaction", { id });
      await refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to delete transaction");
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const txs = await invoke<Transaction[]>("get_transactions");
      setTransactions(txs);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const amountNum = parseFloat(formAmount.replace(/[$,]/g, ""));
    if (!amountNum || amountNum <= 0) {
      setFormError("Enter a valid amount");
      return;
    }
    try {
      await invoke("add_transaction", {
        transaction: {
          id: "",
          amount: amountNum.toFixed(2),
          category: formCategory,
          type_: formType,
          date: formDate,
          note: formNote,
          created_at: "",
        },
      });
      setOpenModal(false);
      setFormAmount("");
      setFormCategory("");
      setFormNote("");
      setFormType("expense");
      setFormDate(new Date().toISOString().split("T")[0]);
      await refresh();
    } catch (e) {
      console.error(e);
      setFormError("Failed to add transaction");
    }
  };

  const formatCurrency = (val: string) => {
    return `$${parseFloat(val).toFixed(2)}`;
  };

  const typeBadge = (type: string) =>
    type === "income"
      ? "bg-success/10 text-success border-success/20"
      : "bg-error/10 text-error border-error/20";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Transactions</h2>
          <p className="text-xs text-text-secondary mt-1">Filter, sort, and manage your transactions</p>
        </div>
        <button
          onClick={() => setOpenModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-ice-500 hover:bg-ice-400 text-white rounded-md text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Transactions" value={transactions.length} />
        <StatCard
          label="Total Amount"
          value={`$${transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)}`}
        />
        <StatCard label="Selected" value={selectedIds.size} />
      </div>

      {/* Filters & Controls */}
      <div className="glass-panel p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search category or note…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-navy-800/50 border border-navy-500 rounded-md text-sm text-text-primary focus:border-ice-500 outline-none transition-colors"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full pl-3 py-2 bg-navy-800/50 border border-navy-500 rounded-md text-sm text-text-primary focus:border-ice-500 outline-none transition-colors"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full pl-3 py-2 bg-navy-800/50 border border-navy-500 rounded-md text-sm text-text-primary focus:border-ice-500 outline-none transition-colors"
        >
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <div className="flex items-center gap-3 justify-end">
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-3 py-2 bg-error/10 text-error border border-error/20 rounded-md hover:bg-error/20 transition-colors text-sm"
            >
              <Trash2 size={16} />
              Delete Selected ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Data Grid */}
      <GlassCard className="p-4 overflow-x-auto">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-navy-500/30 text-xs font-medium text-text-secondary uppercase">
              <th className="w-8 px-3 py-3" />
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3 text-center">Type</th>
              <th className="px-3 py-3 text-right">Amount</th>
              <th className="px-3 py-3">Note</th>
              <th className="w-16 px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-500/20">
            {paginated.map((t) => {
              const isSelected = selectedIds.has(t.id);
              return (
                <tr
                  key={t.id}
                  className={`group hover:bg-navy-700/20 transition-colors ${isSelected ? "bg-navy-600/30" : ""}`}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelect(t.id)}
                      className="w-4 h-4 rounded text-ice-500 bg-navy-800 border-navy-500 focus:ring-ice-500"
                    />
                  </td>
                  <td className="px-3 py-3 text-text-primary">{t.date}</td>
                  <td className="px-3 py-3 text-text-secondary">{t.category}</td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${typeBadge(t.type_)}`}
                    >
                      {t.type_ === "income" ? "+" : "-"} {t.type_}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-monospace text-text-primary">
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="px-3 py-3 text-text-secondary text-truncate max-w-xs">{t.note || "—"}</td>
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-2 text-text-secondary hover:text-error transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-text-secondary">
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </GlassCard>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="text-xs text-text-secondary">
          Showing {filtered.length > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0}-{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 rounded bg-navy-700 text-text-primary hover:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-text-primary">{page}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 rounded bg-navy-700 text-text-primary hover:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <Modal isOpen={openModal} onClose={() => setOpenModal(false)} title={editingId ? "Edit Transaction" : "Add Transaction"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary">Amount</label>
              <input
                type="text"
                value={formAmount}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.]/g, "");
                  setFormAmount(v);
                }}
                placeholder="0.00"
                className="w-full pl-3 py-2 bg-navy-800/50 border border-navy-500 rounded-md text-sm text-text-primary focus:border-ice-500 outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary">Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full pl-3 py-2 bg-navy-800/50 border border-navy-500 rounded-md text-sm text-text-primary focus:border-ice-500 outline-none transition-colors"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full pl-3 py-2 bg-navy-800/50 border border-navy-500 rounded-md text-sm text-text-primary focus:border-ice-500 outline-none transition-colors"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full pl-3 py-2 bg-navy-800/50 border border-navy-500 rounded-md text-sm text-text-primary focus:border-ice-500 outline-none transition-colors"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary">Note</label>
            <input
              type="text"
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder="e.g. Groceries, Freelance project…"
              className="w-full pl-3 py-2 bg-navy-800/50 border border-navy-500 rounded-md text-sm text-text-primary focus:border-ice-500 outline-none transition-colors"
            />
          </div>
          {formError && (
            <p className="text-xs text-error">{formError}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpenModal(false)}
              className="px-4 py-2 rounded text-sm text-text-secondary hover:bg-navy-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-ice-500 text-white text-sm font-medium hover:bg-ice-400 transition-colors"
            >
              Save Transaction
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}