import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getCsrfToken() {
  const match = document.cookie.match(/qyron_csrf=([^;]+)/)
  return match ? match[1] : ''
}

export default function ForgotPasswordPage({ onSwitchToLogin }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify({ email }),
      })
      if (response.ok) {
        setSent(true)
      } else {
        setSent(true)
      }
    } catch {
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center atmospheric-bg p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
            </div>
            <h1 className="text-headline-lg gradient-text font-bold">Qyron</h1>
          </div>

          <div className="glass-panel rounded-2xl p-8 border border-outline-variant/30 text-center">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-success">check_circle</span>
            </div>
            <h2 className="text-headline-sm text-on-surface mb-2">Check your email</h2>
            <p className="text-on-surface-variant text-sm mb-6">
              If an account exists for that email, a password reset link has been sent.
            </p>
            <button
              onClick={onSwitchToLogin}
              className="w-full py-3 px-4 rounded-xl bg-primary text-on-primary font-bold shadow-sm hover:bg-primary/90 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center atmospheric-bg p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
          </div>
          <h1 className="text-headline-lg gradient-text font-bold">Qyron</h1>
          <p className="text-on-surface-variant mt-2">Reset your password</p>
        </div>

        <div className="glass-panel rounded-2xl p-8 border border-outline-variant/30">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-error-container/50 border border-error/20">
                <p className="text-sm text-on-error-container">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-primary text-on-primary font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-on-surface-variant text-sm">
              Remember your password?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-primary font-medium hover:text-primary/80 transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
