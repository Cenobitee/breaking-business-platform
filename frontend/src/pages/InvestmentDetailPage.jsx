import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest } from '../api/client'

const money = (value) => `৳${Number(value || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const percent = (value) => `${Number(value || 0).toFixed(2)}%`
const dateTime = (value) => (value ? new Date(value).toLocaleString('en-BD') : '—')

export function InvestmentDetailPage() {
  const { cycleId } = useParams()
  const [cycle, setCycle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await apiRequest('/investments/me')
      const selected = (data.cycles || []).find((item) => Number(item.id) === Number(cycleId))
      if (!selected) throw new Error('Investment not found')
      setCycle(selected)
      setError('')
    } catch (requestError) { setError(requestError.message) }
    finally { setLoading(false) }
  }, [cycleId])

  useEffect(() => {
    load()
    const intervalId = window.setInterval(load, 10000)
    return () => window.clearInterval(intervalId)
  }, [load])

  async function withdraw() {
    if (!window.confirm(`Withdraw ${money(cycle.settlementTotal)} after maturity?`)) return
    setWithdrawing(true); setError('')
    try {
      await apiRequest(`/investments/cycles/${cycle.id}/withdraw`, { method: 'POST' })
      setNotice('Your matured principal and profit were withdrawn successfully.')
      window.dispatchEvent(new Event('financial-platform-investments-updated'))
      await load()
    } catch (requestError) { setError(requestError.message) }
    finally { setWithdrawing(false) }
  }

  if (loading) return <p>Loading investment…</p>
  if (!cycle) return <div className="panel"><p className="error-message">{error || 'Investment not found'}</p><Link to="/investor">Return to dashboard</Link></div>

  const duration = new Date(cycle.endsAt) - new Date(cycle.startsAt)
  const elapsed = Date.now() - new Date(cycle.startsAt).getTime()
  const progress = cycle.status === 'ACTIVE' ? Math.min(100, Math.max(0, (elapsed / duration) * 100)) : 100
  const maximumProfit = Number(cycle.estimatedMaxReturn) - Number(cycle.principal)
  const capProgress = maximumProfit > 0 ? Math.min(100, (Number(cycle.investorProfit) / maximumProfit) * 100) : 0

  return (
    <div className="page-stack investment-detail-page">
      <header className="investment-detail-header"><div><p className="eyebrow">Individual investment tracker</p><h1>{cycle.projectName}</h1><p>{cycle.purpose}</p></div><span className={`role-label status-${cycle.status.toLowerCase()}`}>{cycle.status}</span></header>
      {error && <p className="error-message">{error}</p>}{notice && <p className="success-message">{notice}</p>}
      <section className="investment-detail-hero">
        <div><small>Your invested principal</small><strong>{money(cycle.principal)}</strong><span>{cycle.quantity} investment {cycle.quantity === 1 ? 'unit' : 'units'}</span></div>
        <div><small>Live verified profit</small><strong>{money(cycle.investorProfit)}</strong><span>Maximum estimate {money(maximumProfit)}</span></div>
        <div><small>Current maturity value</small><strong>{money(cycle.settlementTotal)}</strong><span>Principal plus verified profit</span></div>
      </section>
      <section className="panel investment-detail-progress">
        <div className="panel-title-row"><div><p className="eyebrow">Tenure progress</p><h2>{progress.toFixed(0)}% complete</h2></div><strong>{dateTime(cycle.endsAt)}</strong></div>
        <div className="cycle-progress"><i style={{ width: `${progress}%` }} /></div><div className="investment-detail-dates"><span>Approved {dateTime(cycle.startsAt)}</span><span>Matures {dateTime(cycle.endsAt)}</span></div><p className="investment-lock-message">🔒 Principal and profit remain locked until maturity.</p>
      </section>
      <section className="investment-detail-grid">
        <article className="panel"><p className="eyebrow">Live product performance</p><h2>{cycle.linkedProducts?.join(', ') || 'Linked business products'}</h2><dl><div><dt>Verified sales after approval</dt><dd>{money(cycle.eligibleRevenue)}</dd></div><div><dt>Cost of sold products</dt><dd>− {money(cycle.eligibleExpenses)}</dd></div><div><dt>Profit after 5% reserve</dt><dd>{money(cycle.distributableProfit)}</dd></div><div><dt>Your unit share</dt><dd>{percent(cycle.capitalSharePercentage)}</dd></div></dl></article>
        <article className="panel"><p className="eyebrow">Earnings protection</p><h2>{money(cycle.investorProfit)} of {money(maximumProfit)} maximum</h2><div className="investment-cap-track"><i style={{ width: `${capProgress}%` }} /></div><p>Estimated maturity range: {money(cycle.estimatedMinReturn)}–{money(cycle.estimatedMaxReturn)}.</p><p>Profit stops increasing after reaching the maximum offered earnings.</p></article>
      </section>
      <section className="panel investment-detail-withdrawal"><div><p className="eyebrow">Maturity withdrawal</p><h2>{cycle.status === 'WITHDRAWN' ? 'Return withdrawn' : cycle.withdrawalAvailable ? 'Your return is ready' : 'Withdrawal is locked'}</h2><p>{cycle.status === 'WITHDRAWN' ? `Withdrawn ${dateTime(cycle.withdrawnAt)}.` : cycle.withdrawalAvailable ? 'The tenure has ended. You may withdraw the finalized principal and profit.' : `Available after ${dateTime(cycle.endsAt)}.`}</p></div>{cycle.withdrawalAvailable && <button type="button" disabled={withdrawing} onClick={withdraw}>{withdrawing ? 'Withdrawing…' : `Withdraw ${money(cycle.settlementTotal)}`}</button>}</section>
    </div>
  )
}
