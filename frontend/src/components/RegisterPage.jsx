import { useState } from 'react'
import GoogleAuthButton from './GoogleAuthButton'

export default function RegisterPage({ onRegister, onGoogleLogin, onSwitchToLogin, error }) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !username.trim() || !password) return

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    setLocalError('')
    try {
      await onRegister(email.trim(), username.trim(), password)
    } catch (err) {
      setLocalError(err.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleSuccess = async (credential) => {
    setLocalError('')
    try {
      await onGoogleLogin(credential)
    } catch (err) {
      setLocalError(err.message || 'Google sign-in failed. Please try again.')
    }
  }

  const handleGoogleError = (message) => {
    setLocalError(message)
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
          <p className="text-body-lg text-on-surface-variant">Create your account</p>
        </div>

        <div className="glass-panel rounded-3xl p-8">
          <h2 className="text-headline-sm font-semibold text-on-surface mb-6 text-center">Sign Up</h2>

          {displayError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-error-container/20 border border-error/20">
              <p className="text-sm text-error">{displayError}</p>
            </div>
          )}

          <div className="mb-4">
            <GoogleAuthButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="Continue with Google"
            />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-outline-variant/50"></div>
            <span className="text-xs text-on-surface-variant/70 uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-outline-variant/50"></div>
          </div>

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
              <label className="block text-label-lg text-on-surface-variant mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                minLength={3}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/50 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-label-lg text-on-surface-variant mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/50 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-label-lg text-on-surface-variant mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/50 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !email.trim() || !username.trim() || !password || !confirmPassword}
              className="w-full py-3 rounded-xl bg-primary text-on-primary font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-body-md text-on-surface-variant">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
