import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '../api/client'
import { useAuth } from '../auth/AuthContext'

const initials = (name) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

export function SupportPage() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)
  const selected = contacts.find((contact) => contact.id === selectedId)

  const loadContacts = useCallback(async () => {
    try {
      const all = await apiRequest('/messages/contacts')
      const eligible = user.role === 'MANAGER' ? all.filter((contact) => contact.role === 'OWNER') : all
      setContacts(eligible); setSelectedId((current) => current ?? eligible[0]?.id ?? null); setError('')
    } catch (requestError) { setError(requestError.message) }
  }, [user.role])
  const loadMessages = useCallback(async () => {
    if (!selectedId) return
    try { setMessages(await apiRequest(`/messages/conversations/${selectedId}`)); setError('') }
    catch (requestError) { setError(requestError.message) }
  }, [selectedId])

  useEffect(() => { loadContacts(); const id = window.setInterval(loadContacts, 5000); return () => window.clearInterval(id) }, [loadContacts])
  useEffect(() => { loadMessages(); const id = window.setInterval(loadMessages, 2500); return () => window.clearInterval(id) }, [loadMessages])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(event) {
    event.preventDefault(); if (!body.trim() || !selected?.canSend) return
    setSending(true); setError('')
    try { await apiRequest(`/messages/conversations/${selectedId}`, { method: 'POST', body: JSON.stringify({ body: body.trim() }) }); setBody(''); await loadMessages() }
    catch (requestError) { setError(requestError.message) } finally { setSending(false) }
  }

  return <div className="page-stack support-page"><div><p className="eyebrow">Live assistance</p><h1>Support center</h1><p>Send a message and keep this page open for live replies.</p></div>{error && <p className="error-message">{error}</p>}<section className="support-workspace panel"><nav className="support-contacts">{contacts.map((contact) => <button type="button" key={contact.id} className={selectedId === contact.id ? 'selected' : ''} onClick={() => setSelectedId(contact.id)}><span>{initials(contact.fullName)}</span><div><strong>{contact.fullName}</strong><small>{contact.role} · {contact.unreadCount ? `${contact.unreadCount} unread` : 'Available'}</small></div></button>)}{contacts.length === 0 && <p>No support contact is available.</p>}</nav><div className="support-conversation">{selected ? <><header><span>{initials(selected.fullName)}</span><div><strong>{selected.fullName}</strong><small><i /> Live support · {selected.role}</small></div></header><div className="support-messages">{messages.map((message) => <article className={message.senderId === user.id ? 'mine' : ''} key={message.id}><p>{message.body}</p><small>{new Date(message.sentAt).toLocaleString()}{message.editedAt ? ' · edited' : ''}</small></article>)}{messages.length === 0 && <div className="support-welcome"><span>💬</span><h2>Start a support conversation</h2><p>Describe what you need help with and the Owner can reply here.</p></div>}<div ref={endRef} /></div><form onSubmit={send}><textarea rows="2" maxLength="2000" placeholder="Write your support message…" value={body} onChange={(e) => setBody(e.target.value)} /><button type="submit" disabled={sending || !body.trim()}>{sending ? 'Sending…' : 'Send message'}</button></form></> : <div className="support-welcome"><p>Select a contact to begin.</p></div>}</div></section></div>
}
