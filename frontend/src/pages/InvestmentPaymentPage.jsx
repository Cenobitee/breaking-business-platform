import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'

const money = (value) =>
  `৳${Number(value).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function InvestmentPaymentPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const investmentPackage = location.state?.investmentPackage
  const quantity = Number(location.state?.quantity || 1)
  const totalPayable = Number(investmentPackage?.amount || 0) * quantity
  const [method, setMethod] = useState('bkash')
  const [mobile, setMobile] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!investmentPackage) return <Navigate to="/investor/investments" replace />

  async function completePayment(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await apiRequest('/investments/requests', {
        method: 'POST',
        body: JSON.stringify({ packageId: investmentPackage.id, quantity }),
      })
      navigate('/investor/investments', {
        replace: true,
        state: {
          paymentNotice: `${money(totalPayable)} payment submitted by ${method === 'card' ? 'card' : method}. The investment is pending Owner approval.`,
        },
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="investment-payment-page">
      <button
        type="button"
        className="employee-back-button"
        onClick={() => navigate('/investor/investments')}
      >
        ← Back to investment packages
      </button>
      <div className="investment-checkout-layout">
        <section className="panel investment-checkout-summary">
          <p className="eyebrow">Selected investment</p>
          <h1>{money(totalPayable)}</h1>
          <div>
            <span>Unit price × quantity</span>
            <strong>
              {money(investmentPackage.amount)} × {quantity}
            </strong>
          </div>
          <div>
            <span>Estimated earnings</span>
            <strong>
              {Number(investmentPackage.earningMinPercentage).toFixed(2)}%–
              {Number(investmentPackage.earningMaxPercentage).toFixed(2)}%
            </strong>
          </div>
          <div>
            <span>Project duration</span>
            <strong>{investmentPackage.durationMonths} months</strong>
          </div>
          <p>
            Payment submits an investment request. It will not become active and will not earn
            profit until the Owner approves it.
          </p>
        </section>

        <section className="panel investment-payment-card">
          <div>
            <p className="eyebrow">Secure checkout</p>
            <h2>Choose payment method</h2>
            <p>Select your preferred payment option to submit the investment.</p>
          </div>
          <div className="payment-method-options" role="radiogroup" aria-label="Payment method">
            <button
              type="button"
              className={method === 'bkash' ? 'selected bkash' : 'bkash'}
              onClick={() => setMethod('bkash')}
            >
              <strong>bKash</strong>
              <span>Mobile payment</span>
            </button>
            <button
              type="button"
              className={method === 'nagad' ? 'selected nagad' : 'nagad'}
              onClick={() => setMethod('nagad')}
            >
              <strong>Nagad</strong>
              <span>Mobile payment</span>
            </button>
            <button
              type="button"
              className={method === 'card' ? 'selected card' : 'card'}
              onClick={() => setMethod('card')}
            >
              <strong>Card</strong>
              <span>Visa / Mastercard</span>
            </button>
          </div>

          <form className="investment-payment-form" onSubmit={completePayment}>
            {method !== 'card' ? (
              <>
                <label>
                  {method === 'bkash' ? 'bKash' : 'Nagad'} account number
                  <input
                    required
                    inputMode="numeric"
                    pattern="01[0-9]{9}"
                    maxLength="11"
                    value={mobile}
                    onChange={(event) => setMobile(event.target.value.replace(/\D/g, ''))}
                    placeholder="01XXXXXXXXX"
                  />
                </label>
                <label>
                  Transaction ID
                  <input
                    required
                    value={transactionId}
                    onChange={(event) => setTransactionId(event.target.value)}
                    placeholder="Enter payment transaction ID"
                  />
                </label>
              </>
            ) : (
              <>
                <label className="payment-card-number">
                  Card number
                  <input
                    required
                    inputMode="numeric"
                    minLength="16"
                    maxLength="19"
                    value={card.number}
                    onChange={(event) =>
                      setCard({ ...card, number: event.target.value.replace(/[^\d ]/g, '') })
                    }
                    placeholder="0000 0000 0000 0000"
                  />
                </label>
                <label className="payment-card-name">
                  Name on card
                  <input
                    required
                    value={card.name}
                    onChange={(event) => setCard({ ...card, name: event.target.value })}
                  />
                </label>
                <label>
                  Expiry
                  <input
                    required
                    value={card.expiry}
                    onChange={(event) => setCard({ ...card, expiry: event.target.value })}
                    placeholder="MM/YY"
                  />
                </label>
                <label>
                  CVV
                  <input
                    required
                    type="password"
                    inputMode="numeric"
                    minLength="3"
                    maxLength="4"
                    value={card.cvv}
                    onChange={(event) =>
                      setCard({ ...card, cvv: event.target.value.replace(/\D/g, '') })
                    }
                    placeholder="•••"
                  />
                </label>
              </>
            )}
            {error && <p className="error-message payment-form-message">{error}</p>}
            <button type="submit" className="investment-pay-button" disabled={submitting}>
              {submitting ? 'Processing…' : `Pay ${money(totalPayable)} and request approval`}
            </button>
            <small className="payment-demo-notice">
              Project demonstration checkout. A production deployment requires official payment
              provider credentials and server-side payment verification.
            </small>
          </form>
        </section>
      </div>
    </div>
  )
}
