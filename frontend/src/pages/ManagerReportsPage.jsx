import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../api/client'
import { MetricCard } from '../components/MetricCard'

const money = (value) => `৳${Number(value).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function ManagerReportsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [sales, setSales] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  async function loadReport() {
    const [analyticsData, salesData] = await Promise.all([apiRequest('/analytics/operations'), apiRequest('/sales')])
    setAnalytics(analyticsData)
    setSales(salesData)
  }

  useEffect(() => {
    loadReport()
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [])

  async function deleteSale(sale) {
    if (!window.confirm(`Delete the ${sale.itemName} sale for ${money(sale.total)}? Revenue, orders, and business health will be recalculated.`)) return
    setDeletingId(sale.id)
    setError('')
    setNotice('')
    try {
      await apiRequest(`/sales/${sale.id}`, { method: 'DELETE' })
      await loadReport()
      setNotice('Sale deleted. Dashboard totals have been updated and an audit record was retained.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredSales = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return sales
    return sales.filter((sale) => `${sale.itemName} ${sale.createdBy}`.toLowerCase().includes(normalized))
  }, [query, sales])

  function exportCsv() {
    const rows = [
      ['Time', 'Item', 'Quantity', 'Unit price', 'Total', 'Operator'],
      ...filteredSales.map((sale) => [sale.createdAt, sale.itemName, sale.quantity, sale.unitPrice, sale.total, sale.createdBy]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `breaking-business-sales-${analytics?.date || 'report'}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <p>Preparing manager reports…</p>

  return (
    <div className="page-stack manager-reports-page">
      <div className="reports-header">
        <div><p className="eyebrow">Manager reports</p><h1>Sales and performance report</h1><p>Review today’s activity, search transactions, and export the data for submission or analysis.</p></div>
        <div className="report-actions"><button type="button" className="secondary" onClick={() => window.print()}>Print</button><button type="button" onClick={exportCsv} disabled={!filteredSales.length}>Export CSV</button></div>
      </div>
      {error && <p className="error-message" role="alert">{error}</p>}
      {notice && <p className="success-message" role="status">{notice}</p>}
      {analytics && <section className="metrics-grid"><MetricCard label="Reported revenue" value={money(analytics.revenue)} context={analytics.date} /><MetricCard label="Reported orders" value={analytics.orderCount} /><MetricCard label="Average order value" value={money(analytics.averageOrderValue)} /><MetricCard label="Expenses" value={money(analytics.expenses)} /></section>}
      <section className="panel report-table-panel">
        <div className="report-table-heading"><div><h2>Transaction report</h2><p>{filteredSales.length} matching record{filteredSales.length === 1 ? '' : 's'}</p></div><label className="report-search">Search report<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Product or operator" /></label></div>
        <div className="table-scroll"><table><thead><tr><th>Time</th><th>Item</th><th>Qty</th><th>Unit price</th><th>Total</th><th>Operator</th><th>Action</th></tr></thead><tbody>{filteredSales.map((sale) => <tr key={sale.id}><td>{new Date(sale.createdAt).toLocaleString()}</td><td>{sale.itemName}</td><td>{sale.quantity}</td><td>{money(sale.unitPrice)}</td><td><strong>{money(sale.total)}</strong></td><td>{sale.createdBy}</td><td><button className="danger table-action" type="button" disabled={deletingId === sale.id} onClick={() => deleteSale(sale)}>{deletingId === sale.id ? 'Deleting…' : 'Delete'}</button></td></tr>)}{filteredSales.length === 0 && <tr><td colSpan="7">No matching sales records.</td></tr>}</tbody></table></div>
      </section>
    </div>
  )
}
