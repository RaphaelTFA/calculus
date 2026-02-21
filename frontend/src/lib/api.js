const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
// Helper to get token from localStorage
const getToken = () => {
  try {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      return parsed?.state?.token
    }
  } catch (e) {
    console.error('Error reading token:', e)
  }
  return null
}

const api = {
  async get(endpoint) {
    const token = getToken()
    const headers = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${API_BASE}${endpoint}`, { headers })
    
    if (res.status === 401) {
      // Token expired or invalid, clear auth
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Request failed' }))
      console.error(`[api] GET ${endpoint} failed:`, error)
      throw new Error(error.detail || 'Request failed')
    }
    
    const data = await res.json()
    console.debug(`[api] GET ${endpoint} response:`, data)
    return data
  },

  async post(endpoint, data) {
    const token = getToken()
    const headers = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    })

    if (res.status === 401 && !endpoint.includes('/auth/')) {
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || 'Request failed')
    }

    return await res.json()
  },

  async put(endpoint, data) {
    const token = getToken()
    const headers = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || 'Request failed')
    }

    return await res.json()
  },

  async delete(endpoint) {
    const token = getToken()
    const headers = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || 'Request failed')
    }

    return await res.json()
  }
}

export default api
