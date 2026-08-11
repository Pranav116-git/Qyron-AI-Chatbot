export default function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="px-4 py-3 rounded-2xl rounded-bl-md border" style={{ background: 'var(--surface-container-lowest)', borderColor: 'var(--outline-variant)' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}>
              <span className="material-symbols-outlined text-sm" style={{ color: 'var(--primary)' }}>auto_awesome</span>
            </div>
            <span className="text-sm" style={{ color: 'var(--surface-on-variant)' }}>Qyron is thinking</span>
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--primary)', animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--primary)', animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--primary)', animationDelay: '300ms' }} />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
