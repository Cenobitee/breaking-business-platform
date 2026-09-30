import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../api/client'

const money = (value) =>
  `৳${Number(value).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const localDateValue = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function OrderHistoryPage() {
  const [sales, setSales] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [deletingSelected, setDeletingSelected] = useState(false)
  const [selectedDate, setSelectedDate] = useState(localDateValue)
  const [deletingDate, setDeletingDate] = useState(false)

  const load = useCallback(async () => {
    try {
      setSales(await apiRequest('/sales'))
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const visibleSales = useMemo(() => {
    const search = query.trim().toLowerCase()
    return search
      ? sales.filter((sale) => `${sale.itemName} ${sale.createdBy}`.toLowerCase().includes(search))
      : sales
  }, [query, sales])

  async function deleteSale(sale) {
    if (
      !window.confirm(
        `Delete ${sale.quantity} × ${sale.itemName} for ${money(sale.total)}? Its stock will be returned.`,
      )
    )
      return
    setDeletingId(sale.id)
    setError('')
    setNotice('')
    try {
      await apiRequest(`/sales/${sale.id}`, { method: 'DELETE' })
      await load()
      window.dispatchEvent(new Event('financial-platform-sale-updated'))
      window.dispatchEvent(new Event('financial-platform-stock-updated'))
      setNotice('Sale deleted, totals recalculated, and the sold quantity returned to stock.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDeletingId(null)
    }
  }

  async function deleteSalesByDate() {
    const readableDate = new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const confirmation = window.prompt(
      `Delete every order recorded on ${readableDate}? All quantities will be returned to stock. Type DELETE to continue.`,
    )
    if (confirmation !== 'DELETE') return
    setDeletingDate(true)
    setError('')
    setNotice('')
    try {
      const result = await apiRequest(`/sales/date/${selectedDate}`, { method: 'DELETE' })
      await load()
      window.dispatchEvent(new Event('financial-platform-sale-updated'))
      window.dispatchEvent(new Event('financial-platform-stock-updated'))
      setNotice(
        `${result.deletedCount} order${result.deletedCount === 1 ? '' : 's'} from ${readableDate} deleted. Revenue and stock were recalculated.`,
      )
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDeletingDate(false)
    }
  }

  function toggleSale(saleId) {
    setSelectedIds((current) =>
      current.includes(saleId) ? current.filter((id) => id !== saleId) : [...current, saleId],
    )
  }

  function toggleAllVisible() {
    const visibleIds = visibleSales.map((sale) => sale.id)
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])],
    )
  }

  async function deleteSelectedSales() {
    if (!selectedIds.length) return
    if (
      !window.confirm(
        `Delete ${selectedIds.length} selected order${selectedIds.length === 1 ? '' : 's'}? Their quantities will be returned to stock.`,
      )
    )
      return
    setDeletingSelected(true)
    setError('')
    setNotice('')
    try {
      const result = await apiRequest('/sales/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ saleIds: selectedIds }),
      })
      setSelectedIds([])
      await load()
      window.dispatchEvent(new Event('financial-platform-sale-updated'))
      window.dispatchEvent(new Event('financial-platform-stock-updated'))
      setNotice(
        `${result.deletedCount} selected order${result.deletedCount === 1 ? '' : 's'} deleted. Revenue and stock were recalculated.`,
      )
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDeletingSelected(false)
    }
  }

  if (loading) return <p>Loading order history…</p>
  return (
    <div className="page-stack order-history-page">
      <div className="reports-header">
        <div>
          <p className="eyebrow">Sales records</p>
          <h1>Order history</h1>
          <p>View every active sale and remove an incorrect transaction.</p>
        </div>
        <div className="order-history-actions">
          <label className="report-search">
            Search orders
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Product or operator"
            />
          </label>
          <label className="order-date-control">
            Delete orders from
            <input
              type="date"
              value={selectedDate}
              max={localDateValue()}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="danger"
            title="Delete all orders recorded on the selected date"
            disabled={deletingDate || !selectedDate}
            onClick={deleteSalesByDate}
          >
            {deletingDate ? 'Deleting…' : 'Delete all'}
          </button>
        </div>
      </div>
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
      <section className="panel report-table-panel">
        <div className="report-table-heading">
          <div>
            <h2>Selling items</h2>
            <p>
              {visibleSales.length} order{visibleSales.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="selected-order-actions">
            <span>{selectedIds.length} selected</span>
            <button
              type="button"
              className="danger table-action"
              disabled={!selectedIds.length || deletingSelected}
              onClick={deleteSelectedSales}
            >
              {deletingSelected ? 'Deleting…' : 'Delete selected'}
            </button>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th className="selection-column">
                  <input
                    type="checkbox"
                    aria-label="Select all visible orders"
                    checked={
                      visibleSales.length > 0 &&
                      visibleSales.every((sale) => selectedIds.includes(sale.id))
                    }
                    onChange={toggleAllVisible}
                  />
                </th>
                <th>Date and time</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit price</th>
                <th>Total</th>
                <th>Sold by</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="selection-column">
                    <input
                      type="checkbox"
                      aria-label={`Select ${sale.itemName} order`}
                      checked={selectedIds.includes(sale.id)}
                      onChange={() => toggleSale(sale.id)}
                    />
                  </td>
                  <td>{new Date(sale.createdAt).toLocaleString()}</td>
                  <td>
                    <strong>{sale.itemName}</strong>
                  </td>
                  <td>{sale.quantity}</td>
                  <td>{money(sale.unitPrice)}</td>
                  <td>{money(sale.total)}</td>
                  <td>{sale.createdBy}</td>
                  <td>
                    <button
                      type="button"
                      className="danger table-action"
                      disabled={deletingId === sale.id}
                      onClick={() => deleteSale(sale)}
                    >
                      {deletingId === sale.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
              {!visibleSales.length && (
                <tr>
                  <td colSpan="8">No sales found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
