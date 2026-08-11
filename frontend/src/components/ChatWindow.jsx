import { useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import LoadingIndicator from './LoadingIndicator'

export default function ChatWindow({ messages, isLoading, onRegenerate, onEdit }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isLast={index === messages.length - 1}
            onRegenerate={onRegenerate}
            onEdit={onEdit}
          />
        ))}
        {isLoading && <LoadingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
