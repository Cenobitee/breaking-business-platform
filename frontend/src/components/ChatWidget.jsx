import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '../api/client'
import { useAuth } from '../auth/AuthContext'

const initials = (name) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
const messageTime = (value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export function ChatWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [contacts, setContacts] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [contactsError, setContactsError] = useState('')
  const [sending, setSending] = useState(false)
  const [incomingNotice, setIncomingNotice] = useState(null)
  const messageEndRef = useRef(null)
  const previousUnreadRef = useRef(0)
  const contactsInitializedRef = useRef(false)
  const noticeTimerRef = useRef(null)

  const selected = contacts.find((contact) => contact.id === selectedId)
  const unreadCount = contacts.reduce((total, contact) => total + Number(contact.unreadCount), 0)

  const loadContacts = useCallback(async () => {
    try {
      const result = await apiRequest('/messages/contacts')
      const nextUnread = result.reduce((total, contact) => total + Number(contact.unreadCount), 0)
      if (contactsInitializedRef.current && nextUnread > previousUnreadRef.current && !open) {
        const sender = result.find((contact) => Number(contact.unreadCount) > 0)
        if (sender) {
          setIncomingNotice(sender)
          window.clearTimeout(noticeTimerRef.current)
          noticeTimerRef.current = window.setTimeout(() => setIncomingNotice(null), 6000)
        }
      }
      previousUnreadRef.current = nextUnread
      contactsInitializedRef.current = true
      setContacts(result)
      setContactsError('')
      setSelectedId((current) => current ?? result[0]?.id ?? null)
    } catch (requestError) {
      setContactsError('Messaging is unavailable from the running backend. Restart Spring Boot in IntelliJ, then try again.')
    }
  }, [open])

  const loadConversation = useCallback(async () => {
    if (!open || !selectedId) return
    try {
      const result = await apiRequest(`/messages/conversations/${selectedId}`)
      setMessages(result)
      setContacts((current) => current.map((contact) => contact.id === selectedId ? { ...contact, unreadCount: 0 } : contact))
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [open, selectedId])

  useEffect(() => {
    loadContacts()
    const intervalId = window.setInterval(loadContacts, 5000)
    return () => { window.clearInterval(intervalId); window.clearTimeout(noticeTimerRef.current) }
  }, [loadContacts])

  useEffect(() => {
    loadConversation()
    if (!open || !selectedId) return undefined
    const intervalId = window.setInterval(loadConversation, 2500)
    return () => window.clearInterval(intervalId)
  }, [loadConversation, open, selectedId])

  useEffect(() => {
    if (open) messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function send(event) {
    event.preventDefault()
    if (!body.trim() || !selected?.canSend) return
    setSending(true)
    setError('')
    try {
      await apiRequest(`/messages/conversations/${selectedId}`, {
        method: 'POST',
        body: JSON.stringify({ body: body.trim() }),
      })
      setBody('')
      await loadConversation()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSending(false)
    }
  }

  async function editMessage(message) {
    const editedBody = window.prompt('Edit your message:', message.body)
    if (editedBody === null || !editedBody.trim() || editedBody.trim() === message.body) return
    setError('')
    try {
      await apiRequest(`/messages/${message.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ body: editedBody.trim() }),
      })
      await loadConversation()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function deleteMessage(message) {
    if (!window.confirm('Delete this message permanently?')) return
    setError('')
    try {
      await apiRequest(`/messages/${message.id}`, { method: 'DELETE' })
      await loadConversation()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  if (!open) {
    return (
      <>
        {incomingNotice && <button className="chat-incoming-toast" type="button" onClick={() => { setSelectedId(incomingNotice.id); setIncomingNotice(null); setOpen(true) }}><span>{initials(incomingNotice.fullName)}</span><div><strong>{incomingNotice.fullName}</strong><small>sent you a new message</small></div><em>Open</em></button>}
        <button className="chat-launcher" type="button" onClick={() => { setIncomingNotice(null); setOpen(true) }} aria-label={`Open messages, ${unreadCount} unread`}>
          <span aria-hidden="true">💬</span>
          {unreadCount > 0 && <strong>{unreadCount > 99 ? '99+' : unreadCount}</strong>}
        </button>
      </>
    )
  }

  return (
    <aside className="chat-window" aria-label="Business messaging">
      <header className="chat-header">
        <div><strong>Messages</strong><small>{user.businessName}</small></div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close messages">×</button>
      </header>
      <div className="chat-content">
        <nav className="chat-contacts" aria-label="Message contacts">
          {contacts.map((contact) => (
            <button className={selectedId === contact.id ? 'selected' : ''} type="button" key={contact.id} onClick={() => setSelectedId(contact.id)} title={`${contact.fullName} · ${contact.role}`}>
              <span>{initials(contact.fullName)}</span>
              <small>{contact.fullName.split(' ')[0]}</small>
              {contact.unreadCount > 0 && <strong>{contact.unreadCount}</strong>}
            </button>
          ))}
          {contactsError && <p className="chat-contact-error">Backend restart required</p>}
          {!contactsError && contacts.length === 0 && <p>No eligible contacts in this business.</p>}
        </nav>
        <section className="chat-conversation">
          {selected ? (
            <>
              <div className="chat-contact-heading">
                <span>{initials(selected.fullName)}</span>
                <div><strong>{selected.fullName}</strong><small>{selected.role}{selected.personalEmail ? ` · ${selected.personalEmail}` : ''}</small></div>
              </div>
              <div className="chat-messages" aria-live="polite">
                {messages.map((message) => (
                  <div className={`chat-message ${message.senderId === user.id ? 'mine' : 'theirs'}`} key={message.id}>
                    <p>{message.body}</p>
                    <div className="chat-message-footer">
                      <small>{messageTime(message.sentAt)}{message.editedAt ? ' · edited' : ''}</small>
                      {message.senderId === user.id && (
                        <span className="chat-message-actions">
                          <button type="button" onClick={() => editMessage(message)}>Edit</button>
                          <button type="button" onClick={() => deleteMessage(message)}>Delete</button>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {messages.length === 0 && <p className="chat-empty">No messages yet. Start the conversation.</p>}
                <div ref={messageEndRef} />
              </div>
              {error && <p className="chat-error">{error}</p>}
              {selected.canSend ? (
                <form className="chat-composer" onSubmit={send}>
                  <textarea rows="1" maxLength="2000" placeholder="Write a message…" value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} />
                  <button type="submit" disabled={sending || !body.trim()} aria-label="Send message">➤</button>
                </form>
              ) : (
                <p className="chat-disabled">Managers cannot message Investors.</p>
              )}
            </>
          ) : (
            <div className="chat-empty">
              <p>{contactsError || 'Choose a contact to start messaging.'}</p>
              {contactsError && <button type="button" onClick={loadContacts}>Try again</button>}
            </div>
          )}
        </section>
      </div>
    </aside>
  )
}
