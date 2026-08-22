import { useState, useCallback, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import MessageInput from './components/MessageInput'
import EmptyState from './components/EmptyState'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import { useChat } from './hooks/useChat'
import { AuthProvider, useAuth } from './context/AuthContext'
import { getTheme, saveTheme } from './utils/storage'
import { conversationsApi } from './services/api'

function ChatApp() {
  const { user, loading: authLoading, login, register, logout } = useAuth()
  const {
    messages,
    isLoading,
    error,
    send,
    clearChat: resetChat,
    retryLastMessage,
    regenerateLastMessage,
    stopGeneration,
    setMessages,
    loadConversation,
    setConversationId,
    editAndSend,
  } = useChat()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState(() => getTheme())
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [editingMessage, setEditingMessage] = useState(null)
  const [authView, setAuthView] = useState('login')
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (!user) {
      setConversations([])
      setDataLoading(false)
      return
    }

    const loadData = async () => {
      try {
        const convs = await conversationsApi.list()
        setConversations(convs)
      } catch (err) {
        console.error('Failed to load conversations:', err)
      } finally {
        setDataLoading(false)
      }
    }
    loadData()
  }, [user])

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      saveTheme(next)
      return next
    })
  }, [])

  const handleNewChat = useCallback(() => {
    resetChat()
    setActiveConversationId(null)
    setConversationId(null)
    setEditingMessage(null)
  }, [resetChat, setConversationId])

  const handleEditMessage = useCallback((message) => {
    setEditingMessage(message)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null)
  }, [])

  const handleSend = useCallback(async (content) => {
    if (editingMessage) {
      setEditingMessage(null)
      const response = await editAndSend(editingMessage.id, content, activeConversationId)
      if (response && response.conversation_id && !activeConversationId) {
        setActiveConversationId(response.conversation_id)
        setConversationId(response.conversation_id)
        const convs = await conversationsApi.list().catch(() => null)
        if (convs) setConversations(convs)
      }
      return response
    }

    const response = await send(content, activeConversationId)
    if (response && response.conversation_id && !activeConversationId) {
      setActiveConversationId(response.conversation_id)
      setConversationId(response.conversation_id)
      const convs = await conversationsApi.list().catch(() => null)
      if (convs) setConversations(convs)
    }
    return response
  }, [send, editAndSend, activeConversationId, setConversationId, editingMessage])

  const handleLoadConversation = useCallback(async (conv) => {
    try {
      const detail = await conversationsApi.get(conv.id)
      loadConversation(
        detail.messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
        })),
        conv.id
      )
      setActiveConversationId(conv.id)
      setSidebarOpen(false)
      setEditingMessage(null)
    } catch (err) {
      console.error('Failed to load conversation:', err)
    }
  }, [loadConversation])

  const handleDeleteConversation = useCallback(async (id) => {
    try {
      await conversationsApi.delete(id)
      const convs = await conversationsApi.list()
      setConversations(convs)
      if (activeConversationId === id) {
        resetChat()
        setActiveConversationId(null)
        setConversationId(null)
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  }, [activeConversationId, resetChat, setConversationId])

  const handleRenameConversation = useCallback(async (id, newTitle) => {
    try {
      await conversationsApi.update(id, newTitle)
      const convs = await conversationsApi.list()
      setConversations(convs)
    } catch (err) {
      console.error('Failed to rename conversation:', err)
    }
  }, [])

  const handleLogin = useCallback(async (email, password) => {
    setAuthError('')
    try {
      await login(email, password)
    } catch (err) {
      setAuthError(err.message)
      throw err
    }
  }, [login])

  const handleRegister = useCallback(async (email, username, password) => {
    setAuthError('')
    try {
      await register(email, username, password)
    } catch (err) {
      setAuthError(err.message)
      throw err
    }
  }, [register])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center atmospheric-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
          </div>
          <p className="text-on-surface-variant">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    if (authView === 'register') {
      return (
        <RegisterPage
          onRegister={handleRegister}
          onSwitchToLogin={() => { setAuthView('login'); setAuthError('') }}
          error={authError}
        />
      )
    }
    return (
      <LoginPage
        onLogin={handleLogin}
        onSwitchToRegister={() => { setAuthView('register'); setAuthError('') }}
        error={authError}
      />
    )
  }

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="flex h-screen bg-background text-on-background font-sans antialiased overflow-hidden atmospheric-bg">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={handleNewChat}
          conversations={conversations}
          onLoadConversation={handleLoadConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          activeConversationId={activeConversationId}
          user={user}
          onLogout={logout}
        />

        <div className="flex-1 flex flex-col min-w-0 md:ml-72 relative w-full">
          <header className="fixed top-0 right-0 w-full z-40 bg-transparent flex justify-end items-center px-6 py-4 gap-4 md:pl-72 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high/20 transition-all md:hidden"
                aria-label="Open menu"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high/20 transition-all"
                aria-label="Toggle theme"
              >
                <span className="material-symbols-outlined">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
            </div>
          </header>

          <main className="flex-1 flex flex-col pt-16 pb-28 overflow-y-auto">
            <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full px-4 md:px-8">
              {messages.length === 0 ? (
                <EmptyState
                  onSuggestionClick={handleSend}
                  isLoading={isLoading}
                />
              ) : (
                <ChatWindow messages={messages} isLoading={isLoading} onRegenerate={regenerateLastMessage} onEdit={handleEditMessage} />
              )}
            </div>

            {error && (
              <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-error-container/90 backdrop-blur-sm border border-error/20 rounded-xl max-w-lg">
                <p className="text-sm text-on-error-container">{error}</p>
              </div>
            )}
          </main>

          <MessageInput onSend={handleSend} isLoading={isLoading} onStop={stopGeneration} editingMessage={editingMessage} onCancelEdit={handleCancelEdit} />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ChatApp />
    </AuthProvider>
  )
}
