'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { FinancialAnalytics } from '@/lib/actions/finances';
import { formatNumber, formatCurrency } from '@/lib/utils/format';
import { TrendingUp, TrendingDown, Layers, PieChart as PieIcon, BarChart3 } from 'lucide-react';

interface FinancialChartsProps {
  analytics: FinancialAnalytics;
}

export function FinancialChartsClient({ analytics }: FinancialChartsProps) {
  const {
    totalInflow,
    totalOutflow,
    netCashflow,
    projectSpendTotal,
    categoryBreakdown,
    cashflowComparison,
  } = analytics;

  return (
    <div className="space-y-6">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Cash Flow */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-medium text-slate-400">Net Cashflow</span>
            {netCashflow >= 0 ? (
              <TrendingUp size={16} className="text-emerald-400" />
            ) : (
              <TrendingDown size={16} className="text-rose-400" />
            )}
          </div>
          <p
            suppressHydrationWarning
            className={`text-2xl font-bold font-mono ${
              netCashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {netCashflow >= 0 ? `+₹${formatNumber(netCashflow)}` : `-₹${formatNumber(Math.abs(netCashflow))}`}
          </p>
          <span className="text-[10px] text-slate-500">Inflows minus Outflows</span>
        </div>

        {/* Total Inflow */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-medium text-slate-400">Total Inflow</span>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <p suppressHydrationWarning className="text-2xl font-bold font-mono text-emerald-400">
            +₹${formatNumber(totalInflow)}
          </p>
          <span className="text-[10px] text-slate-500">Revenue & Deposits</span>
        </div>

        {/* Total Outflow */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-medium text-slate-400">Total Outflow</span>
            <TrendingDown size={16} className="text-rose-400" />
          </div>
          <p suppressHydrationWarning className="text-2xl font-bold font-mono text-rose-400">
            -₹${formatNumber(totalOutflow)}
          </p>
          <span className="text-[10px] text-slate-500">Living & Project expenses</span>
        </div>

        {/* Project Tagged Spend */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-medium text-slate-400">Project Burn</span>
            <Layers size={16} className="text-indigo-400" />
          </div>
          <p suppressHydrationWarning className="text-2xl font-bold font-mono text-indigo-400">
            ₹{formatNumber(projectSpendTotal)}
          </p>
          <span className="text-[10px] text-slate-500">Directly tagged to projects</span>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Expense Breakdown (Donut Chart) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <PieIcon size={16} className="text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Expense Breakdown by Category</h3>
            </div>
            <span className="text-xs text-slate-400">{categoryBreakdown.length} Categories</span>
          </div>

          <div className="h-80 w-full pt-4">
            {categoryBreakdown.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No expense data recorded.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Amount']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category Legend */}
          <div className="mt-2 flex flex-wrap gap-3 pt-3 border-t border-slate-800/60">
            {categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span>{cat.name}</span>
                <span suppressHydrationWarning className="font-mono text-slate-300 font-medium">
                  (₹{formatCurrency(cat.value)})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Inflow vs Outflow Cash Flow Comparison (Bar Chart) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Cash Flow Comparison</h3>
            </div>
            <span className="text-xs text-slate-400">Monthly Net</span>
          </div>

          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs text-slate-400">
            <span>Capital Efficiency Ratio</span>
            <span className="font-mono text-slate-200">
              {totalInflow > 0 ? `${Math.round((totalOutflow / totalInflow) * 100)}% burn of inflows` : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
