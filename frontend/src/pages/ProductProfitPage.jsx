import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../api/client'

const money = (value) =>
  `৳${Number(value || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

export function ProductProfitPage() {
  const [products, setProducts] = useState([])
  const [costs, setCosts] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await apiRequest('/product-profits')
      setProducts(data)
      setCosts(Object.fromEntries(data.map((product) => [product.productId, product.baseCost])))
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const totals = useMemo(
    () =>
      products.reduce(
        (sum, product) => ({
          revenue: sum.revenue + Number(product.salesRevenue),
          cost: sum.cost + Number(product.totalProductCost),
          profit: sum.profit + Number(product.totalProductProfit),
        }),
        { revenue: 0, cost: 0, profit: 0 },
      ),
    [products],
  )

  async function saveCost(product) {
    const baseCost = Number(costs[product.productId])
    if (!Number.isFinite(baseCost) || baseCost < 0) {
      setError('Enter a valid total cost of zero or more.')
      return
    }
    setSavingId(product.productId)
    setError('')
    setNotice('')
    try {
      await apiRequest(`/product-profits/${product.productId}/base-cost`, {
        method: 'PATCH',
        body: JSON.stringify({ baseCost }),
      })
      await load()
      setNotice(`${product.productName} cost saved. Future sales will use this amount.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="page-stack product-profit-page">
      <header className="product-profit-header">
        <div>
          <p className="eyebrow">Owner only</p>
          <h1>Product profit</h1>
          <p>
            Enter the complete cost of making one item. Profit is calculated automatically from the
            selling price.
          </p>
        </div>
        <div className="product-profit-formula">
          <small>Simple calculation</small>
          <strong>Selling price − total cost = profit</strong>
          <span>Example: ৳250 − ৳100 = ৳150</span>
        </div>
      </header>

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="success-message" role="status">
          {notice}
        </p>
      )}

      <section className="product-profit-summary" aria-label="Product profit totals">
        <div>
          <small>Sales revenue</small>
          <strong>{money(totals.revenue)}</strong>
        </div>
        <div>
          <small>Cost of sold products</small>
          <strong>{money(totals.cost)}</strong>
        </div>
        <div className="positive">
          <small>Actual profit</small>
          <strong>{money(totals.profit)}</strong>
        </div>
        <div className="owner-profit-part">
          <small>Owner’s profit part (50%)</small>
          <strong>{money(Math.max(0, totals.profit) / 2)}</strong>
        </div>
        <div className="investor-profit-part">
          <small>Investors’ profit part (50%)</small>
          <strong>{money(Math.max(0, totals.profit) / 2)}</strong>
        </div>
      </section>

      <section className="panel product-profit-panel">
        <div className="panel-title-row">
          <div>
            <p className="eyebrow">Profit by product</p>
            <h2>Products and complete costs</h2>
          </div>
          <p>Only active, non-deleted sales are counted.</p>
        </div>

        {!products.length ? (
          <div className="empty-state">
            <h3>No products yet</h3>
            <p>Add products from Point of Sale first.</p>
          </div>
        ) : (
          <div className="product-profit-list">
            {products.map((product) => {
              const draftCost = Number(costs[product.productId] || 0)
              const draftProfit = Number(product.sellingPrice) - draftCost
              return (
                <article className="product-profit-row" key={product.productId}>
                  <div className="product-profit-name">
                    <span>{product.productName.slice(0, 1).toUpperCase()}</span>
                    <div>
                      <strong>{product.productName}</strong>
                      <small>{product.unitsSold} units sold</small>
                    </div>
                  </div>
                  <dl>
                    <div>
                      <dt>Selling price</dt>
                      <dd>{money(product.sellingPrice)}</dd>
                    </div>
                    <div className="product-cost-input">
                      <dt>Total cost per item</dt>
                      <dd>
                        <span>৳</span>
                        <input
                          aria-label={`Total cost for ${product.productName}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={costs[product.productId] ?? ''}
                          onChange={(event) =>
                            setCosts((current) => ({
                              ...current,
                              [product.productId]: event.target.value,
                            }))
                          }
                        />
                      </dd>
                    </div>
                    <div>
                      <dt>Profit per item</dt>
                      <dd className={draftProfit < 0 ? 'negative' : 'positive'}>
                        {money(draftProfit)}
                      </dd>
                    </div>
                    <div>
                      <dt>Actual profit</dt>
                      <dd
                        className={Number(product.totalProductProfit) < 0 ? 'negative' : 'positive'}
                      >
                        {money(product.totalProductProfit)}
                      </dd>
                    </div>
                    <div>
                      <dt>Owner’s part (50%)</dt>
                      <dd className="positive">
                        {money(Math.max(0, Number(product.totalProductProfit)) / 2)}
                      </dd>
                    </div>
                    <div>
                      <dt>Investors’ part (50%)</dt>
                      <dd className="positive">
                        {money(Math.max(0, Number(product.totalProductProfit)) / 2)}
                      </dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    onClick={() => saveCost(product)}
                    disabled={savingId === product.productId}
                  >
                    {savingId === product.productId ? 'Saving…' : 'Save cost'}
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <p className="product-profit-note">
        A saved cost applies to future sales. Past sales keep their original cost, so historical
        profit remains accurate when prices change.
      </p>
    </div>
  )
}
