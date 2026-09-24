import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../api/client'

const money = (value) => `৳${Number(value).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' })

export function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [form, setForm] = useState({ description: '', amount: '', incurredOn: today(), category: 'OTHER' })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    try { setExpenses(await apiRequest('/expenses')); setError('') }
    catch (requestError) { setError(requestError.message) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const totals = useMemo(() => ({
    all: expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    today: expenses.filter((expense) => expense.incurredOn === today()).reduce((sum, expense) => sum + Number(expense.amount), 0),
  }), [expenses])

  async function addExpense(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('')
    try {
      await apiRequest(editingId ? `/expenses/${editingId}` : '/expenses', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify({ ...form, amount: Number(form.amount) }) })
      setForm({ description: '', amount: '', incurredOn: today(), category: 'OTHER' }); setEditingId(null); await load()
      window.dispatchEvent(new Event('financial-platform-expenses-updated'))
      setNotice(editingId ? 'Expense corrected. The original remains in the audit trail.' : 'Expense recorded. Analytics and business health have been recalculated.')
    } catch (requestError) { setError(requestError.message) }
    finally { setSaving(false) }
  }

  function editExpense(expense) {
    setEditingId(expense.id); setForm({ description: expense.description, amount: expense.amount, incurredOn: expense.incurredOn, category: expense.category }); setError(''); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteExpense(expense) {
    if (!window.confirm(`Delete “${expense.description}” costing ${money(expense.amount)}?`)) return
    setDeletingId(expense.id); setError(''); setNotice('')
    try {
      await apiRequest(`/expenses/${expense.id}`, { method: 'DELETE' }); await load()
      window.dispatchEvent(new Event('financial-platform-expenses-updated'))
      setNotice('Expense removed from active totals. Its audit cancellation record was preserved.')
    } catch (requestError) { setError(requestError.message) }
    finally { setDeletingId(null) }
  }

  if (loading) return <p>Loading expenses…</p>
  return <div className="page-stack expenses-page">
    <div><p className="eyebrow">Cost control</p><h1>Expense management</h1><p>Record operating costs and keep financial indicators accurate.</p></div>
    {error && <p className="error-message" role="alert">{error}</p>}
    {notice && <p className="success-message" role="status">{notice}</p>}
    <section className="expense-summary-grid"><article><small>Today’s expenses</small><strong>{money(totals.today)}</strong></article><article><small>Total recorded expenses</small><strong>{money(totals.all)}</strong></article><article><small>Active expense records</small><strong>{expenses.length}</strong></article></section>
    <section className="panel expense-entry-panel"><div><p className="eyebrow">{editingId ? 'Correct expense' : 'New expense'}</p><h2>{editingId ? 'Update expense details' : 'Add expense details'}</h2><p>Describe the cost, choose a category, enter its exact amount, and select when it occurred.</p></div><form onSubmit={addExpense}><label>Expense details<input required maxLength="240" placeholder="Example: Electricity bill" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="RENT">Rent</option><option value="SALARIES">Salaries</option><option value="UTILITIES">Utilities</option><option value="MARKETING">Marketing</option><option value="SUPPLIES">Supplies</option><option value="TRANSPORT">Transport</option><option value="OTHER">Other</option></select></label><label>Cost (৳)<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label><label>Expense date<input required type="date" max={today()} value={form.incurredOn} onChange={(event) => setForm({ ...form, incurredOn: event.target.value })} /></label><button type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save correction' : 'Record expense'}</button>{editingId && <button type="button" className="secondary" onClick={() => { setEditingId(null); setForm({ description: '', amount: '', incurredOn: today(), category: 'OTHER' }) }}>Cancel</button>}</form></section>
    <section className="panel"><div className="panel-title-row"><div><p className="eyebrow">Expense history</p><h2>Recorded costs</h2></div><span>{expenses.length} records</span></div><div className="table-scroll"><table><thead><tr><th>Date</th><th>Category</th><th>Details</th><th>Cost</th><th>Recorded by</th><th>Recorded at</th><th>Action</th></tr></thead><tbody>{expenses.map((expense) => <tr key={expense.id}><td>{expense.incurredOn}</td><td>{expense.category}</td><td><strong>{expense.description}</strong></td><td>{money(expense.amount)}</td><td>{expense.createdBy}</td><td>{new Date(expense.createdAt).toLocaleString()}</td><td><div className="table-actions"><button type="button" className="secondary table-action" onClick={() => editExpense(expense)}>Edit</button><button type="button" className="danger table-action" disabled={deletingId === expense.id} onClick={() => deleteExpense(expense)}>{deletingId === expense.id ? 'Deleting…' : 'Delete'}</button></div></td></tr>)}{!expenses.length && <tr><td colSpan="7">No expenses recorded yet.</td></tr>}</tbody></table></div></section>
  </div>
}
