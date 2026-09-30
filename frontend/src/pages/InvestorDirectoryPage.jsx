import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'

const money = (value) =>
  `৳${Number(value || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const dateTime = (value) => (value ? new Date(value).toLocaleString('en-BD') : '—')
const percent = (value) => `${Number(value || 0).toFixed(2)}%`
const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

export function InvestorDirectoryPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [activeInvestments, setActiveInvestments] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [approvingId, setApprovingId] = useState(null)
  const [analytics, setAnalytics] = useState(null)

  const load = useCallback(async () => {
    try {
      const [userData, requestData, investmentData, analyticsData] = await Promise.all([
        apiRequest('/users'),
        apiRequest('/investments/requests/pending'),
        apiRequest('/investments/active'),
        apiRequest('/analytics/investor'),
      ])
      setUsers(userData.filter((member) => member.role === 'INVESTOR'))
      setPendingRequests(requestData)
      setActiveInvestments(investmentData)
      setAnalytics(analyticsData)
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const investors = useMemo(
    () =>
      users.map((investor) => {
        const requests = pendingRequests.filter(
          (request) => request.investorEmail === investor.email,
        )
        const investments = activeInvestments.filter(
          (investment) => investment.investorEmail === investor.email,
        )
        return {
          ...investor,
          requests,
          investments,
          pendingAmount: requests.reduce((sum, request) => sum + Number(request.amount), 0),
          activeAmount: investments.reduce((sum, investment) => sum + Number(investment.amount), 0),
        }
      }),
    [activeInvestments, pendingRequests, users],
  )

  const visibleInvestors = investors.filter((investor) =>
    `${investor.fullName} ${investor.email}`.toLowerCase().includes(search.trim().toLowerCase()),
  )
  const selected = investors.find((investor) => investor.id === selectedId)
  const totalActiveCapital = investors.reduce((sum, investor) => sum + investor.activeAmount, 0)
  const totalPendingCapital = investors.reduce((sum, investor) => sum + investor.pendingAmount, 0)
  const netProfit = Number(analytics?.netProfit || 0)
  const latestInvestment = [...activeInvestments].sort(
    (first, second) => new Date(second.investedAt) - new Date(first.investedAt),
  )[0]

  async function approve(request) {
    if (
      !window.confirm(
        `Approve ${money(request.amount)} from ${request.investorName}? Only approved investments are added to active capital.`,
      )
    )
      return
    setApprovingId(request.id)
    setError('')
    setNotice('')
    try {
      await apiRequest(`/investments/requests/${request.id}/approve`, { method: 'POST' })
      setNotice(`${money(request.amount)} from ${request.investorName} is now active capital.`)
      window.dispatchEvent(new Event('financial-platform-investments-updated'))
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setApprovingId(null)
    }
  }

  async function decline(request) {
    if (!window.confirm(`Delete the pending request of ${money(request.amount)}?`)) return
    setError('')
    setNotice('')
    try {
      await apiRequest(`/investments/requests/${request.id}`, { method: 'DELETE' })
      setNotice('The investment request was declined and removed.')
      window.dispatchEvent(new Event('financial-platform-investments-updated'))
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="page-stack investor-directory-page">
      <section className="investor-directory-overview">
        <div className="investor-heading">
          <div>
            <p className="eyebrow">Investor management</p>
            <h1>Investor overview</h1>
            <p>Review the financial information and experience provided to your investors.</p>
          </div>
          <span className="investor-access-badge"><i /> Verified access</span>
        </div>

        {analytics && (
          <>
            <section className="investor-portfolio-hero" aria-label="Investor financial summary">
              <div className="investor-portfolio-main">
                <span>Approved investor capital</span>
                <strong>{money(analytics.initialCapital)}</strong>
                <p>Capital currently approved for the business</p>
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
                <div className="investor-health-track"><i style={{ width: `${Math.min(Math.max(Number(analytics.capitalHealthPercentage), 0), 100)}%` }} /></div>
              </div>
            </section>

            <section className="investor-business-grid" aria-label="Investor transparency summary">
              <article><span>↗</span><div><small>Total business revenue</small><strong>{money(analytics.totalRevenue)}</strong><p>Income generated from recorded sales.</p></div></article>
              <article><span>↘</span><div><small>Operating expenses</small><strong>{money(analytics.totalExpenses)}</strong><p>Recorded costs required to run the business.</p></div></article>
              <article><span>◎</span><div><small>Approved capital</small><strong>{money(analytics.initialCapital)}</strong><p>Visible to investors for transparency.</p></div></article>
              <article><span>✓</span><div><small>Latest portfolio activity</small><strong>{latestInvestment ? dateTime(latestInvestment.investedAt).split(',')[0] : 'No activity yet'}</strong><p>{latestInvestment ? `${money(latestInvestment.amount)} approved investment` : 'Approved investments will appear here.'}</p></div></article>
            </section>
          </>
        )}
      </section>

      <header className="investor-directory-heading">
        <div>
          <p className="eyebrow">Owner workspace</p>
          <h1>Investor profiles</h1>
          <p>See who is investing, review requests, and track approved capital separately.</p>
        </div>
        <div className="investor-directory-summary">
          <span>
            <small>Approved capital</small>
            <strong>{money(totalActiveCapital)}</strong>
          </span>
          <span>
            <small>Waiting for approval</small>
            <strong>{money(totalPendingCapital)}</strong>
          </span>
        </div>
      </header>

      <div className="investor-directory-toolbar">
        <div>
          <strong>{investors.length}</strong>
          <span>Registered investors</span>
        </div>
        <label>
          <span>Search investors</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name or email"
          />
        </label>
      </div>

      {error && <p className="error-message">{error}</p>}
      {notice && <p className="success-message">{notice}</p>}

      <section className="investor-profile-grid" aria-label="Investor profiles">
        {visibleInvestors.map((investor) => (
          <button
            type="button"
            key={investor.id}
            className={`investor-profile-card${selectedId === investor.id ? ' selected' : ''}`}
            onClick={() =>
              setSelectedId((current) => (current === investor.id ? null : investor.id))
            }
          >
            <span className="investor-profile-avatar">{initials(investor.fullName)}</span>
            <div className="investor-profile-identity">
              <span className={investor.activeAmount > 0 ? 'active' : 'waiting'}>
                {investor.activeAmount > 0 ? 'Active investor' : 'No active capital'}
              </span>
              <strong>{investor.fullName}</strong>
              <small>{investor.email}</small>
            </div>
            <dl>
              <div>
                <dt>Approved</dt>
                <dd>{money(investor.activeAmount)}</dd>
              </div>
              <div>
                <dt>Pending</dt>
                <dd>{money(investor.pendingAmount)}</dd>
              </div>
              <div>
                <dt>Packages</dt>
                <dd>{investor.investments.length}</dd>
              </div>
            </dl>
            <em>Open investor details →</em>
          </button>
        ))}
        {visibleInvestors.length === 0 && (
          <div className="panel investor-directory-empty">No investors match this search.</div>
        )}
      </section>

      {selected && (
        <aside className="panel investor-profile-detail">
          <button
            type="button"
            className="employee-detail-close"
            onClick={() => setSelectedId(null)}
          >
            ×
          </button>
          <div className="investor-detail-header">
            <span>{initials(selected.fullName)}</span>
            <div>
              <p className="eyebrow">Investor account</p>
              <h2>{selected.fullName}</h2>
              <p>{selected.email}</p>
            </div>
            <button type="button" onClick={() => navigate(`/profile/${selected.id}`)}>
              View personal profile
            </button>
          </div>

          <div className="investor-capital-breakdown">
            <article>
              <small>Approved and active</small>
              <strong>{money(selected.activeAmount)}</strong>
              <p>This amount is included in business capital.</p>
            </article>
            <article>
              <small>Pending owner decision</small>
              <strong>{money(selected.pendingAmount)}</strong>
              <p>This amount is not counted until you approve it.</p>
            </article>
          </div>

          <div className="investor-request-list">
            <div>
              <p className="eyebrow">Approval queue</p>
              <h3>Pending investment requests</h3>
            </div>
            {selected.requests.map((request) => (
              <article key={request.id}>
                <div>
                  <strong>{money(request.amount)}</strong>
                  <small>Requested {dateTime(request.requestedAt)}</small>
                </div>
                <div>
                  <button
                    type="button"
                    disabled={approvingId === request.id}
                    onClick={() => approve(request)}
                  >
                    {approvingId === request.id ? 'Approving…' : 'Approve and add'}
                  </button>
                  <button type="button" className="danger" onClick={() => decline(request)}>
                    Decline
                  </button>
                </div>
              </article>
            ))}
            {selected.requests.length === 0 && (
              <p className="investor-no-requests">No pending requests.</p>
            )}
          </div>
        </aside>
      )}
    </div>
  )
}
