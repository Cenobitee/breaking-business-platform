import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../api/client'

const shifts = ['Shift 1', 'Shift 2']
const emptyForm = { name: '', position: '', address: '', nid: '', phone: '', shift: '', salary: '', joiningDate: '' }

export function EmployeeFormPage() {
  const navigate = useNavigate()
  const { employeeId } = useParams()
  const [searchParams] = useSearchParams()
  const editing = Boolean(employeeId)
  const [form, setForm] = useState({ ...emptyForm, shift: searchParams.get('shift') || '' })
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!editing) return
    apiRequest('/employees').then((employees) => {
      const employee = employees.find((item) => item.id === Number(employeeId))
      if (!employee) throw new Error('Employee not found')
      setForm({ name: employee.name, position: employee.position, address: employee.address, nid: employee.nid, phone: employee.phone, shift: employee.shift, salary: employee.salary, joiningDate: employee.joiningDate })
    }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }, [editing, employeeId])
  async function save(event) {
    event.preventDefault(); setSaving(true); setError('')
    try {
      await apiRequest(editing ? `/employees/${employeeId}` : '/employees', { method: editing ? 'PUT' : 'POST', body: JSON.stringify({ ...form, salary: Number(form.salary) }) })
      navigate('/team')
    } catch (requestError) { setError(requestError.message) } finally { setSaving(false) }
  }
  if (loading) return <p>Loading employee information…</p>
  return <div className="employee-form-page"><button type="button" className="employee-back-button" onClick={() => navigate('/team')}>← Back to team structure</button><section className="panel employee-form-card"><div><p className="eyebrow">Employee record</p><h1>{editing ? 'Edit employee information' : 'Add a new employee'}</h1><p>Complete the employment and personal details below.</p></div>{error && <p className="error-message" role="alert">{error}</p>}<form className="employee-form" onSubmit={save}>
    <label>Full name<input required maxLength="120" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Position<input required maxLength="120" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></label><label>Phone number<input required maxLength="40" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label>NID<input required maxLength="40" value={form.nid} onChange={(e) => setForm({ ...form, nid: e.target.value })} /></label><label>Assign shift<select required value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}><option value="">Choose a shift</option>{shifts.map((shift) => <option key={shift}>{shift}</option>)}</select></label><label>Monthly salary (৳)<input required type="number" min="0" step="0.01" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></label><label>Joining date<input required type="date" max={new Date().toISOString().slice(0, 10)} value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} /></label><label className="employee-address">Address<textarea required rows="3" maxLength="300" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label><div className="employee-form-actions"><button type="button" className="secondary" onClick={() => navigate('/team')}>Cancel</button><button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add employee'}</button></div>
  </form></section></div>
}
