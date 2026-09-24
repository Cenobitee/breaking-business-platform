import { useState } from 'react'
import { apiRequest } from '../api/client'

export function PosForm({ onSaleCreated }) {
  const [itemName, setItemName] = useState('')
  const [unitPrice, setUnitPrice] = useState('0.00')
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      const sale = await apiRequest('/sales', {
        method: 'POST',
        body: JSON.stringify({ itemName: itemName.trim(), unitPrice: Number(unitPrice), quantity: Number(quantity) }),
      })
      setMessage({ type: 'success', text: `Sale #${sale.id} recorded: ৳${sale.total}` })
      setItemName('')
      setUnitPrice('0.00')
      setQuantity(1)
      await onSaleCreated()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <h2>New POS sale</h2>
      <form onSubmit={submit} className="pos-form">
        <label>
          Item
          <input
            required
            maxLength="120"
            placeholder="Enter product name"
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
          />
        </label>
        <label>
          Unit price
          <input
            type="number"
            min="0.01"
            max="9999999999.99"
            step="0.01"
            required
            placeholder="0.00"
            value={unitPrice}
            onChange={(event) => setUnitPrice(event.target.value)}
          />
        </label>
        <label>
          Quantity
          <input
            type="number"
            min="1"
            max="10000"
            required
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>
        <div className="sale-total">
          <span>Total</span>
          <strong>৳{(Number(quantity || 0) * Number(unitPrice || 0)).toFixed(2)}</strong>
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Recording…' : 'Record sale'}
        </button>
      </form>
      {message && <p className={message.type === 'error' ? 'error-message' : 'success-message'}>{message.text}</p>}
    </section>
  )
}
