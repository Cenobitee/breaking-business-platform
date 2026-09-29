import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'

const money = (value) =>
  `৳${Number(value || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const dateTime = (value) => (value ? new Date(value).toLocaleString('en-BD') : '—')
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

  const load = useCallback(async () => {
    try {
      const [userData, requestData, investmentData] = await Promise.all([
        apiRequest('/users'),
        apiRequest('/investments/requests/pending'),
        apiRequest('/investments/active'),
      ])
      setUsers(userData.filter((member) => member.role === 'INVESTOR'))
      setPendingRequests(requestData)
      setActiveInvestments(investmentData)
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
