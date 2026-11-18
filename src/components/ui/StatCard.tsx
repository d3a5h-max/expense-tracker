import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaColor?: "success" | "warning" | "error";
}

export function StatCard({ label, value, delta, deltaColor }: StatCardProps) {
  const colorClass =
    deltaColor === "success" ? "text-success" :
    deltaColor === "warning" ? "text-warning" :
    deltaColor === "error" ? "text-error" :
    "text-text-secondary";

  return (
    <div className="glass-panel p-5">
      <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">{label}</p>
      <div className="text-xl font-mono font-semibold text-text-primary">{value}</div>
      {delta && (
        <p className={`text-xs font-medium ${colorClass} mt-1`}>{delta}</p>
      )}
    </div>
  );
}