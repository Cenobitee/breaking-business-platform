import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../api/client'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState(token ? '' : 'This reset link is missing its security token')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setSubmitting(true)
    try {
      const response = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: password }),
      })
      setMessage(response.message)
      setPassword('')
      setConfirmPassword('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div>
          <p className="eyebrow">Account recovery</p>
          <h1>Choose a new password</h1>
          <p>The reset link expires after 30 minutes and works only once.</p>
        </div>
        <label>
          New password
          <input type="password" required minLength="8" maxLength="72" autoComplete="new-password" disabled={!token || Boolean(message)} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label>
          Confirm new password
          <input type="password" required minLength="8" maxLength="72" autoComplete="new-password" disabled={!token || Boolean(message)} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </label>
        {error && <p className="error-message" role="alert">{error}</p>}
        {message && <p className="success-message" role="status">{message}</p>}
        {!message && <button type="submit" disabled={submitting || !token}>{submitting ? 'Saving…' : 'Save new password'}</button>}
        <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>
      </form>
    </main>
  )
}
