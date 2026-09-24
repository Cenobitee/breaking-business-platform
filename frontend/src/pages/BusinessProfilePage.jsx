import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useAuth } from '../auth/AuthContext'

const emptyProfile = {
  name: '', description: '', address: '', phone: '', contactEmail: '', website: '', logoDataUrl: null,
}

export function BusinessProfilePage() {
  const { user, updateBusinessName } = useAuth()
  const canEdit = user.role === 'OWNER'
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(emptyProfile)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiRequest('/business').then((data) => {
      setProfile(data)
      setForm({ ...emptyProfile, ...data })
    }).catch((requestError) => setError(requestError.message))
  }, [])

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function chooseLogo(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Choose a PNG, JPEG, WebP, or GIF image.')
      return
    }
    if (file.size > 700 * 1024) {
      setError('The logo must be smaller than 700 KB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      change('logoDataUrl', reader.result)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const updated = await apiRequest('/business', { method: 'PUT', body: JSON.stringify(form) })
      setProfile(updated)
      setForm({ ...emptyProfile, ...updated })
      updateBusinessName(updated.name)
      window.dispatchEvent(new Event('business-profile-updated'))
      setNotice('Business profile updated. Managers and Investors can now view these details.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  if (!profile && !error) return <p>Loading business profile…</p>

  return (
    <div className="page-stack">
      <div>
        <p className="eyebrow">Breaking Business</p>
        <h1>Business profile</h1>
        <p>{canEdit ? 'Manage the public profile visible to your Manager and Investor accounts.' : 'View the business information maintained by your Owner.'}</p>
      </div>
      {error && <p className="error-message" role="alert">{error}</p>}
      {notice && <p className="success-message" role="status">{notice}</p>}

      {profile && canEdit && (
        <form className="panel business-profile-editor" onSubmit={save}>
          <section className="logo-editor">
            <div className="business-logo-preview">
              {form.logoDataUrl ? <img src={form.logoDataUrl} alt="Business logo preview" /> : <span aria-hidden="true">🏢</span>}
            </div>
            <label>Business logo<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={chooseLogo} /></label>
            {form.logoDataUrl && <button className="secondary" type="button" onClick={() => change('logoDataUrl', null)}>Remove logo</button>}
            <small>PNG, JPEG, WebP, or GIF; maximum 700 KB.</small>
          </section>
          <section className="business-fields">
            <label>Business name<input required maxLength="160" value={form.name} onChange={(event) => change('name', event.target.value)} /></label>
            <label className="full-field">Description<textarea maxLength="1000" rows="5" value={form.description || ''} onChange={(event) => change('description', event.target.value)} /></label>
            <label className="full-field">Address<input maxLength="240" value={form.address || ''} onChange={(event) => change('address', event.target.value)} /></label>
            <label>Phone<input maxLength="40" value={form.phone || ''} onChange={(event) => change('phone', event.target.value)} /></label>
            <label>Contact email<input type="email" maxLength="254" value={form.contactEmail || ''} onChange={(event) => change('contactEmail', event.target.value)} /></label>
            <label className="full-field">Website<input type="url" maxLength="300" placeholder="https://example.com" value={form.website || ''} onChange={(event) => change('website', event.target.value)} /></label>
            <button className="full-field" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save business profile'}</button>
          </section>
        </form>
      )}

      {profile && !canEdit && (
        <section className="panel business-profile-view">
          <div className="business-logo-large">
            {profile.logoDataUrl ? <img src={profile.logoDataUrl} alt={`${profile.name} logo`} /> : <span aria-hidden="true">🏢</span>}
          </div>
          <div>
            <p className="eyebrow">Business</p>
            <h2>{profile.name}</h2>
            <p className="business-description">{profile.description || 'No business description has been added yet.'}</p>
            <dl className="business-details">
              <div><dt>Address</dt><dd>{profile.address || '—'}</dd></div>
              <div><dt>Phone</dt><dd>{profile.phone || '—'}</dd></div>
              <div><dt>Email</dt><dd>{profile.contactEmail || '—'}</dd></div>
              <div><dt>Website</dt><dd>{profile.website ? <a href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a> : '—'}</dd></div>
            </dl>
          </div>
        </section>
      )}
    </div>
  )
}
