'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, DollarSign, Plus, Trash2, ChevronDown, PiggyBank, ArrowUpCircle, ArrowDownCircle, Link2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns'

type TxType = 'INCOME' | 'EXPENSE'
type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY'

type Transaction = {
  id: string; amount: number; description: string; type: TxType
  date: string; categoryId: string | null
  category: { id: string; name: string; color: string } | null
}

type Budget = {
  id: string; name: string; amount: number; period: BudgetPeriod
  category: { id: string; name: string; color: string } | null
}

type NetWorth = { id: string; amount: number; note: string | null; date: string }
type PlaidItem = { id: string; institutionName: string | null; lastSync: string | null }

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function FinancialsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [netWorth, setNetWorth] = useState<NetWorth[]>([])
  const [plaidItems, setPlaidItems] = useState<PlaidItem[]>([])
  const [loading, setLoading] = useState(true)

  // Add transaction form
  const [txAmount, setTxAmount] = useState('')
  const [txDesc, setTxDesc] = useState('')
  const [txType, setTxType] = useState<TxType>('EXPENSE')
  const [txDate, setTxDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [addingTx, setAddingTx] = useState(false)

  // Net worth form
  const [nwAmount, setNwAmount] = useState('')
  const [nwNote, setNwNote] = useState('')
  const [addingNw, setAddingNw] = useState(false)

  const [activeSection, setActiveSection] = useState<'transactions' | 'budgets' | 'networth'>('transactions')
  const [connectingPlaid, setConnectingPlaid] = useState(false)

  const load = useCallback(async () => {
    const [txRes, budgetRes, nwRes, plaidRes] = await Promise.all([
      fetch('/api/transactions').then(r => r.json()).catch(() => []),
      fetch('/api/budgets').then(r => r.json()).catch(() => []),
      fetch('/api/net-worth').then(r => r.json()).catch(() => []),
      fetch('/api/plaid/items').then(r => r.json()).catch(() => []),
    ])
    setTransactions(txRes)
    setBudgets(budgetRes)
    setNetWorth(nwRes)
    setPlaidItems(plaidRes)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!txAmount || !txDesc) return
    setAddingTx(true)
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(txAmount), description: txDesc, type: txType, date: txDate }),
    })
    if (res.ok) {
      const tx = await res.json()
      setTransactions(prev => [tx, ...prev])
      setTxAmount(''); setTxDesc('')
    }
    setAddingTx(false)
  }

  const deleteTx = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
  }

  const addNetWorth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nwAmount) return
    setAddingNw(true)
    const res = await fetch('/api/net-worth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(nwAmount), note: nwNote || null }),
    })
    if (res.ok) {
      const nw = await res.json()
      setNetWorth(prev => [nw, ...prev])
      setNwAmount(''); setNwNote('')
    }
    setAddingNw(false)
  }

  const connectPlaid = async () => {
    setConnectingPlaid(true)
    try {
      const res = await fetch('/api/plaid/link-token', { method: 'POST' })
      const { link_token } = await res.json()
      // Plaid Link would be opened here; for now redirect to a Plaid sandbox URL
      window.open(`https://cdn.plaid.com/link/v2/stable/link.html?token=${link_token}`, '_blank')
    } catch {
      alert('Plaid connection failed. Make sure your Plaid API keys are configured.')
    }
    setConnectingPlaid(false)
  }

  // Computed stats
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const monthTx = transactions.filter(t => {
    const d = new Date(t.date)
    return d >= monthStart && d <= monthEnd
  })

  const monthIncome = monthTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const monthExpenses = monthTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
  const latestNw = netWorth[0]?.amount ?? 0

  // Chart data: last 6 months spending
  const spendingChart = Array.from({ length: 6 }).map((_, i) => {
    const month = subMonths(now, 5 - i)
    const ms = startOfMonth(month)
    const me = endOfMonth(month)
    const spent = transactions
      .filter(t => t.type === 'EXPENSE' && new Date(t.date) >= ms && new Date(t.date) <= me)
      .reduce((s, t) => s + t.amount, 0)
    return { month: format(month, 'MMM'), amount: Math.round(spent) }
  })

  const nwChart = [...netWorth].reverse().map(n => ({
    date: format(new Date(n.date), 'MMM d'),
    amount: n.amount,
  }))

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Financials</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Budget · Expenses · Net Worth · Plaid</p>
          </div>
        </div>
        <button
          onClick={connectPlaid}
          disabled={connectingPlaid}
          className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
        >
          <Link2 size={13} />
          {plaidItems.length > 0 ? 'Add Bank' : 'Connect Bank'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="This Month Spent" value={fmt(monthExpenses)} sub={format(now, 'MMMM yyyy')} color="text-red-400" />
        <StatCard label="This Month Income" value={fmt(monthIncome)} sub={format(now, 'MMMM yyyy')} color="text-emerald-400" />
        <StatCard label="Net (Month)" value={fmt(monthIncome - monthExpenses)} color={monthIncome - monthExpenses >= 0 ? 'text-emerald-400' : 'text-red-400'} />
        <StatCard label="Net Worth" value={latestNw > 0 ? fmt(latestNw) : '–'} sub="Latest snapshot" color="text-violet-400" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Monthly Spending</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={spendingChart} barSize={28}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [fmt(Number(v)), 'Spent']}
              />
              <Bar dataKey="amount" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Net Worth Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Net Worth Over Time</h3>
          {nwChart.length < 2 ? (
            <div className="h-[180px] flex items-center justify-center text-center">
              <p className="text-sm text-zinc-500">Add snapshots below to track your net worth</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={nwChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [fmt(Number(v)), 'Net Worth']}
                />
                <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        {([
          { key: 'transactions', label: 'Transactions', icon: DollarSign },
          { key: 'budgets', label: 'Budgets', icon: PiggyBank },
          { key: 'networth', label: 'Net Worth', icon: TrendingUp },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === key ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Transactions Section */}
      {activeSection === 'transactions' && (
        <div className="space-y-4">
          <form onSubmit={addTransaction} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex flex-wrap gap-3">
              <input
                value={txDesc}
                onChange={e => setTxDesc(e.target.value)}
                placeholder="Description"
                className="flex-1 min-w-[160px] bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
              <input
                type="number"
                step="0.01"
                value={txAmount}
                onChange={e => setTxAmount(e.target.value)}
                placeholder="Amount"
                className="w-32 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
              <select
                value={txType}
                onChange={e => setTxType(e.target.value as TxType)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-violet-500"
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
              <input
                type="date"
                value={txDate}
                onChange={e => setTxDate(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-violet-500"
              />
              <button
                type="submit"
                disabled={addingTx}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </form>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 border-b border-zinc-800 animate-pulse">
                  <div className="h-4 bg-zinc-800 rounded w-1/2" />
                </div>
              ))
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-zinc-500">No transactions yet. Add one above or connect your bank.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {transactions.slice(0, 50).map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5 group hover:bg-zinc-800/40 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      tx.type === 'INCOME' ? 'bg-emerald-900/40' : 'bg-red-900/40'
                    }`}>
                      {tx.type === 'INCOME'
                        ? <ArrowUpCircle size={16} className="text-emerald-400" />
                        : <ArrowDownCircle size={16} className="text-red-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 font-medium">{tx.description}</p>
                      <p className="text-xs text-zinc-500">
                        {format(new Date(tx.date), 'MMM d, yyyy')}
                        {tx.category && ` · ${tx.category.name}`}
                      </p>
                    </div>
                    <p className={`text-sm font-bold tabular-nums ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{fmt(tx.amount)}
                    </p>
                    <button
                      onClick={() => deleteTx(tx.id)}
                      className="text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-2"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Budgets Section */}
      {activeSection === 'budgets' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {budgets.length === 0 ? (
              <div className="p-8 text-center">
                <PiggyBank size={32} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">No budgets set. Budget management coming soon.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {budgets.map(budget => {
                  const spent = monthTx
                    .filter(t => t.type === 'EXPENSE' && t.categoryId === budget.category?.id)
                    .reduce((s, t) => s + t.amount, 0)
                  const pct = Math.min(100, (spent / budget.amount) * 100)
                  return (
                    <div key={budget.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-zinc-200">{budget.name}</p>
                        <p className="text-sm text-zinc-400 tabular-nums">
                          {fmt(spent)} / {fmt(budget.amount)}
                        </p>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">{pct.toFixed(0)}% used · {budget.period}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Net Worth Section */}
      {activeSection === 'networth' && (
        <div className="space-y-4">
          <form onSubmit={addNetWorth} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex gap-3">
              <input
                type="number"
                step="0.01"
                value={nwAmount}
                onChange={e => setNwAmount(e.target.value)}
                placeholder="Net worth amount (e.g. 45000)"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
              <input
                value={nwNote}
                onChange={e => setNwNote(e.target.value)}
                placeholder="Note (optional)"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
              <button
                type="submit"
                disabled={addingNw}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus size={14} /> Snapshot
              </button>
            </div>
          </form>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {netWorth.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-zinc-500">Add your first net worth snapshot above</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {netWorth.map((nw, i) => {
                  const prev = netWorth[i + 1]
                  const delta = prev ? nw.amount - prev.amount : null
                  return (
                    <div key={nw.id} className="flex items-center gap-4 px-4 py-3.5">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-violet-400 tabular-nums">{fmt(nw.amount)}</p>
                        {nw.note && <p className="text-xs text-zinc-500 mt-0.5">{nw.note}</p>}
                      </div>
                      {delta !== null && (
                        <p className={`text-xs font-semibold tabular-nums ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {delta >= 0 ? '+' : ''}{fmt(delta)}
                        </p>
                      )}
                      <p className="text-xs text-zinc-600">{format(new Date(nw.date), 'MMM d, yyyy')}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
