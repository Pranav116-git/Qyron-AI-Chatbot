import { useState, useCallback, useRef, useEffect } from 'react'
import { sendMessage } from '../services/api'
import { createMessage } from '../utils/chatUtils'

const MAX_MESSAGES_FOR_CONTEXT = 40

export function useChat() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortControllerRef = useRef(null)
  const conversationIdRef = useRef(null)

  const setConversationId = useCallback((id) => {
    conversationIdRef.current = id
  }, [])

  const send = useCallback(async (content, conversationId = null) => {
    const userMessage = createMessage('user', content)
    setMessages(prev => [...prev, userMessage])
    setError(null)
    setIsLoading(true)

    if (conversationId) {
      conversationIdRef.current = conversationId
    }

    try {
      const allMessages = [...messages, userMessage]
      const contextMessages = allMessages.length > MAX_MESSAGES_FOR_CONTEXT
        ? allMessages.slice(-MAX_MESSAGES_FOR_CONTEXT)
        : allMessages

      const formattedMessages = contextMessages.map(m => ({
        role: m.role,
        content: m.content,
      }))

      abortControllerRef.current = new AbortController()
      const response = await sendMessage(formattedMessages, conversationIdRef.current)
      const assistantMessage = createMessage('assistant', response.response)
      setMessages(prev => [...prev, assistantMessage])

      if (response.conversation_id && !conversationIdRef.current) {
        conversationIdRef.current = response.conversation_id
      }

      return response
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [messages])

  const clearChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setMessages([])
    setError(null)
    setIsLoading(false)
    conversationIdRef.current = null
  }, [])

  const loadConversation = useCallback((conversationMessages, convId) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setMessages(conversationMessages)
    setError(null)
    setIsLoading(false)
    conversationIdRef.current = convId || null
  }, [])

  const regenerateLastMessage = useCallback(async (conversationId = null) => {
    if (messages.length < 2 || isLoading) return

    const lastAssistantIndex = messages.length - 1
    const messagesWithoutLastAssistant = messages.slice(0, lastAssistantIndex)
    const lastUserMessage = messagesWithoutLastAssistant[messagesWithoutLastAssistant.length - 1]

    if (!lastUserMessage || lastUserMessage.role !== 'user') return

    setMessages(messagesWithoutLastAssistant)
    setError(null)
    setIsLoading(true)

    try {
      const contextMessages = messagesWithoutLastAssistant.length > MAX_MESSAGES_FOR_CONTEXT
        ? messagesWithoutLastAssistant.slice(-MAX_MESSAGES_FOR_CONTEXT)
        : messagesWithoutLastAssistant

      const formattedMessages = contextMessages.map(m => ({
        role: m.role,
        content: m.content,
      }))

      abortControllerRef.current = new AbortController()
      const response = await sendMessage(formattedMessages, conversationIdRef.current)
      const assistantMessage = createMessage('assistant', response.response)
      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [messages, isLoading])

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
    }
  }, [])

  const editAndSend = useCallback(async (messageId, newContent, conversationId = null) => {
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return

    const priorMessages = messages.slice(0, messageIndex)
    const editedMessage = { ...messages[messageIndex], content: newContent }
    const newMessages = [...priorMessages, editedMessage]

    setMessages(newMessages)
    setError(null)
    setIsLoading(true)

    if (conversationId) {
      conversationIdRef.current = conversationId
    }

    try {
      const contextMessages = newMessages.length > MAX_MESSAGES_FOR_CONTEXT
        ? newMessages.slice(-MAX_MESSAGES_FOR_CONTEXT)
        : newMessages

      const formattedMessages = contextMessages.map(m => ({
        role: m.role,
        content: m.content,
      }))

      abortControllerRef.current = new AbortController()
      const response = await sendMessage(formattedMessages, conversationIdRef.current)
      const assistantMessage = createMessage('assistant', response.response)
      setMessages(prev => [...prev, assistantMessage])

      if (response.conversation_id && !conversationIdRef.current) {
        conversationIdRef.current = response.conversation_id
      }

      return response
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [messages])

  return {
    messages,
    setMessages,
    isLoading,
    error,
    send,
    clearChat,
    loadConversation,
    setConversationId,
    retryLastMessage: regenerateLastMessage,
    regenerateLastMessage,
    stopGeneration,
    editAndSend,
  }
}
