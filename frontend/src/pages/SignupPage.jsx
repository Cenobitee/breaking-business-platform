import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function SignupPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [businessName, setBusinessName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={user.role === 'INVESTOR' ? '/investor' : '/operations'} replace />

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setSubmitting(true)
    try {
      await register(businessName, fullName, email, password)
      navigate('/operations', { replace: true })
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
          <p className="eyebrow">Create a business</p>
          <h1>Owner profile</h1>
          <p>Create your business in Breaking Business. You can add Managers and Investors after signing in.</p>
        </div>
        <label>
          Business name
          <input required maxLength="160" autoComplete="organization" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </label>
        <label>
          Full name
          <input required maxLength="120" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label>
          Email
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" required minLength="8" maxLength="72" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <span className="field-hint">Use at least 8 characters.</span>
        </label>
        <label>
          Confirm password
          <input type="password" required minLength="8" maxLength="72" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </label>
        {error && <p className="error-message" role="alert">{error}</p>}
        <button type="submit" disabled={submitting}>{submitting ? 'Creating business…' : 'Create business and owner'}</button>
        <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
      </form>
    </main>
  )
}
