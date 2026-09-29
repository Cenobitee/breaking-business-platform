import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'

const shifts = ['Shift 1', 'Shift 2']
const money = (value) =>
  `৳${Number(value).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

function readSavedList(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

export function TeamQuickTools() {
  const [activeTool, setActiveTool] = useState(null)
  const [tasks, setTasks] = useState(() => readSavedList('team-quick-tasks'))
  const [meetings, setMeetings] = useState(() => readSavedList('team-quick-meetings'))
  const [notes, setNotes] = useState(() => readSavedList('team-quick-notes'))
  const [taskText, setTaskText] = useState('')
  const [meeting, setMeeting] = useState({ title: '', dateTime: '' })
  const [noteText, setNoteText] = useState('')

  useEffect(() => localStorage.setItem('team-quick-tasks', JSON.stringify(tasks)), [tasks])
  useEffect(() => localStorage.setItem('team-quick-meetings', JSON.stringify(meetings)), [meetings])
  useEffect(() => localStorage.setItem('team-quick-notes', JSON.stringify(notes)), [notes])

  function openTool(tool) {
    setActiveTool((current) => (current === tool ? null : tool))
  }

  function addTask(event) {
    event.preventDefault()
    if (!taskText.trim()) return
    setTasks((current) => [
      ...current,
      { id: crypto.randomUUID(), text: taskText.trim(), done: false },
    ])
    setTaskText('')
  }

  function addMeeting(event) {
    event.preventDefault()
    if (!meeting.title.trim() || !meeting.dateTime) return
    setMeetings((current) => [
      ...current,
      { id: crypto.randomUUID(), title: meeting.title.trim(), dateTime: meeting.dateTime },
    ])
    setMeeting({ title: '', dateTime: '' })
  }

  function addNote(event) {
    event.preventDefault()
    if (!noteText.trim()) return
    setNotes((current) => [
      ...current,
      { id: crypto.randomUUID(), text: noteText.trim(), createdAt: new Date().toISOString() },
    ])
    setNoteText('')
  }

  return (
    <aside className="team-quick-access" aria-label="Team quick access">
      <nav className="team-tool-rail" aria-label="Quick tools">
        <button
          type="button"
          className={activeTool === 'tasks' ? 'active' : ''}
          onClick={() => openTool('tasks')}
        >
          <span>✓</span>
          Tasks
          {tasks.filter((task) => !task.done).length > 0 && (
            <small>{tasks.filter((task) => !task.done).length}</small>
          )}
        </button>
        <button
          type="button"
          className={activeTool === 'calendar' ? 'active' : ''}
          onClick={() => openTool('calendar')}
        >
          <span>□</span>
          Calendar
          {meetings.length > 0 && <small>{meetings.length}</small>}
        </button>
        <button
          type="button"
          className={activeTool === 'notes' ? 'active' : ''}
          onClick={() => openTool('notes')}
        >
          <span>≡</span>
          Notes
          {notes.length > 0 && <small>{notes.length}</small>}
        </button>
      </nav>

      {activeTool && (
        <section className="team-tool-panel">
          <header>
            <div>
              <p className="eyebrow">Quick access</p>
              <h2>{activeTool === 'calendar' ? 'Meeting scheduler' : activeTool}</h2>
            </div>
            <button type="button" onClick={() => setActiveTool(null)} aria-label="Close quick tool">
              ×
            </button>
          </header>

          {activeTool === 'tasks' && (
            <>
              <form onSubmit={addTask} className="team-tool-form">
                <label>
                  New task
                  <input
                    value={taskText}
                    onChange={(event) => setTaskText(event.target.value)}
                    placeholder="What needs to be done?"
                  />
                </label>
                <button type="submit">Add task</button>
              </form>
              <div className="team-tool-list">
                {tasks.length === 0 && <p className="team-tool-empty">No tasks yet.</p>}
                {tasks.map((task) => (
                  <article key={task.id} className={task.done ? 'completed' : ''}>
                    <button
                      type="button"
                      className="team-task-check"
                      onClick={() =>
                        setTasks((current) =>
                          current.map((item) =>
                            item.id === task.id ? { ...item, done: !item.done } : item,
                          ),
                        )
                      }
                      aria-label={task.done ? 'Mark task incomplete' : 'Mark task complete'}
                    >
                      {task.done ? '✓' : ''}
                    </button>
                    <p>{task.text}</p>
                    <button
                      type="button"
                      className="team-tool-delete"
                      onClick={() =>
                        setTasks((current) => current.filter((item) => item.id !== task.id))
                      }
                      aria-label={`Delete ${task.text}`}
                    >
                      ×
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}

          {activeTool === 'calendar' && (
            <>
              <form onSubmit={addMeeting} className="team-tool-form">
                <label>
                  Meeting title
                  <input
                    value={meeting.title}
                    onChange={(event) => setMeeting({ ...meeting, title: event.target.value })}
                    placeholder="Weekly team meeting"
                  />
                </label>
                <label>
                  Date and time
                  <input
                    type="datetime-local"
                    value={meeting.dateTime}
                    onChange={(event) => setMeeting({ ...meeting, dateTime: event.target.value })}
                  />
                </label>
                <button type="submit">Schedule meeting</button>
              </form>
              <div className="team-tool-list">
                {meetings.length === 0 && <p className="team-tool-empty">No meetings scheduled.</p>}
                {[...meetings]
                  .sort((a, b) => a.dateTime.localeCompare(b.dateTime))
                  .map((item) => (
                    <article key={item.id}>
                      <div className="team-meeting-date">
                        <strong>
                          {new Date(item.dateTime).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </strong>
                        <small>
                          {new Date(item.dateTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </small>
                      </div>
                      <p>{item.title}</p>
                      <button
                        type="button"
                        className="team-tool-delete"
                        onClick={() =>
                          setMeetings((current) => current.filter((entry) => entry.id !== item.id))
                        }
                        aria-label={`Delete ${item.title}`}
                      >
                        ×
                      </button>
                    </article>
                  ))}
              </div>
            </>
          )}

          {activeTool === 'notes' && (
            <>
              <form onSubmit={addNote} className="team-tool-form">
                <label>
                  Quick note
                  <textarea
                    value={noteText}
                    onChange={(event) => setNoteText(event.target.value)}
                    placeholder="Write an important team note…"
                    rows="4"
                  />
                </label>
                <button type="submit">Save note</button>
              </form>
              <div className="team-tool-list team-note-list">
                {notes.length === 0 && <p className="team-tool-empty">No saved notes.</p>}
                {notes.map((note) => (
                  <article key={note.id}>
                    <div>
                      <p>{note.text}</p>
                      <small>{new Date(note.createdAt).toLocaleString()}</small>
                    </div>
                    <button
                      type="button"
                      className="team-tool-delete"
                      onClick={() =>
                        setNotes((current) => current.filter((item) => item.id !== note.id))
                      }
                      aria-label="Delete note"
                    >
                      ×
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </aside>
  )
}

export function TeamStructurePage() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const selected = employees.find((employee) => employee.id === selectedId)
  const visibleEmployees = employees.filter((employee) =>
    `${employee.name} ${employee.position} ${employee.phone}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  )
  const load = useCallback(async () => {
    try {
      const result = await apiRequest('/employees')
      setEmployees(result)
      setSelectedId((current) => (result.some((item) => item.id === current) ? current : null))
      setError('')
    } catch (requestError) {
      setError(
        requestError.message.includes('404')
          ? 'Employee service is not available yet. Restart the Spring Boot backend in IntelliJ, then refresh this page.'
          : requestError.message,
      )
    }
  }, [])
  useEffect(() => {
    load()
  }, [load])

  async function remove(employee) {
    if (!window.confirm(`Delete ${employee.name} from the employee directory?`)) return
    try {
      await apiRequest(`/employees/${employee.id}`, { method: 'DELETE' })
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="page-stack team-page">
      <div className="team-page-header">
        <div>
          <p className="eyebrow">People operations</p>
          <h1>Team structure</h1>
          <p>Manage employee profiles and assign every team member to one of two shifts.</p>
        </div>
        <button type="button" onClick={() => navigate('/team/new')}>
          + Add employee
        </button>
      </div>
      <div className="team-directory-toolbar">
        <div>
          <strong>{employees.length}</strong>
          <span>Total employees</span>
        </div>
        <label>
          <span>Search team</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, position or phone"
          />
        </label>
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <div className="team-content-layout">
        <div className="team-workspace">
          <section className="employee-directory" aria-label="Employees by shift">
            {shifts.map((shift, shiftIndex) => {
              const shiftEmployees = visibleEmployees.filter((employee) => employee.shift === shift)
              return (
                <div className={`shift-section shift-${shiftIndex + 1}`} key={shift}>
                  <header>
                    <div>
                      <span>{shiftIndex + 1}</span>
                      <div>
                        <strong>{shift}</strong>
                        <small>
                          {shiftEmployees.length} employee{shiftEmployees.length === 1 ? '' : 's'}
                        </small>
                      </div>
                    </div>
                    <em>{shiftIndex === 0 ? 'Primary team' : 'Secondary team'}</em>
                  </header>
                  <div className="shift-employee-list">
                    {shiftEmployees.map((employee) => (
                      <button
                        type="button"
                        className={`employee-card${selectedId === employee.id ? ' selected' : ''}`}
                        key={employee.id}
                        onClick={() =>
                          setSelectedId((current) => (current === employee.id ? null : employee.id))
                        }
                      >
                        <span>{initials(employee.name)}</span>
                        <div>
                          <strong>{employee.name}</strong>
                          <small>{employee.position}</small>
                          <em>{employee.phone}</em>
                        </div>
                      </button>
                    ))}
                    <button
                      type="button"
                      className="empty-shift"
                      onClick={() => navigate(`/team/new?shift=${encodeURIComponent(shift)}`)}
                    >
                      + Add an employee to {shift}
                    </button>
                  </div>
                </div>
              )
            })}
          </section>
          {selected && (
            <aside className="panel employee-detail">
              <button
                className="employee-detail-close"
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Close employee profile"
              >
                ×
              </button>
              <div className="employee-detail-hero">
                <span>{initials(selected.name)}</span>
                <div>
                  <p className="eyebrow">Employee profile</p>
                  <h2>{selected.name}</h2>
                  <p>{selected.position}</p>
                </div>
              </div>
              <dl>
                <div>
                  <dt>Phone number</dt>
                  <dd>{selected.phone}</dd>
                </div>
                <div>
                  <dt>NID</dt>
                  <dd>{selected.nid}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>{selected.address}</dd>
                </div>
                <div>
                  <dt>Shift</dt>
                  <dd>{selected.shift}</dd>
                </div>
                <div>
                  <dt>Monthly salary</dt>
                  <dd>{money(selected.salary)}</dd>
                </div>
                <div>
                  <dt>Joining date</dt>
                  <dd>{new Date(`${selected.joiningDate}T00:00:00`).toLocaleDateString()}</dd>
                </div>
              </dl>
              <div className="employee-detail-actions">
                <button type="button" onClick={() => navigate(`/team/${selected.id}/edit`)}>
                  Edit information
                </button>
                <button type="button" className="danger" onClick={() => remove(selected)}>
                  Delete
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
