import { useEffect, useRef, useState } from 'react'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function GoogleAuthButton({ onSuccess, onError, text = 'Continue with Google' }) {
  const buttonRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Sign-In is not configured.')
      return
    }

    const checkGoogle = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(checkGoogle)
        setLoaded(true)
      }
    }, 100)

    return () => clearInterval(checkGoogle)
  }, [])

  useEffect(() => {
    if (!loaded || !buttonRef.current || !GOOGLE_CLIENT_ID) return

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            onSuccess(response.credential)
          } else {
            onError?.('Google authentication was cancelled.')
          }
        },
        error_callback: (err) => {
          if (err.type === 'popup_failed_to_open') {
            onError?.('Could not open Google sign-in popup. Please allow popups.')
          } else if (err.type === 'popup_closed') {
            onError?.('Google sign-in was cancelled.')
          } else {
            onError?.('Google authentication failed. Please try again.')
          }
        },
      })

      const containerWidth = buttonRef.current.parentElement?.offsetWidth || 320
      const targetWidth = Math.min(Math.max(containerWidth, 200), 400)

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        size: 'large',
        width: targetWidth,
        text: 'continue_with',
        shape: 'rectangular',
        theme: 'outline',
        logo_alignment: 'left',
      })
    } catch (err) {
      console.error('Google Sign-In render error:', err)
      setError('Failed to initialize Google Sign-In button.')
    }
  }, [loaded, onSuccess, onError])

  if (error) {
    return (
      <div className="w-full py-3 px-4 rounded-xl border border-outline-variant/50 text-on-surface-variant text-sm text-center bg-surface-container-low/30">
        {error}
      </div>
    )
  }

  return (
    <div className="w-full relative">
      {!loaded && (
        <div className="w-full py-3 px-4 rounded-xl border border-outline-variant/50 text-on-surface-variant text-sm text-center animate-pulse bg-surface-container-low/30">
          Loading Google Sign-In...
        </div>
      )}
      <div
        ref={buttonRef}
        className={`w-full flex justify-center ${!loaded ? 'hidden' : ''}`}
      />
    </div>
  )
}
