import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useAuth } from '../auth/AuthContext'

const money = (value) =>
  `৳${Number(value).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const dateTime = (value) => new Date(value).toLocaleString('en-BD')

export function InvestmentManagementPage() {
  const { user } = useAuth()
  const [activeInvestments, setActiveInvestments] = useState([])
  const [cycles, setCycles] = useState([])
  const [completingId, setCompletingId] = useState(null)
  const [removingId, setRemovingId] = useState(null)
  const [deletingHistory, setDeletingHistory] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    try {
      const [investmentsData, cycleData] = await Promise.all([
        apiRequest('/investments/active'),
        apiRequest('/investments/cycles'),
      ])
      setActiveInvestments(investmentsData)
      setCycles(cycleData)
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

  async function completeCycle(cycle) {
    if (
      !window.confirm(
        `Finalize the cycle for ${cycle.investorName}? This locks its profit calculation.`,
      )
    )
      return
    setCompletingId(cycle.id)
    setError('')
    setNotice('')
    try {
      await apiRequest(`/investments/cycles/${cycle.id}/complete`, { method: 'POST' })
      setNotice(`The cycle for ${cycle.investorName} was finalized.`)
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setCompletingId(null)
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

      <section className="panel investment-cycle-panel">
        <div className="panel-title-row">
          <div>
            <p className="eyebrow">Profit settlements</p>
            <h2>Investment cycles</h2>
          </div>
          <span className="owner-muted-count">Fixed project tenure</span>
        </div>
        <p>
          Each cycle starts at approval. The live estimate uses only sales and expenses recorded
          during that cycle. Finalize it after its end date to lock the investor’s return.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Investor</th>
                <th>Period</th>
                <th>Principal</th>
                <th>Unit share</th>
                <th>Sales − costs</th>
                <th>Investor profit</th>
                <th>Settlement</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cycles.map((cycle) => {
                const canComplete =
                  cycle.status === 'ACTIVE' && Date.now() >= new Date(cycle.endsAt).getTime()
                return (
                  <tr key={cycle.id}>
                    <td>{cycle.investorName}</td>
                    <td>
                      {dateTime(cycle.startsAt)}
                      <br />
                      <small>to {dateTime(cycle.endsAt)}</small>
                    </td>
                    <td>{money(cycle.principal)}</td>
                    <td>{Number(cycle.capitalSharePercentage).toFixed(2)}%</td>
                    <td>{money(cycle.distributableProfit)}</td>
                    <td>{money(cycle.investorProfit)}</td>
                    <td>{money(cycle.settlementTotal)}</td>
                    <td>
                      {cycle.status !== 'ACTIVE' ? (
                        <span className="role-label status-completed">{cycle.status === 'WITHDRAWN' ? 'Withdrawn' : 'Ready'}</span>
                      ) : (
                        <button
                          type="button"
                          className="table-action"
                          disabled={!canComplete || completingId === cycle.id}
                          onClick={() => completeCycle(cycle)}
                          title={
                            canComplete
                              ? 'Lock the final settlement'
                              : 'Available after the cycle ends'
                          }
                        >
                          {completingId === cycle.id
                            ? 'Finalizing…'
                            : canComplete
                              ? 'Finalize cycle'
                              : 'Cycle active'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {cycles.length === 0 && (
                <tr>
                  <td colSpan="8">No investment cycles yet.</td>
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
