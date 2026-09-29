import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'
import { useAuth } from '../auth/AuthContext'

const money = (value) =>
  `৳${Number(value).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const percent = (value) => `${Number(value).toFixed(2)}%`
const dateTime = (value) => (value ? new Date(value).toLocaleString('en-BD') : '—')

export function InvestorDashboard({ view = 'overview' }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isInvestor = user.role === 'INVESTOR'
  const [analytics, setAnalytics] = useState(null)
  const [investments, setInvestments] = useState(null)
  const [packages, setPackages] = useState([])
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    try {
      const [analyticsData, investmentData, packageData] = await Promise.all([
        apiRequest('/analytics/investor'),
        isInvestor ? apiRequest('/investments/me') : Promise.resolve(null),
        apiRequest('/investments/packages'),
      ])
      setAnalytics(analyticsData)
      setInvestments(investmentData)
      setPackages(packageData)
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [isInvestor])

  useEffect(() => {
    load()
    const intervalId = window.setInterval(load, 10000)
    return () => window.clearInterval(intervalId)
  }, [load])

  useEffect(() => {
    if (location.state?.paymentNotice) {
      setNotice(location.state.paymentNotice)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  function requestInvestment(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    const selectedPackage = packages.find(
      (investmentPackage) => Number(investmentPackage.amount) === Number(amount),
    )
    if (!selectedPackage) return
    navigate('/investor/payment', { state: { investmentPackage: selectedPackage } })
  }

  async function updatePackage(investmentPackage, percentage) {
    setError('')
    setNotice('')
    try {
      await apiRequest(`/investments/packages/${investmentPackage.id}`, {
        method: 'PUT',
        body: JSON.stringify({ profitPercentage: Number(percentage) }),
      })
      setNotice(`${money(investmentPackage.amount)} package updated to ${percentage}%.`)
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const totalInvested = Number(investments?.totalInvested || 0)
  const approvedCapital = Number(analytics?.initialCapital || 0)
  const netProfit = Number(analytics?.netProfit || 0)
  const capitalShare = approvedCapital > 0 ? (totalInvested / approvedCapital) * 100 : 0
  const pendingRequests = (investments?.requests || []).filter(
    (request) => request.status === 'PENDING',
  )
  const latestActivity = (investments?.history || [])[0]
  const investorProfitRate = Number(analytics?.investorCombinedProfitPercentage || 0)
  const investorRevenueShare = Number(analytics?.investorLifetimeRevenueShare || 0)
  const investorExpenseShare = Number(analytics?.investorLifetimeExpenseShare || 0)
  const investorNetGain = Number(analytics?.investorLifetimeNetProfit || 0)
  const dailyProfit = Number(analytics?.investorTodayProfit || 0)
  const monthlyProfit = Number(analytics?.investorCompletedMonthProfit || 0)
  const pageContent =
    view === 'investments'
      ? {
          eyebrow: 'Investment center',
          title: 'Manage investments',
          description: 'Submit a new investment request and follow its approval status.',
        }
      : view === 'history'
        ? {
            eyebrow: 'Financial records',
            title: 'Investment history',
            description: 'Review the permanent timeline of approved and removed investments.',
          }
        : {
            eyebrow: 'Investor portal',
            title: isInvestor
              ? `Welcome, ${user.fullName?.split(' ')[0] || 'Investor'}`
              : 'Investor overview',
            description: isInvestor
              ? 'Track your capital and the financial progress of the business in one secure place.'
              : 'Review the financial information and experience provided to your investors.',
          }

  return (
    <div className="page-stack investor-dashboard">
      <div className="investor-heading">
        <div>
          <p className="eyebrow">{pageContent.eyebrow}</p>
          <h1>{pageContent.title}</h1>
          <p>{pageContent.description}</p>
        </div>
        <span className="investor-access-badge">
          <i /> Verified access
        </span>
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
      {!analytics && !error && <p>Loading investor analytics…</p>}
      {analytics && (
        <>
          {view === 'overview' && (
            <section className="investor-portfolio-hero" aria-label="Investment portfolio summary">
              <div className="investor-portfolio-main">
                <span>{isInvestor ? 'Your active investment' : 'Approved investor capital'}</span>
                <strong>{money(isInvestor ? totalInvested : approvedCapital)}</strong>
                <p>
                  {isInvestor
                    ? `${capitalShare.toFixed(1)}% of currently approved business capital`
                    : 'Capital currently approved for the business'}
                </p>
              </div>
              <div className="investor-portfolio-stat">
                <span>Business net profit</span>
                <strong className={netProfit < 0 ? 'negative' : ''}>{money(netProfit)}</strong>
                <small>Revenue minus operational expenses</small>
              </div>
              <div className="investor-portfolio-stat">
                <span>Profit margin</span>
                <strong>{percent(analytics.profitMarginPercentage)}</strong>
                <small>Profit earned from every ৳100 of sales</small>
              </div>
              <div className="investor-portfolio-stat">
                <span>Capital health</span>
                <strong>{percent(analytics.capitalHealthPercentage)}</strong>
                <div className="investor-health-track">
                  <i
                    style={{
                      width: `${Math.min(Math.max(Number(analytics.capitalHealthPercentage), 0), 100)}%`,
                    }}
                  />
                </div>
              </div>
            </section>
          )}

          {isInvestor && view === 'overview' && (
            <section className="investor-profit-periods" aria-label="Daily and monthly profit">
              <article className="investor-daily-profit">
                <div>
                  <p className="eyebrow">Today’s activity</p>
                  <h2>Daily profit</h2>
                  <p>Calculated from today’s product sales after today’s expenses.</p>
                </div>
                <strong className={dailyProfit < 0 ? 'negative' : ''}>{money(dailyProfit)}</strong>
                <small>Pending until the day closes</small>
              </article>
              <article className="investor-monthly-profit">
                <div>
                  <p className="eyebrow">Completed days this month</p>
                  <h2>Monthly profit balance</h2>
                  <p>Each daily profit is added automatically after that day ends.</p>
                </div>
                <strong className={monthlyProfit < 0 ? 'negative' : ''}>
                  {money(monthlyProfit)}
                </strong>
                <span>
                  Available for disbursement on{' '}
                  {new Date(`${analytics.nextDisbursementDate}T00:00:00`).toLocaleDateString(
                    'en-BD',
                    { day: 'numeric', month: 'long', year: 'numeric' },
                  )}
                </span>
              </article>
            </section>
          )}

          {isInvestor && view === 'overview' && (
            <section className="panel investor-profit-breakdown">
              <div className="panel-title-row">
                <div>
                  <p className="eyebrow">Your calculated return</p>
                  <h2>Profit after business expenses</h2>
                </div>
                <span className="investor-return-rate">
                  {percent(investorProfitRate)} combined rate
                </span>
              </div>
              <p className="investor-profit-explanation">
                Only sales and expenses recorded after the Owner approved your investment are
                included. Earlier business activity never changes your return.
              </p>
              <div className="investor-profit-equation">
                <article>
                  <small>Your share of sales revenue</small>
                  <strong>{money(investorRevenueShare)}</strong>
                </article>
                <span>−</span>
                <article>
                  <small>Your share of expenses</small>
                  <strong>{money(investorExpenseShare)}</strong>
                </article>
                <span>=</span>
                <article className={investorNetGain < 0 ? 'negative' : 'positive'}>
                  <small>Your estimated net gain</small>
                  <strong>{money(investorNetGain)}</strong>
                </article>
              </div>
              <small className="investor-profit-note">
                Calculation: (total sales − total expenses) × your combined package rate.
              </small>
            </section>
          )}

          {view === 'overview' && (
            <section className="investor-business-grid" aria-label="Business performance">
              <article>
                <span>↗</span>
                <div>
                  <small>Total business revenue</small>
                  <strong>{money(analytics.totalRevenue)}</strong>
                  <p>Income generated from recorded sales.</p>
                </div>
              </article>
              <article>
                <span>↘</span>
                <div>
                  <small>Operating expenses</small>
                  <strong>{money(analytics.totalExpenses)}</strong>
                  <p>Recorded costs required to run the business.</p>
                </div>
              </article>
              <article>
                <span>◎</span>
                <div>
                  <small>{isInvestor ? 'Request status' : 'Approved capital'}</small>
                  <strong>
                    {isInvestor ? `${pendingRequests.length} pending` : money(approvedCapital)}
                  </strong>
                  <p>
                    {isInvestor
                      ? pendingRequests.length
                        ? 'Waiting for the Owner’s decision.'
                        : 'No requests waiting for approval.'
                      : 'Visible to investors for transparency.'}
                  </p>
                </div>
              </article>
              <article>
                <span>✓</span>
                <div>
                  <small>Latest portfolio activity</small>
                  <strong>
                    {latestActivity
                      ? dateTime(latestActivity.investedAt).split(',')[0]
                      : 'No activity yet'}
                  </strong>
                  <p>
                    {latestActivity
                      ? `${money(latestActivity.amount)} ${latestActivity.status.toLowerCase()}`
                      : 'Approved investments will appear here.'}
                  </p>
                </div>
              </article>
            </section>
          )}

          {isInvestor && (
            <>
              {view === 'investments' && (
                <section className="panel investment-request-panel investor-request-card">
                  <div>
                    <p className="eyebrow">New investment</p>
                    <h2>Request to invest</h2>
                    <p>Select a package set by the Owner. It is counted only after approval.</p>
                  </div>
                  <form className="investment-request-form" onSubmit={requestInvestment}>
                    <div
                      className="investment-package-options"
                      role="radiogroup"
                      aria-label="Investment package"
                    >
                      {packages.map((investmentPackage) => (
                        <button
                          type="button"
                          key={investmentPackage.id}
                          className={
                            Number(amount) === Number(investmentPackage.amount) ? 'selected' : ''
                          }
                          onClick={() => setAmount(String(investmentPackage.amount))}
                        >
                          <strong>{money(investmentPackage.amount)}</strong>
                          <span>{percent(investmentPackage.profitPercentage)} profit share</span>
                        </button>
                      ))}
                    </div>
                    <button type="submit" disabled={submitting || !amount}>
                      {submitting ? 'Opening payment…' : 'Continue to payment'}
                    </button>
                  </form>
                </section>
              )}

              {view === 'investments' && (
                <section className="panel investor-record-panel">
                  <div className="panel-title-row">
                    <div>
                      <p className="eyebrow">Approval tracker</p>
                      <h2>Investment requests</h2>
                    </div>
                    <span className="owner-muted-count">
                      {(investments?.requests || []).length} records
                    </span>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Requested</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Approved / invested</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(investments?.requests || []).map((request) => (
                          <tr key={request.id}>
                            <td>{dateTime(request.requestedAt)}</td>
                            <td>{money(request.amount)}</td>
                            <td>
                              <span className={`role-label status-${request.status.toLowerCase()}`}>
                                {request.status}
                              </span>
                            </td>
                            <td>{dateTime(request.approvedAt)}</td>
                          </tr>
                        ))}
                        {(investments?.requests || []).length === 0 && (
                          <tr>
                            <td colSpan="4">No investment requests yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {view === 'history' && (
                <section className="panel investor-record-panel">
                  <div className="panel-title-row">
                    <div>
                      <p className="eyebrow">Permanent record</p>
                      <h2>Investment history</h2>
                    </div>
                    <span className="investor-readonly-pill">Read only</span>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Date and time invested</th>
                          <th>Amount</th>
                          <th>Approved by</th>
                          <th>Status</th>
                          <th>Removed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(investments?.history || []).map((investment) => (
                          <tr key={investment.id}>
                            <td>{dateTime(investment.investedAt)}</td>
                            <td>{money(investment.amount)}</td>
                            <td>{investment.approvedBy}</td>
                            <td>
                              <span
                                className={`role-label status-${investment.status.toLowerCase()}`}
                              >
                                {investment.status}
                              </span>
                            </td>
                            <td>
                              {investment.removedAt
                                ? `${dateTime(investment.removedAt)} by ${investment.removedBy}`
                                : '—'}
                            </td>
                          </tr>
                        ))}
                        {(investments?.history || []).length === 0 && (
                          <tr>
                            <td colSpan="5">No approved investments yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}

          {!isInvestor && view === 'overview' && (
            <section className="panel owner-package-manager">
              <div className="panel-title-row">
                <div>
                  <p className="eyebrow">Owner controls</p>
                  <h2>Investment packages</h2>
                  <p>Set the profit percentage offered for each fixed investment amount.</p>
                </div>
              </div>
              <div className="owner-package-grid">
                {packages.map((investmentPackage) => (
                  <form
                    key={investmentPackage.id}
                    onSubmit={(event) => {
                      event.preventDefault()
                      updatePackage(investmentPackage, event.currentTarget.percentage.value)
                    }}
                  >
                    <strong>{money(investmentPackage.amount)}</strong>
                    <label>
                      Profit percentage
                      <div>
                        <input
                          name="percentage"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          defaultValue={Number(investmentPackage.profitPercentage)}
                          required
                        />
                        <span>%</span>
                      </div>
                    </label>
                    <button type="submit">Save percentage</button>
                  </form>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
