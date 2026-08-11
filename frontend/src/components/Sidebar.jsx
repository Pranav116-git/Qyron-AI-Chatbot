import { useState, useRef, useEffect } from 'react'

export default function Sidebar({
  isOpen, onClose, onNewChat,
  conversations,
  onLoadConversation, onDeleteConversation, onRenameConversation,
  user, onLogout, onOpenAccount,
  activeConversationId,
}) {
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef(null)

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingId])

  const formatDate = (iso) => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    } catch {
      return ''
    }
  }

  const handleStartRename = (conv, e) => {
    e.stopPropagation()
    setRenamingId(conv.id)
    setRenameValue(conv.title)
  }

  const handleConfirmRename = async () => {
    if (renamingId && renameValue.trim()) {
      await onRenameConversation(renamingId, renameValue.trim())
    }
    setRenamingId(null)
    setRenameValue('')
  }

  const handleCancelRename = () => {
    setRenamingId(null)
    setRenameValue('')
  }

  const recentChats = (conversations || []).slice(0, 10)

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col backdrop-blur-xl bg-surface/70 border-r border-outline-variant/30 shadow-sm transform transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-full py-4 flex flex-col px-4">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-headline-sm text-primary">Qyron</h1>
              <p className="text-label-md text-on-surface-variant truncate">{user?.name || 'User'}</p>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="px-4 mb-4">
            <button
              onClick={() => { onNewChat(); onClose(); }}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-on-primary font-bold shadow-sm hover:bg-primary/90 transition-colors duration-200 w-full"
            >
              <span className="material-symbols-outlined">add</span>
              <span className="text-label-lg">New Chat</span>
            </button>
          </div>

          {/* Recent Chats */}
          <div className="flex-1 flex flex-col min-h-0 px-2">
            <p className="text-label-sm text-on-surface-variant px-2 mb-2 uppercase tracking-wider">Recent Chats</p>
            <div className="flex-1 overflow-y-auto space-y-0.5">
              {recentChats.length === 0 ? (
                <p className="text-on-surface-variant text-sm px-2 py-6 text-center">No conversations yet.</p>
              ) : (
                recentChats.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group flex items-center gap-1 px-2 py-2 rounded-xl transition-colors ${
                      activeConversationId === conv.id
                        ? 'bg-primary-container/20 text-primary'
                        : 'hover:bg-surface-container-low/50 text-on-surface'
                    }`}
                  >
                    {renamingId === conv.id ? (
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmRename()
                          if (e.key === 'Escape') handleCancelRename()
                        }}
                        onBlur={handleConfirmRename}
                        className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-surface-container-low/80 border border-primary/50 text-on-surface text-sm focus:outline-none"
                        maxLength={255}
                      />
                    ) : (
                      <>
                        <button
                          onClick={() => { onLoadConversation(conv); onClose(); }}
                          className="flex-1 min-w-0 flex items-center gap-2 text-left"
                        >
                          <span className="material-symbols-outlined text-on-surface-variant text-xl flex-shrink-0">chat_bubble</span>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium truncate ${
                              activeConversationId === conv.id ? 'text-primary' : 'text-on-surface'
                            }`}>{conv.title}</div>
                            <div className="text-on-surface-variant text-xs">{formatDate(conv.updated_at || conv.updatedAt)}</div>
                          </div>
                        </button>
                        <div className="flex-shrink-0 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleStartRename(conv, e)}
                            className="p-1.5 rounded-lg hover:bg-surface-container-high/50"
                            title="Rename"
                          >
                            <span className="material-symbols-outlined text-on-surface-variant text-sm">edit</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }}
                            className="p-1.5 rounded-lg hover:bg-error-container/50"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-error text-sm">delete</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Account */}
          <div className="mt-auto pt-3 border-t border-outline-variant/30 px-2">
            <button
              onClick={() => { onOpenAccount(); onClose(); }}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container-low/50 transition-colors duration-200 w-full text-left"
            >
              <span className="material-symbols-outlined">person</span>
              <span className="text-label-lg truncate">{user?.name || user?.email || 'Account'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
