import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../api/client'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')
    setResetToken('')
    try {
      const response = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setMessage(response.message)
      setResetToken(response.resetToken ?? '')
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
          <h1>Forgot password?</h1>
          <p>Enter the email address attached to your account.</p>
        </div>
        <label>
          Email
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {error && <p className="error-message" role="alert">{error}</p>}
        {message && <p className="success-message" role="status">{message}</p>}
        {resetToken && (
          <Link className="reset-link-button" to={`/reset-password?token=${encodeURIComponent(resetToken)}`}>
            Continue to reset password
          </Link>
        )}
        <button type="submit" disabled={submitting}>{submitting ? 'Preparing reset…' : 'Reset password'}</button>
        <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>
      </form>
    </main>
  )
}
