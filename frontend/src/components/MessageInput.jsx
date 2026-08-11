import { useState, useRef, useEffect } from 'react'

export default function MessageInput({ onSend, isLoading, onStop, editingMessage, onCancelEdit }) {
  const [input, setInput] = useState('')
  const textareaRef = useRef(null)
  const prevEditingIdRef = useRef(null)

  useEffect(() => {
    if (editingMessage && editingMessage.id !== prevEditingIdRef.current) {
      setInput(editingMessage.content)
      prevEditingIdRef.current = editingMessage.id
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(editingMessage.content.length, editingMessage.content.length)
      }
    }
    if (!editingMessage) {
      prevEditingIdRef.current = null
    }
  }, [editingMessage])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setInput('')
    prevEditingIdRef.current = null
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleCancelEdit = () => {
    setInput('')
    prevEditingIdRef.current = null
    if (onCancelEdit) onCancelEdit()
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
    if (e.key === 'Escape' && editingMessage) {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4 md:pl-72 md:pr-8 flex justify-center pointer-events-none">
      <div className="w-full max-w-3xl pointer-events-auto">
        {editingMessage && (
          <div className="flex items-center justify-between px-4 py-2 mb-2 rounded-t-2xl text-sm" style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}>
            <span className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-base" style={{ color: 'var(--primary)' }}>edit</span>
              Editing message
            </span>
            <button
              onClick={handleCancelEdit}
              className="p-1 rounded-lg hover:bg-surface-container-high/50 transition-colors flex-shrink-0 ml-2"
              aria-label="Cancel editing"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className={`glass-panel w-full rounded-full p-2 pl-6 pr-2 flex items-center gap-4 shadow-lg hover:shadow-xl transition-shadow duration-300 ${editingMessage ? 'rounded-t-none' : ''}`}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={editingMessage ? 'Edit your message...' : 'Ask Qyron anything...'}
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent border-0 outline-none focus:ring-0 text-on-surface placeholder-on-surface-variant/60 py-3 max-h-[200px]"
            style={{ fontSize: '16px', lineHeight: '24px' }}
          />
          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              className="w-12 h-12 rounded-full bg-error text-on-error flex items-center justify-center hover:bg-error/90 hover:scale-105 active:scale-95 transition-all shadow-md flex-shrink-0"
              aria-label="Stop generating"
            >
              <span className="material-symbols-outlined">stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0"
              aria-label={editingMessage ? 'Send edited message' : 'Send message'}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
