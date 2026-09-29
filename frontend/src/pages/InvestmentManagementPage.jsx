import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useAuth } from '../auth/AuthContext'

const money = (value) =>
  `৳${Number(value).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const dateTime = (value) => new Date(value).toLocaleString('en-BD')

export function InvestmentManagementPage() {
  const { user } = useAuth()
  const [activeInvestments, setActiveInvestments] = useState([])
  const [removingId, setRemovingId] = useState(null)
  const [deletingHistory, setDeletingHistory] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    try {
      setActiveInvestments(await apiRequest('/investments/active'))
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

  async function removeInvestment(investment) {
    if (
      !window.confirm(
        `Remove ${money(investment.amount)} invested by ${investment.investorName}? The removal will remain in the audit history.`,
      )
    )
      return
    setRemovingId(investment.id)
    setError('')
    setNotice('')
    try {
      await apiRequest(`/investments/${investment.id}/remove`, { method: 'POST' })
      setNotice(`${money(investment.amount)} was removed from active investor capital.`)
      window.dispatchEvent(new Event('financial-platform-investments-updated'))
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setRemovingId(null)
    }
  }

  async function deleteInvestmentHistory() {
    const confirmation = window.prompt(
      `This permanently deletes every investment request and investment-history record for ${user.businessName}. Type DELETE to continue.`,
    )
    if (confirmation !== 'DELETE') return
    setDeletingHistory(true)
    setError('')
    setNotice('')
    try {
      const response = await apiRequest('/investments/history', { method: 'DELETE' })
      setNotice(response.message)
      window.dispatchEvent(new Event('financial-platform-investments-updated'))
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDeletingHistory(false)
    }
  }

  if (loading) return <p>Loading investor capital…</p>

  const totalCapital = activeInvestments.reduce(
    (sum, investment) => sum + Number(investment.amount),
    0,
  )

  return (
    <div className="page-stack investment-management-page">
      <header className="investment-management-heading">
        <div>
          <p className="eyebrow">Ownership</p>
          <h1>Investment management</h1>
          <p>Review approved investor capital and manage the permanent investment record.</p>
        </div>
        <div>
          <small>Total active investor capital</small>
          <strong>{money(totalCapital)}</strong>
        </div>
      </header>
      {error && <p className="error-message">{error}</p>}
      {notice && <p className="success-message">{notice}</p>}

      <section className="panel">
        <div className="panel-title-row">
          <div>
            <p className="eyebrow">Business funding</p>
            <h2>Active investor capital</h2>
          </div>
          <span className="owner-muted-count">{activeInvestments.length} active packages</span>
        </div>
        <p>
          Only owner-approved investment requests appear here. Removing an amount subtracts it from
          active capital but preserves the removal in the investor’s history.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Invested</th>
                <th>Investor</th>
                <th>Email</th>
                <th>Active amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {activeInvestments.map((investment) => (
                <tr key={investment.id}>
                  <td>{dateTime(investment.investedAt)}</td>
                  <td>{investment.investorName}</td>
                  <td>{investment.investorEmail}</td>
                  <td>{money(investment.amount)}</td>
                  <td>
                    <button
                      className="danger table-action"
                      type="button"
                      disabled={removingId === investment.id}
                      onClick={() => removeInvestment(investment)}
                    >
                      {removingId === investment.id ? 'Removing…' : 'Remove amount'}
                    </button>
                  </td>
                </tr>
              ))}
              {activeInvestments.length === 0 && (
                <tr>
                  <td colSpan="5">No active invested amounts.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <details className="owner-danger-details panel">
        <summary>Investment history options</summary>
        <div className="danger-zone">
          <div>
            <strong>Delete all investment history</strong>
            <p>
              Permanently deletes requests, approvals, removals, and investment-history records for{' '}
              {user.businessName}. Investment package settings are preserved.
            </p>
          </div>
          <button
            className="danger"
            type="button"
            disabled={deletingHistory}
            onClick={deleteInvestmentHistory}
          >
            {deletingHistory ? 'Deleting…' : 'Delete all history'}
          </button>
        </div>
      </details>
    </div>
  )
}
