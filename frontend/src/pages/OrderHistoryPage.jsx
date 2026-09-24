import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../api/client'

const money = (value) => `৳${Number(value).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function OrderHistoryPage() {
  const [sales, setSales] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [deletingToday, setDeletingToday] = useState(false)

  const load = useCallback(async () => {
    try { setSales(await apiRequest('/sales')); setError('') }
    catch (requestError) { setError(requestError.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const visibleSales = useMemo(() => {
    const search = query.trim().toLowerCase()
    return search ? sales.filter((sale) => `${sale.itemName} ${sale.createdBy}`.toLowerCase().includes(search)) : sales
  }, [query, sales])

  async function deleteSale(sale) {
    if (!window.confirm(`Delete ${sale.quantity} × ${sale.itemName} for ${money(sale.total)}? Its stock will be returned.`)) return
    setDeletingId(sale.id); setError(''); setNotice('')
    try {
      await apiRequest(`/sales/${sale.id}`, { method: 'DELETE' })
      await load()
      window.dispatchEvent(new Event('financial-platform-sale-updated'))
      window.dispatchEvent(new Event('financial-platform-stock-updated'))
      setNotice('Sale deleted, totals recalculated, and the sold quantity returned to stock.')
    } catch (requestError) { setError(requestError.message) }
    finally { setDeletingId(null) }
  }

  async function deleteTodaysSales() {
    const confirmation = window.prompt("Delete every order recorded today? All quantities will be returned to stock. Type DELETE to continue.")
    if (confirmation !== 'DELETE') return
    setDeletingToday(true); setError(''); setNotice('')
    try {
      const result = await apiRequest('/sales/today', { method: 'DELETE' })
      await load()
      window.dispatchEvent(new Event('financial-platform-sale-updated'))
      window.dispatchEvent(new Event('financial-platform-stock-updated'))
      setNotice(`${result.deletedCount} order${result.deletedCount === 1 ? '' : 's'} from today deleted. Revenue and stock were recalculated.`)
    } catch (requestError) { setError(requestError.message) }
    finally { setDeletingToday(false) }
  }

  if (loading) return <p>Loading order history…</p>
  return <div className="page-stack order-history-page">
    <div className="reports-header"><div><p className="eyebrow">Sales records</p><h1>Order history</h1><p>View every active sale and remove an incorrect transaction.</p></div><div className="order-history-actions"><label className="report-search">Search orders<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Product or operator" /></label><button type="button" className="danger" title="Delete all orders recorded today only" disabled={deletingToday || !sales.length} onClick={deleteTodaysSales}>{deletingToday ? 'Deleting…' : 'Delete all'}</button></div></div>
    {error && <p className="error-message" role="alert">{error}</p>}
    {notice && <p className="success-message" role="status">{notice}</p>}
    <section className="panel report-table-panel">
      <div className="report-table-heading"><div><h2>Selling items</h2><p>{visibleSales.length} order{visibleSales.length === 1 ? '' : 's'}</p></div></div>
      <div className="table-scroll"><table><thead><tr><th>Date and time</th><th>Item</th><th>Quantity</th><th>Unit price</th><th>Total</th><th>Sold by</th><th>Action</th></tr></thead><tbody>
        {visibleSales.map((sale) => <tr key={sale.id}><td>{new Date(sale.createdAt).toLocaleString()}</td><td><strong>{sale.itemName}</strong></td><td>{sale.quantity}</td><td>{money(sale.unitPrice)}</td><td>{money(sale.total)}</td><td>{sale.createdBy}</td><td><button type="button" className="danger table-action" disabled={deletingId === sale.id} onClick={() => deleteSale(sale)}>{deletingId === sale.id ? 'Deleting…' : 'Delete'}</button></td></tr>)}
        {!visibleSales.length && <tr><td colSpan="7">No sales found.</td></tr>}
      </tbody></table></div>
    </section>
  </div>
}
