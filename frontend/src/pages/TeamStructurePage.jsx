import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'

const shifts = ['Shift 1', 'Shift 2']
const money = (value) => `৳${Number(value).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const initials = (name) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

export function TeamStructurePage() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [error, setError] = useState('')
  const selected = employees.find((employee) => employee.id === selectedId)
  const load = useCallback(async () => {
    try {
      const result = await apiRequest('/employees')
      setEmployees(result)
      setSelectedId((current) => result.some((item) => item.id === current) ? current : null)
      setError('')
    } catch (requestError) {
      setError(requestError.message.includes('404') ? 'Employee service is not available yet. Restart the Spring Boot backend in IntelliJ, then refresh this page.' : requestError.message)
    }
  }, [])
  useEffect(() => { load() }, [load])

  async function remove(employee) {
    if (!window.confirm(`Delete ${employee.name} from the employee directory?`)) return
    try { await apiRequest(`/employees/${employee.id}`, { method: 'DELETE' }); await load() }
    catch (requestError) { setError(requestError.message) }
  }

  return <div className="page-stack team-page">
    <div className="team-page-header"><div><p className="eyebrow">People operations</p><h1>Team structure</h1><p>Manage employee profiles and assign every team member to one of two shifts.</p></div><button type="button" onClick={() => navigate('/team/new')}>+ Add employee</button></div>
    {error && <p className="error-message" role="alert">{error}</p>}
    <div className="team-workspace">
      <section className="employee-directory" aria-label="Employees by shift">
        {shifts.map((shift, shiftIndex) => {
          const shiftEmployees = employees.filter((employee) => employee.shift === shift)
          return <div className={`shift-section shift-${shiftIndex + 1}`} key={shift}><header><div><span>{shiftIndex + 1}</span><div><strong>{shift}</strong><small>{shiftEmployees.length} employee{shiftEmployees.length === 1 ? '' : 's'}</small></div></div><em>{shiftIndex === 0 ? 'Primary team' : 'Secondary team'}</em></header><div className="shift-employee-list">{shiftEmployees.map((employee) => <button type="button" className={`employee-card${selectedId === employee.id ? ' selected' : ''}`} key={employee.id} onClick={() => setSelectedId((current) => current === employee.id ? null : employee.id)}><span>{initials(employee.name)}</span><div><strong>{employee.name}</strong><small>{employee.position}</small><em>{employee.phone}</em></div></button>)}<button type="button" className="empty-shift" onClick={() => navigate(`/team/new?shift=${encodeURIComponent(shift)}`)}>+ Add an employee to {shift}</button></div></div>
        })}
      </section>
      {selected && <aside className="panel employee-detail"><button className="employee-detail-close" type="button" onClick={() => setSelectedId(null)} aria-label="Close employee profile">×</button><div className="employee-detail-hero"><span>{initials(selected.name)}</span><div><p className="eyebrow">Employee profile</p><h2>{selected.name}</h2><p>{selected.position}</p></div></div><dl><div><dt>Phone number</dt><dd>{selected.phone}</dd></div><div><dt>NID</dt><dd>{selected.nid}</dd></div><div><dt>Address</dt><dd>{selected.address}</dd></div><div><dt>Shift</dt><dd>{selected.shift}</dd></div><div><dt>Monthly salary</dt><dd>{money(selected.salary)}</dd></div><div><dt>Joining date</dt><dd>{new Date(`${selected.joiningDate}T00:00:00`).toLocaleDateString()}</dd></div></dl><div className="employee-detail-actions"><button type="button" onClick={() => navigate(`/team/${selected.id}/edit`)}>Edit information</button><button type="button" className="danger" onClick={() => remove(selected)}>Delete</button></div></aside>}
    </div>
  </div>
}
