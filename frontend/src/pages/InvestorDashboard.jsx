import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
  const [products, setProducts] = useState([])
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [changingVisibilityId, setChangingVisibilityId] = useState(null)
  const [editingPackage, setEditingPackage] = useState(null)
  const [deletingPackageId, setDeletingPackageId] = useState(null)

  const load = useCallback(async () => {
    try {
      const [analyticsData, investmentData, packageData, productData] = await Promise.all([
        apiRequest('/analytics/investor'),
        isInvestor ? apiRequest('/investments/me') : Promise.resolve(null),
        apiRequest('/investments/packages'),
        isInvestor ? Promise.resolve([]) : apiRequest('/products'),
      ])
      setAnalytics(analyticsData)
      setInvestments(investmentData)
      setPackages(packageData)
      setProducts(productData)
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
    if (amount && !packages.some((item) => Number(item.id) === Number(amount))) {
      setAmount('')
      setQuantity(1)
    }
  }, [amount, packages])

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
      (investmentPackage) => Number(investmentPackage.id) === Number(amount),
    )
    if (!selectedPackage) return
    navigate('/investor/payment', {
      state: { investmentPackage: selectedPackage, quantity },
    })
  }

  async function updatePackage(investmentPackage, form) {
    setError('')
    setNotice('')
    try {
      await apiRequest(`/investments/packages/${investmentPackage.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          amount: Number(form.amount.value),
          earningMinPercentage: Number(form.minimum.value),
          earningMaxPercentage: Number(form.maximum.value),
          durationMonths: Number(form.duration.value),
          totalUnits: Number(form.units.value),
          projectName: form.projectName.value,
          purpose: form.purpose.value,
          fundingTarget: Number(form.fundingTarget.value),
          productIds: Array.from(form.querySelectorAll('input[name="productIds"]:checked')).map(
            (input) => Number(input.value),
          ),
          active: investmentPackage.active,
        }),
      })
      setNotice(`${money(investmentPackage.amount)} unit offer updated.`)
      await load()
      setEditingPackage(null)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function publishPackage(event) {
    event.preventDefault()
    const form = event.currentTarget
    setPublishing(true)
    setError('')
    setNotice('')
    try {
      await apiRequest('/investments/packages', {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(form.amount.value),
          earningMinPercentage: Number(form.minimum.value),
          earningMaxPercentage: Number(form.maximum.value),
          durationMonths: Number(form.duration.value),
          totalUnits: Number(form.units.value),
          projectName: form.projectName.value,
          purpose: form.purpose.value,
          fundingTarget: Number(form.fundingTarget.value),
          productIds: Array.from(form.querySelectorAll('input[name="productIds"]:checked')).map(
            (input) => Number(input.value),
          ),
          active: form.active.checked,
        }),
      })
      form.reset()
      setNotice('Investment opportunity posted successfully.')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setPublishing(false)
    }
  }

  async function changePackageVisibility(investmentPackage) {
    setChangingVisibilityId(investmentPackage.id)
    setError('')
    setNotice('')
    try {
      await apiRequest(`/investments/packages/${investmentPackage.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          amount: investmentPackage.amount,
          earningMinPercentage: investmentPackage.earningMinPercentage,
          earningMaxPercentage: investmentPackage.earningMaxPercentage,
          durationMonths: investmentPackage.durationMonths,
          totalUnits: investmentPackage.totalUnits,
          projectName: investmentPackage.projectName,
          purpose: investmentPackage.purpose,
          fundingTarget: investmentPackage.fundingTarget,
          productIds: investmentPackage.productIds || [],
          active: !investmentPackage.active,
        }),
      })
      setNotice(
        `${investmentPackage.projectName} is now ${investmentPackage.active ? 'inactive and hidden from investors' : 'active and visible to investors'}.`,
      )
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setChangingVisibilityId(null)
    }
  }

  async function deletePackage(investmentPackage) {
    if (!window.confirm(`Delete “${investmentPackage.projectName}”? This cannot be undone.`)) return
    setDeletingPackageId(investmentPackage.id)
    setError('')
    setNotice('')
    try {
      await apiRequest(`/investments/packages/${investmentPackage.id}`, { method: 'DELETE' })
      setNotice(`${investmentPackage.projectName} was deleted.`)
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDeletingPackageId(null)
    }
  }

  const totalInvested = Number(investments?.totalInvested || 0)
  const approvedCapital = Number(analytics?.initialCapital || 0)
  const netProfit = Number(analytics?.netProfit || 0)
  const capitalShare = approvedCapital > 0 ? (totalInvested / approvedCapital) * 100 : 0
  const pendingRequests = (investments?.requests || []).filter(
    (request) => request.status === 'PENDING',
  )
  const latestRequest = (investments?.requests || [])[0]
  const latestActivity = (investments?.history || [])[0]
  const investmentCycles = investments?.cycles || []
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
              : 'Investment packages',
            description: isInvestor
              ? 'Track your capital and the financial progress of the business in one secure place.'
              : 'Create, publish, edit, and manage opportunities shown to investors.',
          }

  return (
    <div className="page-stack investor-dashboard">
      <div className="investor-heading">
        <div>
          <p className="eyebrow">{pageContent.eyebrow}</p>
          <h1>{pageContent.title}</h1>
          <p>{pageContent.description}</p>
        </div>
        <div className="investor-header-actions">
          {isInvestor && (
            <div className="compact-approval-tracker">
              <small>Approval tracker</small>
              <strong>
                {pendingRequests.length
                  ? `${pendingRequests.length} pending`
                  : latestRequest
                    ? latestRequest.status
                    : 'No requests'}
              </strong>
              {latestRequest && <span>{money(latestRequest.amount)}</span>}
            </div>
          )}
          <span className="investor-access-badge">
            <i /> Verified access
          </span>
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
      {!analytics && !error && <p>Loading investor analytics…</p>}
      {analytics && (
        <>
          {isInvestor && view === 'overview' && (
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
            <section className="panel investment-cycle-panel">
              <div className="panel-title-row">
                <div>
                  <p className="eyebrow">Fixed investment periods</p>
                  <h2>Your investment cycles</h2>
                </div>
                <span className="investor-return-rate">
                  {investmentCycles.length} {investmentCycles.length === 1 ? 'cycle' : 'cycles'}
                </span>
              </div>
              <p>Quick view of your approved investments.</p>
              <div className="investment-cycle-grid">
                {investmentCycles.map((cycle) => {
                  const duration = new Date(cycle.endsAt) - new Date(cycle.startsAt)
                  const elapsed = Date.now() - new Date(cycle.startsAt).getTime()
                  const progress =
                    cycle.status === 'COMPLETED'
                      ? 100
                      : Math.min(100, Math.max(0, (elapsed / duration) * 100))
                  return (
                    <article key={cycle.id} className="investment-cycle-card">
                      <div className="investment-cycle-card-heading">
                        <div>
                          <small>
                            {cycle.status === 'WITHDRAWN'
                              ? 'Return withdrawn'
                              : cycle.status === 'COMPLETED'
                                ? 'Ready to withdraw'
                                : 'Live product-sales estimate'}
                          </small>
                          <strong>{cycle.projectName}</strong>
                          <span>{money(cycle.principal)} invested</span>
                        </div>
                        <span className={`role-label status-${cycle.status.toLowerCase()}`}>
                          {cycle.status}
                        </span>
                      </div>
                      <div
                        className="cycle-progress"
                        aria-label={`${progress.toFixed(0)} percent complete`}
                      >
                        <i style={{ width: `${progress}%` }} />
                      </div>
                      <div className="cycle-compact-date">
                        <span>Matures</span><strong>{dateTime(cycle.endsAt).split(',')[0]}</strong>
                      </div>
                      <dl className="cycle-compact-metrics">
                        <div><dt>Live profit</dt><dd>{money(cycle.investorProfit)}</dd></div>
                        <div><dt>Current return</dt><dd>{money(cycle.settlementTotal)}</dd></div>
                      </dl>
                      <Link className="cycle-view-details" to={`/investor/investments/${cycle.id}`}>
                        View investment details →
                      </Link>
                    </article>
                  )
                })}
                {investmentCycles.length === 0 && <p>No approved investment cycle yet.</p>}
              </div>
            </section>
          )}

          {isInvestor && view === 'overview' && (
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
                    <p>
                      {amount
                        ? `${money(packages.find((item) => Number(item.id) === Number(amount))?.amount)} selected per unit`
                        : 'Choose an opportunity from the list below.'}
                    </p>
                  </div>
                  {amount && (
                    <form className="investment-request-form" onSubmit={requestInvestment}>
                      <label>
                        Quantity
                        <input
                          type="number"
                          min="1"
                          max={
                            packages.find((item) => Number(item.id) === Number(amount))
                              ?.remainingUnits || 1
                          }
                          value={quantity}
                          onChange={(event) => setQuantity(Number(event.target.value))}
                          required
                        />
                      </label>
                      <button type="submit" disabled={submitting}>
                        {submitting ? 'Opening payment…' : 'Continue to payment'}
                      </button>
                    </form>
                  )}
                </section>
              )}

              {view === 'investments' && (
                <section className="investment-opportunities-panel">
                  <div className="panel-title-row">
                    <div>
                      <p className="eyebrow">Available opportunities</p>
                      <h2>Choose an investment unit</h2>
                    </div>
                    <small>Scroll to view all ↓</small>
                  </div>
                  <div
                    className="investment-package-options investment-project-feed"
                    role="radiogroup"
                    aria-label="Investment package"
                  >
                    {packages.map((investmentPackage) => {
                      const minimumProfit =
                        (Number(investmentPackage.amount) *
                          Number(investmentPackage.earningMinPercentage)) /
                        100
                      const maximumProfit =
                        (Number(investmentPackage.amount) *
                          Number(investmentPackage.earningMaxPercentage)) /
                        100
                      const funded = Number(investmentPackage.fundedAmount || 0)
                      const target = Number(investmentPackage.fundingTarget || 0)
                      const progress = target ? Math.min(100, (funded / target) * 100) : 0
                      return (
                        <button
                          type="button"
                          key={investmentPackage.id}
                          aria-pressed={Number(amount) === Number(investmentPackage.id)}
                          title="Click to select. Double-click to clear selection."
                          className={`investment-project-card${Number(amount) === Number(investmentPackage.id) ? ' selected' : ''}`}
                          onClick={() => {
                            setAmount(String(investmentPackage.id))
                            setQuantity(1)
                          }}
                          onDoubleClick={() => {
                            setAmount('')
                            setQuantity(1)
                          }}
                        >
                          <div className="investment-project-card-top">
                            <div>
                              <span className="investment-project-type">Live opportunity</span>
                              <h3>{investmentPackage.projectName}</h3>
                            </div>
                            <span
                              className={`project-selection-indicator${Number(amount) === Number(investmentPackage.id) ? ' checked' : ''}`}
                              aria-hidden="true"
                            >
                              {Number(amount) === Number(investmentPackage.id) ? '✓' : ''}
                            </span>
                          </div>
                          <div className="investment-project-description">
                            <small>About this project</small>
                            <p>{investmentPackage.purpose}</p>
                          </div>
                          <div className="investment-project-products">
                            <small>Profit-linked products</small>
                            <strong>{investmentPackage.productNames?.join(', ') || 'Business products specified by owner'}</strong>
                          </div>
                          <div className="investment-project-funding">
                            <div><span>Funded {money(funded)}</span><span>Target {money(target)}</span></div>
                            <i><b style={{ width: `${progress}%` }} /></i>
                          </div>
                          <dl>
                            <div><dt>Per unit</dt><dd>{money(investmentPackage.amount)}</dd></div>
                            <div><dt>Estimated profit</dt><dd>{money(minimumProfit)}–{money(maximumProfit)}</dd><small>{percent(investmentPackage.earningMinPercentage)}–{percent(investmentPackage.earningMaxPercentage)}</small></div>
                            <div><dt>Total at maturity</dt><dd>{money(Number(investmentPackage.amount) + minimumProfit)}–{money(Number(investmentPackage.amount) + maximumProfit)}</dd></div>
                            <div><dt>Project duration</dt><dd>{investmentPackage.durationMonths} months</dd></div>
                            <div><dt>Units remaining</dt><dd>{investmentPackage.remainingUnits} of {investmentPackage.totalUnits}</dd></div>
                          </dl>
                          <div className="investment-project-card-footer">
                            <span>Profit tracking starts after owner approval</span>
                            <strong>{Number(amount) === Number(investmentPackage.id) ? 'Selected ✓' : 'Select investment'}</strong>
                          </div>
                        </button>
                      )
                    })}
                    {!packages.length && (
                      <p className="investment-empty-list">
                        No active investment opportunities are available right now.
                      </p>
                    )}
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
                  <h2>Post an investment opportunity</h2>
                  <p>Create one clear post. Active posts become visible in the investor feed.</p>
                </div>
              </div>
              <form className="investment-post-composer" onSubmit={publishPackage}>
                <label className="investment-post-wide">
                  Project name
                  <input name="projectName" maxLength="140" placeholder="Example: New pizza oven" required />
                </label>
                <label className="investment-post-wide">
                  What will this investment fund?
                  <textarea name="purpose" maxLength="500" rows="3" placeholder="Explain how the money will be used." required />
                </label>
                <label>Investment per unit (৳)<input name="amount" type="number" inputMode="decimal" step="any" placeholder="Enter any amount" required /></label>
                <label>Funding target (৳)<input name="fundingTarget" type="number" inputMode="decimal" step="any" placeholder="Enter any amount" required /></label>
                <label>Minimum earnings (%)<input name="minimum" type="number" min="0" max="100" step="0.01" required /></label>
                <label>Maximum earnings (%)<input name="maximum" type="number" min="0" max="100" step="0.01" required /></label>
                <label>Duration (months)<input name="duration" type="number" min="1" max="60" required /></label>
                <label>Total investment units<input name="units" type="number" min="1" required /></label>
                <details className="product-multiselect investment-post-wide">
                  <summary>Products connected to this project <span>Select products</span></summary>
                  <div>
                    {products.map((product) => (
                      <label key={product.id}><input name="productIds" type="checkbox" value={product.id} />{product.name}</label>
                    ))}
                    {!products.length && <small>Add products in Point of sale first.</small>}
                  </div>
                </details>
                <label className="investment-post-visibility investment-post-wide">
                  <input name="active" type="checkbox" defaultChecked />
                  <span><strong>Publish as active</strong><small>Investors can see and select this opportunity immediately.</small></span>
                </label>
                <button className="investment-post-wide" type="submit" disabled={publishing}>
                  {publishing ? 'Publishing…' : 'Post investment opportunity'}
                </button>
              </form>

              <div className="owner-investment-posts">
                <div className="owner-section-heading">
                  <div><p className="eyebrow">Published posts</p><h3>Your investment opportunities</h3></div>
                  <span>{packages.length} posts</span>
                </div>
                {packages.map((investmentPackage) => (
                  <article
                    key={investmentPackage.id}
                    className="owner-investment-post"
                    role="button"
                    tabIndex="0"
                    aria-label={`Edit ${investmentPackage.projectName}`}
                    onClick={() => setEditingPackage(investmentPackage)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setEditingPackage(investmentPackage)
                      }
                    }}
                  >
                    <div>
                      <span className={`investment-visibility-badge ${investmentPackage.active ? 'active' : 'inactive'}`}>
                        {investmentPackage.active ? 'Active' : 'Inactive'}
                      </span>
                      <h3>{investmentPackage.projectName}</h3>
                      <p>{investmentPackage.purpose}</p>
                    </div>
                    <dl>
                      <div><dt>Per unit</dt><dd>{money(investmentPackage.amount)}</dd></div>
                      <div><dt>Expected earnings</dt><dd>{percent(investmentPackage.earningMinPercentage)}–{percent(investmentPackage.earningMaxPercentage)}</dd></div>
                      <div><dt>Duration</dt><dd>{investmentPackage.durationMonths} months</dd></div>
                      <div><dt>Available</dt><dd>{investmentPackage.remainingUnits} units</dd></div>
                    </dl>
                    <div className="owner-investment-post-actions" onClick={(event) => event.stopPropagation()}>
                      <label className="investment-visibility-switch">
                        <span>{changingVisibilityId === investmentPackage.id ? 'Updating…' : investmentPackage.active ? 'Active' : 'Inactive'}</span>
                        <input
                          type="checkbox"
                          checked={investmentPackage.active}
                          disabled={changingVisibilityId === investmentPackage.id}
                          onChange={() => changePackageVisibility(investmentPackage)}
                          aria-label={`${investmentPackage.active ? 'Deactivate' : 'Activate'} ${investmentPackage.projectName}`}
                        />
                        <i aria-hidden="true" />
                      </label>
                      <button
                        type="button"
                        className="danger investment-post-delete"
                        disabled={deletingPackageId === investmentPackage.id}
                        onClick={() => deletePackage(investmentPackage)}
                      >
                        {deletingPackageId === investmentPackage.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </article>
                ))}
                {!packages.length && <p className="empty-state">Your published opportunities will appear here.</p>}
              </div>
              {editingPackage && (
                <div
                  className="investment-edit-modal-backdrop"
                  role="presentation"
                  onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setEditingPackage(null)
                  }}
                >
                  <section className="investment-edit-modal" role="dialog" aria-modal="true" aria-labelledby="investment-edit-title">
                    <div className="panel-title-row">
                      <div>
                        <p className="eyebrow">Edit investment post</p>
                        <h2 id="investment-edit-title">Correct opportunity details</h2>
                      </div>
                      <button type="button" className="secondary" onClick={() => setEditingPackage(null)}>Close</button>
                    </div>
                    <form
                      className="investment-post-composer"
                      onSubmit={(event) => {
                        event.preventDefault()
                        updatePackage(editingPackage, event.currentTarget)
                      }}
                    >
                      <label className="investment-post-wide">Project name<input name="projectName" maxLength="140" defaultValue={editingPackage.projectName} required /></label>
                      <label className="investment-post-wide">Funding purpose<textarea name="purpose" maxLength="500" rows="3" defaultValue={editingPackage.purpose} required /></label>
                      <label>Investment per unit (৳)<input name="amount" type="number" inputMode="decimal" step="any" defaultValue={Number(editingPackage.amount)} required /></label>
                      <label>Funding target (৳)<input name="fundingTarget" type="number" inputMode="decimal" step="any" defaultValue={Number(editingPackage.fundingTarget)} required /></label>
                      <label>Minimum earnings (%)<input name="minimum" type="number" min="0" max="100" step="0.01" defaultValue={Number(editingPackage.earningMinPercentage)} required /></label>
                      <label>Maximum earnings (%)<input name="maximum" type="number" min="0" max="100" step="0.01" defaultValue={Number(editingPackage.earningMaxPercentage)} required /></label>
                      <label>Duration (months)<input name="duration" type="number" min="1" max="60" defaultValue={editingPackage.durationMonths} required /></label>
                      <label>Total units<input name="units" type="number" min={editingPackage.totalUnits - editingPackage.remainingUnits || 1} defaultValue={editingPackage.totalUnits} required /></label>
                      <details className="product-multiselect investment-post-wide">
                        <summary>Products connected to this project <span>Select products</span></summary>
                        <div>
                          {products.map((product) => (
                            <label key={product.id}><input name="productIds" type="checkbox" value={product.id} defaultChecked={editingPackage.productIds?.includes(product.id)} />{product.name}</label>
                          ))}
                          {!products.length && <small>Add products in Point of sale first.</small>}
                        </div>
                      </details>
                      <div className="investment-edit-actions investment-post-wide">
                        <button type="button" className="secondary" onClick={() => setEditingPackage(null)}>Cancel</button>
                        <button type="submit">Save changes</button>
                      </div>
                    </form>
                  </section>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
