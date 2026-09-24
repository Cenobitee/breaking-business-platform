import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../api/client'

const money = (value) => `৳${Number(value).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function ManagerAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [sales, setSales] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    Promise.all([apiRequest('/analytics/operations'), apiRequest('/sales')])
      .then(([summary, transactions]) => { setAnalytics(summary); setSales(transactions) })
      .catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }, [])

  const details = useMemo(() => {
    if (!analytics) return null
    const revenue = Number(analytics.revenue)
    const expenses = Number(analytics.expenses)
    const net = Number(analytics.netOperatingAmount ?? revenue - expenses)
    const units = sales.reduce((sum, sale) => sum + Number(sale.quantity), 0)
    const products = Object.values(sales.reduce((map, sale) => {
      const current = map[sale.itemName] || { name: sale.itemName, units: 0, revenue: 0, orders: 0 }
      current.units += Number(sale.quantity); current.revenue += Number(sale.total); current.orders += 1; map[sale.itemName] = current
      return map
    }, {})).sort((a, b) => b.revenue - a.revenue)
    const largestOrder = sales.reduce((largest, sale) => Number(sale.total) > Number(largest?.total || 0) ? sale : largest, null)
    return { revenue, expenses, net, units, products, largestOrder, margin: revenue ? (net / revenue) * 100 : 0, expenseRatio: revenue ? (expenses / revenue) * 100 : 0, itemsPerOrder: sales.length ? units / sales.length : 0 }
  }, [analytics, sales])

  if (loading) return <p>Analyzing business performance…</p>
  if (!details) return <div className="page-stack"><h1>Business analytics</h1><p className="error-message">{error || 'Analytics are unavailable.'}</p></div>
  const maxProductRevenue = Math.max(...details.products.map((product) => product.revenue), 1)
  const recommendations = [
    !sales.length ? 'Record sales through POS to unlock useful business trends.' : null,
    details.margin < 0 ? 'Expenses are higher than revenue. Review today’s operating costs.' : null,
    details.expenseRatio > 60 ? 'Expense ratio is above 60%. Check costs that can be reduced.' : null,
    details.products.length === 1 ? 'Revenue depends on one product. Consider diversifying the product mix.' : null,
    Number(analytics.averageOrderValue) < 200 && sales.length ? 'Average order value is below ৳200. Selling more units in one order will increase it.' : null,
  ].filter(Boolean)

  return <div className="page-stack analytics-page">
    <div><p className="eyebrow">Business intelligence</p><h1>Detailed business analytics</h1><p>Operational and financial indicators for {analytics.date}. Use them to identify strengths, risks, and opportunities.</p></div>
    {error && <p className="error-message">{error}</p>}
    <section className="analytics-kpi-grid">
      <article><small>Net operating amount</small><strong>{money(details.net)}</strong><span className={details.net >= 0 ? 'positive' : 'negative'}>{details.net >= 0 ? 'Positive position' : 'Operating loss'}</span></article>
      <article><small>Operating margin</small><strong>{details.margin.toFixed(1)}%</strong><span>After recorded expenses</span></article>
      <article><small>Expense-to-revenue</small><strong>{details.expenseRatio.toFixed(1)}%</strong><span>{details.expenseRatio <= 40 ? 'Controlled' : 'Review spending'}</span></article>
      <article><small>Average basket size</small><strong>{details.itemsPerOrder.toFixed(1)}</strong><span>Units per order</span></article>
      <article><small>Products selling</small><strong>{details.products.length}</strong><span>Unique products today</span></article>
      <article><small>Largest order</small><strong>{details.largestOrder ? money(details.largestOrder.total) : money(0)}</strong><span>{details.largestOrder?.itemName || 'No sales yet'}</span></article>
    </section>
    <div className="analytics-main-grid">
      <section className="panel product-performance"><div className="panel-title-row"><div><p className="eyebrow">Sales mix</p><h2>Product performance</h2></div><span>{details.units} units</span></div>{details.products.map((product) => <div className="product-performance-row" key={product.name}><div><strong>{product.name}</strong><small>{product.units} units · {product.orders} orders</small></div><div className="product-bar"><span style={{ width: `${(product.revenue / maxProductRevenue) * 100}%` }} /></div><strong>{money(product.revenue)}</strong></div>)}{!details.products.length && <p>No product data is available yet.</p>}</section>
      <section className="panel analytics-financial"><p className="eyebrow">Financial structure</p><h2>Revenue allocation</h2><div className="financial-total"><small>Total revenue</small><strong>{money(details.revenue)}</strong></div><div className="financial-track"><span className="expense" style={{ width: `${Math.min(details.expenseRatio, 100)}%` }} /></div><div className="financial-legend"><span><i className="net" />Net amount <strong>{money(details.net)}</strong></span><span><i className="expense" />Expenses <strong>{money(details.expenses)}</strong></span></div></section>
    </div>
    <section className="panel business-recommendations"><div><p className="eyebrow">Decision support</p><h2>Recommended attention</h2></div><div>{recommendations.length ? recommendations.map((recommendation) => <article key={recommendation}><span>!</span><p>{recommendation}</p></article>) : <article className="all-good"><span>✓</span><p>Current indicators look balanced. Continue monitoring sales and expenses.</p></article>}</div></section>
  </div>
}
