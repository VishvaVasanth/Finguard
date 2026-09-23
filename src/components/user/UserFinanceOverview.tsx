import React from 'react';
import { FinancialAccount, FinancialTransaction } from '../../types.ts';
import { Wallet, TrendingUp, AlertCircle, ArrowDownLeft, ArrowUpRight, DollarSign } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

interface FinanceOverviewProps {
  accounts: FinancialAccount[];
  transactions: FinancialTransaction[];
}

export const UserFinanceOverview: React.FC<FinanceOverviewProps> = ({ accounts, transactions }) => {
  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);
  const totalBudget = accounts.reduce((acc, a) => acc + a.monthly_budget, 0);
  const totalSpent = accounts.reduce((acc, a) => acc + a.monthly_spent, 0);
  const utilization = Math.round((totalSpent / (totalBudget || 1)) * 100);

  // Category breakdown for Pie Chart
  const categoryData = [
    { name: 'Cloud & Tech Infrastructure', value: 45000, color: '#9A9CEA' },
    { name: 'Vendor Supplies & Coffee', value: 32000, color: '#A2B9EE' },
    { name: 'Payroll & Contractors', value: 68000, color: '#A2DCEE' },
    { name: 'Compliance & Audit', value: 25000, color: '#ADEEE2' },
  ];

  // Spending pacing comparison
  const monthlyPacingData = [
    { month: 'Jan', budget: 150000, spent: 142000 },
    { month: 'Feb', budget: 150000, spent: 138000 },
    { month: 'Mar', budget: 160000, spent: 155000 },
    { month: 'Apr', budget: 160000, spent: 149000 },
    { month: 'Current', budget: totalBudget, spent: totalSpent },
  ];

  return (
    <div id="user-finance-overview" className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Available Balance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Available Balance</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#17233C]">
            ₹{totalBalance.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +4.2%
            </span>
            <span>vs previous cycle</span>
          </div>
        </div>

        {/* Monthly Budget Allocation */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly Operating Budget</span>
            <div className="p-2 rounded-xl bg-[#9A9CEA]/15 text-[#9A9CEA]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#17233C]">
            ₹{totalBudget.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500">
            Current Spend: <strong className="text-slate-800">₹{totalSpent.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Real-Time Budget Utilization */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Budget Utilization</span>
            <div className={`p-2 rounded-xl ${utilization > 90 ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'}`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#17233C]">{utilization}%</span>
            <span className="text-xs text-slate-500 font-medium">utilized</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                utilization > 90 ? 'bg-rose-500' : utilization > 75 ? 'bg-amber-400' : 'bg-[#ADEEE2]'
              }`}
              style={{ width: `${Math.min(100, utilization)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Budget vs Spend Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#17233C]">Real-Time Spending Analytics</h3>
              <p className="text-xs text-slate-500">Monthly budget allocation vs actual incurred expenditures (₹ INR)</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-sm bg-slate-300 inline-block" /> Budget
              </span>
              <span className="flex items-center gap-1.5 text-[#17233C] font-semibold">
                <span className="w-3 h-3 rounded-sm bg-[#9A9CEA] inline-block" /> Spent
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyPacingData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="budget" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" fill="#9A9CEA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#17233C]">Category Spending Breakdown</h3>
            <p className="text-xs text-slate-500">Operational cost centers</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-1">
            {categoryData.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </span>
                <span className="font-semibold text-slate-800">
                  ₹{cat.value.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Linked Accounts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Linked Accounts List */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-[#17233C]">Authorized Accounts</h3>
          <div className="space-y-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{acc.account_name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                    {acc.account_number_masked}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">{acc.account_type}</span>
                  <span className="text-sm font-extrabold text-[#17233C]">
                    ₹{acc.balance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#17233C]">Recent Verified Transactions</h3>
              <p className="text-xs text-slate-500">Corporate ledger entries and debits</p>
            </div>
            <span className="text-xs font-semibold text-slate-400 font-mono">Real-time Stream</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/60 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const isDebit = tx.type === 'DEBIT';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-2.5 font-mono text-slate-500">{tx.date}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-900">{tx.description}</td>
                      <td className="px-3 py-2.5 text-slate-600">{tx.category}</td>
                      <td
                        className={`px-3 py-2.5 text-right font-semibold font-mono ${
                          isDebit ? 'text-slate-800' : 'text-emerald-600'
                        }`}
                      >
                        {isDebit ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
