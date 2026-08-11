export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

export function createMessage(role, content) {
  return {
    id: generateId(),
    role,
    content,
  }
}
