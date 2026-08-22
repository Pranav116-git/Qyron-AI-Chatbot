import { useState } from 'react'

export default function LoginPage({ onLogin, onSwitchToRegister, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setSubmitting(true)
    setLocalError('')
    try {
      await onLogin(email.trim(), password)
    } catch (err) {
      setLocalError(err.message || 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen flex items-center justify-center px-4 atmospheric-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
            </div>
            <h1 className="text-headline-lg font-bold">
              <span className="gradient-text">Qyron</span>
            </h1>
          </div>
          <p className="text-body-lg text-on-surface-variant">Welcome back</p>
        </div>

        <div className="glass-panel rounded-3xl p-8">
          <h2 className="text-headline-sm font-semibold text-on-surface mb-6 text-center">Sign In</h2>

          {displayError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-error-container/20 border border-error/20">
              <p className="text-sm text-error">{displayError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-label-lg text-on-surface-variant mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/50 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-label-lg text-on-surface-variant mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/50 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !email.trim() || !password.trim()}
              className="w-full py-3 rounded-xl bg-primary text-on-primary font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-body-md text-on-surface-variant">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
