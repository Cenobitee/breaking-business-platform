import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../api/client'

const money = (value) => `৳${Number(value).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const emptyProduct = { name: '', unitPrice: '', unitCost: '', stockQuantity: '', lowStockThreshold: 5 }

export function PointOfSalePage() {
  const [products, setProducts] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [form, setForm] = useState(emptyProduct)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [quantities, setQuantities] = useState({})
  const [sellingId, setSellingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    try {
      const [catalog, summary] = await Promise.all([apiRequest('/products'), apiRequest('/analytics/operations')])
      setProducts(catalog); setAnalytics(summary); setError('')
    } catch (requestError) {
      setError(requestError.message.includes('404') ? 'Product catalog is not available yet. Restart Spring Boot in IntelliJ, then refresh this page.' : requestError.message)
    }
  }, [])
  useEffect(() => { load() }, [load])

  function openCreate() { setEditingId(null); setForm(emptyProduct); setFormOpen(true); setError(''); setNotice('') }
  function openEdit(product) { setEditingId(product.id); setForm({ name: product.name, unitPrice: product.unitPrice, unitCost: product.unitCost, stockQuantity: product.stockQuantity, lowStockThreshold: product.lowStockThreshold }); setFormOpen(true); setError(''); setNotice('') }
  async function saveProduct(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('')
    try {
      await apiRequest(editingId ? `/products/${editingId}` : '/products', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify({ name: form.name.trim(), unitPrice: Number(form.unitPrice), unitCost: Number(form.unitCost || 0), stockQuantity: Number(form.stockQuantity), lowStockThreshold: Number(form.lowStockThreshold) }) })
      setFormOpen(false); await load(); window.dispatchEvent(new Event('financial-platform-stock-updated')); setNotice(editingId ? 'Product updated.' : 'Product added to the sales catalog.')
    } catch (requestError) { setError(requestError.message) } finally { setSaving(false) }
  }
  async function deleteProduct(product) {
    if (!window.confirm(`Remove ${product.name} from the product catalog? Existing sales will remain in reports.`)) return
    try { await apiRequest(`/products/${product.id}`, { method: 'DELETE' }); await load(); window.dispatchEvent(new Event('financial-platform-stock-updated')); setNotice('Product removed from the catalog.') }
    catch (requestError) { setError(requestError.message) }
  }
  async function recordSale(product) {
    const saleQuantity = Number(quantities[product.id] ?? '')
    if (!Number.isInteger(saleQuantity) || saleQuantity < 1) { setError('Enter a valid quantity of at least 1.'); return }
    setSellingId(product.id); setError(''); setNotice('')
    try {
      const sale = await apiRequest('/sales', { method: 'POST', body: JSON.stringify({ productId: product.id, quantity: saleQuantity }) })
      await load(); window.dispatchEvent(new Event('financial-platform-sale-updated')); window.dispatchEvent(new Event('financial-platform-stock-updated'))
      setQuantities((current) => ({ ...current, [product.id]: '' }))
      setNotice(`${saleQuantity} × ${product.name} sold. ${money(sale.total)} was added to revenue and all financial analytics.`)
    } catch (requestError) { setError(requestError.message) } finally { setSellingId(null) }
  }

  return <div className="page-stack pos-page">
    <div className="pos-page-header"><div><p className="eyebrow">Fast checkout</p><h1>Point of Sale</h1><p>Tap a saved product to record the sale and update every financial indicator automatically.</p></div><button type="button" onClick={openCreate}>+ Add product</button></div>
    {error && <p className="error-message" role="alert">{error}</p>}{notice && <p className="success-message" role="status">{notice}</p>}
    {analytics && <section className="pos-live-strip"><div><small>Revenue today</small><strong>{money(analytics.revenue)}</strong></div><div><small>Orders today</small><strong>{analytics.orderCount}</strong></div><div><small>Net operating</small><strong>{money(analytics.netOperatingAmount)}</strong></div><div><small>Average order</small><strong>{money(analytics.averageOrderValue)}</strong></div></section>}
    {formOpen && <section className="panel product-form-panel"><div className="panel-title-row"><div><p className="eyebrow">Catalog setup</p><h2>{editingId ? 'Edit product' : 'Add a product item'}</h2></div><button type="button" className="secondary" onClick={() => setFormOpen(false)}>Close</button></div><form className="product-form" onSubmit={saveProduct}><label>Product name<input required maxLength="120" placeholder="Example: Mango Juice" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Selling price (৳)<input required type="number" min="0.01" step="0.01" value={form.unitPrice} onChange={(event) => setForm({ ...form, unitPrice: event.target.value })} /></label><label>Cost to business per item (৳)<input required type="number" min="0" step="0.01" value={form.unitCost} onChange={(event) => setForm({ ...form, unitCost: event.target.value })} /><small>Used to calculate profit and break-even.</small></label><label>Available stock<input required type="number" min="0" step="1" value={form.stockQuantity} onChange={(event) => setForm({ ...form, stockQuantity: event.target.value })} /></label><label>Low-stock warning at<input required type="number" min="0" step="1" value={form.lowStockThreshold} onChange={(event) => setForm({ ...form, lowStockThreshold: event.target.value })} /></label><button type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save product' : 'Add to catalog'}</button></form></section>}
    {products.some((product) => product.stockQuantity <= product.lowStockThreshold) && <section className="panel stock-alert-panel" id="stock-alerts"><div><p className="eyebrow">Inventory notification</p><h2>Stock needs attention</h2></div>{products.filter((product) => product.stockQuantity <= product.lowStockThreshold).map((product) => <p key={product.id}><strong>{product.name}</strong><span>{product.stockQuantity === 0 ? 'Out of stock' : `Only ${product.stockQuantity} left`}</span></p>)}</section>}
    <section className="panel pos-catalog-panel"><div className="pos-catalog-heading"><div><p className="eyebrow">Product catalog</p><h2>Enter quantity and sell</h2><p>Each product has its own quantity, price calculation, and stock limit.</p></div></div>
      <div className="product-tap-grid">{products.map((product) => { const productQuantity = quantities[product.id] ?? ''; const saleQuantity = Number(productQuantity); const validQuantity = Number.isInteger(saleQuantity) && saleQuantity >= 1; return <article className={`product-tap-card${product.stockQuantity === 0 ? ' out-of-stock' : product.stockQuantity <= product.lowStockThreshold ? ' low-stock' : ''}`} key={product.id}><label className="product-quantity-control">Quantity for {product.name}<input type="number" min="1" max={product.stockQuantity} step="1" placeholder="Enter quantity" value={productQuantity} disabled={product.stockQuantity === 0} onChange={(event) => setQuantities((current) => ({ ...current, [product.id]: event.target.value }))} /></label><button className="product-sell-button" type="button" disabled={sellingId !== null || product.stockQuantity === 0 || !validQuantity || saleQuantity > product.stockQuantity} onClick={() => recordSale(product)}><span>{product.name.slice(0, 1).toUpperCase()}</span><div><strong>{product.name}</strong><small>{money(product.unitPrice)} each · {product.stockQuantity} in stock</small></div><em>{product.stockQuantity === 0 ? 'Out of stock' : !validQuantity ? 'Enter quantity above' : sellingId === product.id ? 'Recording…' : saleQuantity > product.stockQuantity ? 'Not enough stock' : `Sell ${saleQuantity} · ${money(Number(product.unitPrice) * saleQuantity)}`}</em></button><div className="product-card-actions"><button type="button" className="secondary" onClick={() => openEdit(product)}>Edit stock</button><button type="button" className="danger" onClick={() => deleteProduct(product)}>Delete</button></div></article> })}{products.length === 0 && <div className="empty-product-catalog"><span>＋</span><h2>Add your first product</h2><p>Create a reusable product item. After that, recording a sale takes one tap.</p><button type="button" onClick={openCreate}>Add product</button></div>}</div>
    </section>
  </div>
}
