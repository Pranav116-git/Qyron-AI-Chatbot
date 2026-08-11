const KEYS = {
  THEME: 'qyron-theme',
}

function safeGet(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function saveTheme(theme) {
  safeSet(KEYS.THEME, theme)
}

export function getTheme() {
  return safeGet(KEYS.THEME) || 'light'
}
