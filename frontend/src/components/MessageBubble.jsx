import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'

const codeTheme = {
  'code[class*="language-"]': { color: '#e2e8f0' },
  'pre[class*="language-"]': { color: '#e2e8f0' },
  comment: { color: '#64748b' },
  prolog: { color: '#64748b' },
  doctype: { color: '#64748b' },
  cdata: { color: '#64748b' },
  punctuation: { color: '#94a3b8' },
  property: { color: '#7dd3fc' },
  tag: { color: '#7dd3fc' },
  boolean: { color: '#f472b6' },
  number: { color: '#f472b6' },
  constant: { color: '#f472b6' },
  symbol: { color: '#f472b6' },
  selector: { color: '#86efac' },
  'attr-name': { color: '#fde68a' },
  string: { color: '#86efac' },
  char: { color: '#86efac' },
  builtin: { color: '#c4b5fd' },
  inserted: { color: '#86efac' },
  operator: { color: '#f9a8d4' },
  entity: { color: '#f9a8d4' },
  url: { color: '#f9a8d4' },
  atrule: { color: '#c4b5fd' },
  'attr-value': { color: '#86efac' },
  keyword: { color: '#c4b5fd' },
  function: { color: '#7dd3fc' },
  'class-name': { color: '#fde68a' },
  regex: { color: '#fde68a' },
  important: { color: '#fde68a' },
  variable: { color: '#e2e8f0' },
}

function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = children
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--outline-variant)' }}>
      <div className="flex items-center justify-between px-4 py-2 text-xs" style={{ background: 'var(--inverse-surface)', color: 'var(--inverse-on-surface)' }}>
        <span className="text-label-md">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:opacity-80 transition-opacity text-label-md"
        >
          {copied ? (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
              Copied
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
              Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={codeTheme}
        customStyle={{ margin: 0, borderRadius: 0, background: '#0f172a' }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}

export default function MessageBubble({ message, isLast, onRegenerate, onEdit }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const bubbleRef = useRef(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = message.content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`group flex flex-col ${isUser ? 'items-end' : 'items-start'} focus-within:opacity-100`} tabIndex={-1}>
      <div className={`max-w-[85%] ${isUser ? 'order-1' : 'order-1'}`}>
        <div
          ref={bubbleRef}
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'rounded-br-md'
              : 'rounded-bl-md border'
          }`}
          style={isUser
            ? { background: 'var(--primary)', color: 'var(--primary-on)' }
            : { background: 'var(--surface-container-lowest)', color: 'var(--surface-on)', borderColor: 'var(--outline-variant)' }
          }
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    if (!inline && match) {
                      return (
                        <CodeBlock language={match[1]}>
                          {String(children).replace(/\n$/, '')}
                        </CodeBlock>
                      )
                    }
                    if (!inline && !match && String(children).includes('\n')) {
                      return (
                        <CodeBlock language="text">
                          {String(children).replace(/\n$/, '')}
                        </CodeBlock>
                      )
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Message actions */}
        <div className={`flex items-center gap-1 mt-1 ${isUser ? 'justify-end mr-1' : 'ml-1'} opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity`}>
          {isUser ? (
            <>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-surface-container-high/50 transition-colors"
                title="Copy message"
                aria-label="Copy message"
              >
                {copied ? (
                  <span className="material-symbols-outlined text-sm" style={{ color: 'var(--success)' }}>check</span>
                ) : (
                  <span className="material-symbols-outlined text-sm" style={{ color: 'var(--surface-on-variant)' }}>content_copy</span>
                )}
              </button>
              {onEdit && (
                <button
                  onClick={() => onEdit(message)}
                  className="p-1.5 rounded-lg hover:bg-surface-container-high/50 transition-colors"
                  title="Edit message"
                  aria-label="Edit message"
                >
                  <span className="material-symbols-outlined text-sm" style={{ color: 'var(--surface-on-variant)' }}>edit</span>
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-surface-container-high/50 transition-colors"
                title="Copy response"
                aria-label="Copy response"
              >
                {copied ? (
                  <span className="material-symbols-outlined text-sm" style={{ color: 'var(--success)' }}>check</span>
                ) : (
                  <span className="material-symbols-outlined text-sm" style={{ color: 'var(--surface-on-variant)' }}>content_copy</span>
                )}
              </button>
              {isLast && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1.5 rounded-lg hover:bg-surface-container-high/50 transition-colors"
                  title="Regenerate response"
                  aria-label="Regenerate response"
                >
                  <span className="material-symbols-outlined text-sm" style={{ color: 'var(--surface-on-variant)' }}>refresh</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
