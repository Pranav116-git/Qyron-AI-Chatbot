const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getCsrfToken() {
  const match = document.cookie.match(/qyron_csrf=([^;]+)/)
  return match ? match[1] : ''
}

async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (options.method && options.method !== 'GET') {
    headers['X-CSRF-Token'] = getCsrfToken()
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    credentials: 'include',
    ...options,
    headers,
  })

  const data = await response.json().catch(() => null)

  if (response.status === 401) {
    window.location.href = '/login'
    throw new Error('Session expired. Please log in again.')
  }

  if (response.status === 403) {
    window.location.reload()
    throw new Error('Security token expired. Please try again.')
  }

  if (!response.ok) {
    throw new Error(data?.detail || 'Something went wrong.')
  }

  return data
}

export async function sendMessage(messages, conversationId = null) {
  let response
  try {
    response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken(),
      },
      credentials: 'include',
      body: JSON.stringify({ messages, conversation_id: conversationId }),
    })
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error('Qyron couldn\'t connect to the AI service. Please check your connection and try again.')
    }
    throw new Error('Unable to connect to Qyron. Please try again.')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null)

    if (response.status === 401) {
      window.location.href = '/login'
      throw new Error('Session expired. Please log in again.')
    }
    if (response.status === 403) {
      window.location.reload()
      throw new Error('Security token expired. Please try again.')
    }
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
  login: (email, password) =>
    apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name, email, password, confirmPassword) =>
    apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, confirm_password: confirmPassword }),
    }),

  logout: () =>
    apiCall('/api/auth/logout', { method: 'POST' }),

  logoutAll: () =>
    apiCall('/api/auth/logout-all', { method: 'POST' }),

  me: () =>
    apiCall('/api/auth/me'),

  forgotPassword: (email) =>
    apiCall('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token, password, confirmPassword) =>
    apiCall('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password, confirm_password: confirmPassword }),
    }),

  changePassword: (currentPassword, newPassword, confirmPassword) =>
    apiCall('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    }),

  updateProfile: (name) =>
    apiCall('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),

  deleteAccount: () =>
    apiCall('/api/auth/account', { method: 'DELETE' }),
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

export const savedPromptsApi = {
  list: () =>
    apiCall('/api/saved-prompts'),

  create: (title, content) =>
    apiCall('/api/saved-prompts', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    }),

  update: (id, title) =>
    apiCall(`/api/saved-prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    }),

  delete: (id) =>
    apiCall(`/api/saved-prompts/${id}`, { method: 'DELETE' }),
}

export const settingsApi = {
  get: () =>
    apiCall('/api/settings'),

  update: (theme) =>
    apiCall('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ theme }),
    }),
}

export const usageApi = {
  stats: () =>
    apiCall('/api/usage/stats'),
}
