const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

export async function apiRequest(path, options = {}) {
  const token = sessionStorage.getItem('financial-platform-token')
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401 && path !== '/auth/login') {
    sessionStorage.removeItem('financial-platform-token')
    sessionStorage.removeItem('financial-platform-user')
    window.dispatchEvent(new Event('financial-platform-auth-expired'))
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message ?? `Request failed with status ${response.status}`)
  }

  if (response.status === 204) return null
  return response.json()
}
