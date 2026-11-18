import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { invoke } from "@tauri-apps/api/core";
import { GlassCard } from "../components/ui/GlassCard";
import { StatCard } from "../components/ui/StatCard";

interface Transaction {
  id: string;
  amount: string;
  category: string;
  type_: string;
  date: string;
  note: string;
  created_at: string;
}

interface Summary {
  total_income: number;
  total_expense: number;
  net_amount: number;
  transaction_count: number;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
  net: number;
}

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e"];

export function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [trend, setTrend] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [s, b, t] = await Promise.all([
          invoke<Summary>("get_summary"),
          invoke<CategoryBreakdown[]>("get_category_breakdown"),
          invoke<MonthlyTrend[]>("get_monthly_trend"),
        ]);
        if (mounted) {
          setSummary(s);
          setBreakdown(b);
          setTrend(t);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-navy-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-text-secondary text-sm">Loading analytics…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Dashboard</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Net Worth" value={`$${summary?.net_amount?.toFixed(2) ?? "0.00"}`} />
        <StatCard label="Inflow" value={`$${summary?.total_income?.toFixed(2) ?? "0.00"}`} delta="+" deltaColor="success" />
        <StatCard label="Outflow" value={`$${summary?.total_expense?.toFixed(2) ?? "0.00"}`} delta="+" deltaColor="error" />
        <StatCard label="Savings %" value={summary ? ((summary.net_amount / (summary.total_income || 1)) * 100).toFixed(1) : "0"} delta="%" deltaColor="warning" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-4 flex flex-col min-h-[320px]">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Spending by Category</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col min-h-[320px]">
          <h3 className="text-sm font-medium text-text-secondary mb-4">6-Month Trend</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,53,99,0.2)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}