const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_URL = RAW_API_URL.replace(/\/+$/, '').replace(/\/api$/, '')

function getToken() {
  return localStorage.getItem('qyron-token')
}

async function apiCall(endpoint, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error('Unable to connect to Qyron server. Please check your connection and try again.')
    }
    throw new Error(err.message || 'Network request failed.')
  }

  if (response.status === 401) {
    localStorage.removeItem('qyron-token')
    window.location.reload()
    throw new Error('Session expired. Please log in again.')
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail || 'Something went wrong.')
  }

  return data
}

export async function sendMessage(messages, conversationId = null) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages, conversation_id: conversationId }),
    })
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error('Qyron couldn\'t connect to the AI service. Please check your connection and try again.')
    }
    throw new Error('Unable to connect to Qyron. Please try again.')
  }

  if (response.status === 401) {
    localStorage.removeItem('qyron-token')
    window.location.reload()
    throw new Error('Session expired. Please log in again.')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null)

    if (response.status === 429) {
      throw new Error(error?.detail || 'You\'re sending messages too quickly. Please wait a moment.')
    }
    if (response.status === 502) {
      throw new Error('Qyron couldn\'t generate a response right now. Please try again.')
    }
    if (response.status === 504) {
      throw new Error('The request took too long. Please try again.')
    }
    if (response.status >= 500) {
      throw new Error('Unable to connect to Qyron right now. Please try again.')
    }
    throw new Error(error?.detail || 'Something went wrong. Please try again.')
  }

  const data = await response.json()
  return data
}

export async function checkHealth() {
  const response = await fetch(`${API_URL}/health`)
  return response.ok
}

export const authApi = {
  register: (email, username, password) =>
    apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    }),

  login: (email, password) =>
    apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  googleLogin: (credential) =>
    apiCall('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),

  getMe: (token) =>
    apiCall('/api/auth/me', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    }),
}

export const conversationsApi = {
  list: () =>
    apiCall('/api/conversations'),

  listArchived: () =>
    apiCall('/api/conversations/archived'),

  get: (id) =>
    apiCall(`/api/conversations/${id}`),

  create: (title) =>
    apiCall('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),

  update: (id, title) =>
    apiCall(`/api/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    }),

  archive: (id) =>
    apiCall(`/api/conversations/${id}/archive`, { method: 'POST' }),

  unarchive: (id) =>
    apiCall(`/api/conversations/${id}/unarchive`, { method: 'POST' }),

  delete: (id) =>
    apiCall(`/api/conversations/${id}`, { method: 'DELETE' }),

  search: (query) =>
    apiCall(`/api/conversations/search?q=${encodeURIComponent(query)}`),
}
