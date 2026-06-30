import { useState, useEffect } from 'react'
import {
  getFinanceProviderHealth,
  listFinanceProviders,
  listBudgets,
  listExpenses,
  listInvoices,
  listPayments,
  listAssets,
  listVendors,
  getFinanceStats,
  listFinanceSuggestions,
  dismissFinanceSuggestion,
  type ProviderHealth,
  type Budget,
  type Expense,
  type Invoice,
  type Payment,
  type Asset,
  type Vendor,
  type FinanceStats,
  type FinanceSuggestion,
} from '../../lib/financeService'

export default function FinanceDashboard() {
  const [providers, setProviders] = useState<Array<{ id: string; name: string; type: string }>>([])
  const [health, setHealth] = useState<ProviderHealth[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [stats, setStats] = useState<FinanceStats | null>(null)
  const [suggestions, setSuggestions] = useState<FinanceSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissing, setDismissing] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [p, h, b, e, inv, pay, a, v, s, sg] = await Promise.all([
        listFinanceProviders(),
        getFinanceProviderHealth(),
        listBudgets(),
        listExpenses(),
        listInvoices(),
        listPayments(),
        listAssets(),
        listVendors(),
        getFinanceStats(),
        listFinanceSuggestions(),
      ])
      setProviders(p)
      setHealth(h)
      setBudgets(b)
      setExpenses(e)
      setInvoices(inv)
      setPayments(pay)
      setAssets(a)
      setVendors(v)
      setStats(s)
      setSuggestions(sg)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function handleDismiss(suggestionId: string) {
    setDismissing(suggestionId)
    try {
      await dismissFinanceSuggestion(suggestionId)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dismiss failed')
    } finally {
      setDismissing(null)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Finance Developer Dashboard</h1>
        <button
          onClick={() => void load()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          Refresh
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Stat label="Total Income" value={stats.totalIncome} />
              <Stat label="Total Expenses" value={stats.totalExpenses} />
              <Stat label="Cash Flow" value={stats.cashFlow} />
              <Stat label="Budget Utilization" value={`${Math.round(stats.budgetUtilizationRate * 100)}%`} />
              <Stat label="Pending Invoices" value={stats.pendingInvoices} />
              <Stat label="Overdue Invoices" value={stats.overdueInvoices} />
              <Stat label="Pending Approvals" value={stats.pendingApprovals} />
              <Stat label="Assets" value={stats.assetsCount} />
              <Stat label="Vendors" value={stats.vendorsCount} />
              <Stat label="Pending Suggestions" value={suggestions.length} />
            </div>
          )}

          <h2 className="text-lg font-semibold mb-3">Registered Finance Data Providers</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border">Provider</th>
                  <th className="text-left p-2 border">Type</th>
                  <th className="text-left p-2 border">Status</th>
                  <th className="text-left p-2 border">Last Checked</th>
                </tr>
              </thead>
              <tbody>
                {providers.length === 0 ? (
                  <tr><td colSpan={4} className="p-2 border text-gray-400">No providers registered yet</td></tr>
                ) : providers.map((p) => {
                  const h = health.find((x) => x.providerId === p.id)
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-2 border">{p.name}</td>
                      <td className="p-2 border capitalize">{p.type.replace('_', ' ')}</td>
                      <td className="p-2 border">{h?.status ?? 'unknown'}</td>
                      <td className="p-2 border">{h?.lastCheckedAt ? new Date(h.lastCheckedAt).toLocaleString() : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-semibold mb-3">Budgets ({budgets.length})</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border">Name</th>
                  <th className="text-left p-2 border">Period</th>
                  <th className="text-left p-2 border">Status</th>
                  <th className="text-left p-2 border">Spent / Amount</th>
                </tr>
              </thead>
              <tbody>
                {budgets.length === 0 ? (
                  <tr><td colSpan={4} className="p-2 border text-gray-400">No budgets yet</td></tr>
                ) : budgets.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{b.name}</td>
                    <td className="p-2 border capitalize">{b.period}</td>
                    <td className="p-2 border capitalize">{b.status.replace('_', ' ')}</td>
                    <td className="p-2 border">{b.spent} / {b.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-semibold mb-3">Expenses ({expenses.length})</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border">Description</th>
                  <th className="text-left p-2 border">Category</th>
                  <th className="text-left p-2 border">Amount</th>
                  <th className="text-left p-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan={4} className="p-2 border text-gray-400">No expenses yet</td></tr>
                ) : expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{e.description}</td>
                    <td className="p-2 border capitalize">{e.category.replace('_', ' ')}</td>
                    <td className="p-2 border">{e.currency} {e.amount}</td>
                    <td className="p-2 border capitalize">{e.approvalStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-3">Invoices ({invoices.length})</h3>
              {invoices.length === 0 ? (
                <div className="text-gray-400 text-sm">No invoices yet</div>
              ) : invoices.map((i) => (
                <div key={i.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span className="text-gray-600">{i.invoiceNumber}</span>
                  <span className="font-medium capitalize">{i.status}</span>
                </div>
              ))}
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-3">Payments ({payments.length})</h3>
              {payments.length === 0 ? (
                <div className="text-gray-400 text-sm">No payments yet</div>
              ) : payments.map((p) => (
                <div key={p.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span className="text-gray-600">{p.currency} {p.amount}</span>
                  <span className="font-medium capitalize">{p.status}</span>
                </div>
              ))}
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-3">Assets ({assets.length})</h3>
              {assets.length === 0 ? (
                <div className="text-gray-400 text-sm">No assets yet</div>
              ) : assets.map((a) => (
                <div key={a.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span className="text-gray-600">{a.name}</span>
                  <span className="font-medium capitalize">{a.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-3">Vendors ({vendors.length})</h3>
              {vendors.length === 0 ? (
                <div className="text-gray-400 text-sm">No vendors yet</div>
              ) : vendors.map((v) => (
                <div key={v.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span className="text-gray-600">{v.name}</span>
                  <span className="font-medium capitalize">{v.status}</span>
                </div>
              ))}
            </div>
          </div>

          {stats && (
            <div className="bg-white border rounded-lg p-4 mb-8">
              <h3 className="font-medium mb-3">Expenses by Category</h3>
              {Object.entries(stats.byExpenseCategory).length === 0 ? (
                <div className="text-gray-400 text-sm">No category data yet</div>
              ) : Object.entries(stats.byExpenseCategory).map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs py-1 text-gray-500">
                  <span className="capitalize">{k.replace('_', ' ')}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          )}

          <h2 className="text-lg font-semibold mb-3">Pending Suggestions — Require Approval ({suggestions.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border">Type</th>
                  <th className="text-left p-2 border">Title</th>
                  <th className="text-left p-2 border">Description</th>
                  <th className="text-left p-2 border">Created</th>
                  <th className="text-left p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.length === 0 ? (
                  <tr><td colSpan={5} className="p-2 border text-gray-400">No pending suggestions</td></tr>
                ) : suggestions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-2 border capitalize">{s.type.replace(/_/g, ' ')}</td>
                    <td className="p-2 border">{s.title}</td>
                    <td className="p-2 border truncate max-w-xs">{s.description}</td>
                    <td className="p-2 border">{new Date(s.createdAt).toLocaleString()}</td>
                    <td className="p-2 border">
                      <button
                        onClick={() => void handleDismiss(s.id)}
                        disabled={dismissing === s.id}
                        className="text-blue-600 hover:underline disabled:opacity-50"
                      >
                        {dismissing === s.id ? 'Dismissing...' : 'Dismiss'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-xl font-bold text-blue-600">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
