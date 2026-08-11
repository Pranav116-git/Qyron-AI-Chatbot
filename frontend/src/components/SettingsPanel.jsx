import { useState } from 'react'
import { authApi } from '../services/api'

export default function SettingsPanel({ onClose, user, onLogout }) {
  const [activeSection, setActiveSection] = useState('profile')
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const showMessage = (text, type = 'success') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  const handleSaveProfile = async () => {
    if (!name.trim()) return
    setSaving(true)
    setMessage('')
    try {
      await authApi.updateProfile(name.trim())
      showMessage('Profile updated successfully.')
    } catch (err) {
      showMessage(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return
    if (newPassword !== confirmPassword) {
      showMessage('New passwords do not match.', 'error')
      return
    }
    if (newPassword.length < 8) {
      showMessage('New password must be at least 8 characters.', 'error')
      return
    }
    setChangingPassword(true)
    setMessage('')
    try {
      await authApi.changePassword(currentPassword, newPassword, confirmPassword)
      showMessage('Password changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      showMessage(err.message, 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== user?.email) return
    setDeleting(true)
    try {
      await authApi.deleteAccount()
      onLogout()
    } catch (err) {
      showMessage(err.message, 'error')
      setDeleting(false)
    }
  }

  const sections = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'security', label: 'Security', icon: 'shield' },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="glass-panel rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden border border-outline-variant/30 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-outline-variant/30">
            <h2 className="text-headline-md text-on-surface">Account</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-container-high/50 transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-40 border-r border-outline-variant/30 p-3 flex flex-col gap-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => { setActiveSection(section.id); setMessage('') }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-colors text-sm ${
                    activeSection === section.id
                      ? 'bg-primary-container/20 text-primary font-medium'
                      : 'text-on-surface-variant hover:bg-surface-container-low/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{section.icon}</span>
                  {section.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {message && (
                <div className={`mb-4 p-3 rounded-xl text-sm ${
                  messageType === 'success'
                    ? 'bg-success/10 border border-success/20 text-success'
                    : 'bg-error-container/50 border border-error/20 text-on-error-container'
                }`}>
                  {message}
                </div>
              )}

              {activeSection === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-label-lg text-on-surface-variant mb-3 uppercase tracking-wider">Profile</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-on-surface-variant mb-1.5">Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          maxLength={255}
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary/50 transition-all text-sm"
                        />
                        <p className="text-xs text-on-surface-variant mt-1">{name.length}/255</p>
                      </div>
                      <div>
                        <label className="block text-sm text-on-surface-variant mb-1.5">Email</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low/30 border border-outline-variant/20 text-on-surface-variant text-sm cursor-not-allowed"
                        />
                        <p className="text-xs text-on-surface-variant mt-1">Email cannot be changed</p>
                      </div>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving || !name.trim() || name.trim() === user?.name}
                        className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-label-lg text-on-surface-variant mb-3 uppercase tracking-wider">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-on-surface-variant mb-1.5">Current Password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          autoComplete="current-password"
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary/50 transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-on-surface-variant mb-1.5">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          autoComplete="new-password"
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary/50 transition-all text-sm"
                        />
                        <p className="text-xs text-on-surface-variant mt-1">Minimum 8 characters</p>
                      </div>
                      <div>
                        <label className="block text-sm text-on-surface-variant mb-1.5">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary/50 transition-all text-sm"
                        />
                      </div>
                      <button
                        onClick={handleChangePassword}
                        disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                        className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {changingPassword ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/30">
                    <h3 className="text-label-lg text-on-surface-variant mb-3 uppercase tracking-wider">Account</h3>
                    <p className="text-sm text-on-surface-variant mb-3">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-5 py-2.5 rounded-xl border border-error/30 text-error text-sm hover:bg-error/10 transition-colors"
                      >
                        Delete Account
                      </button>
                    ) : (
                      <div className="p-4 rounded-xl border border-error/30 bg-error/5 space-y-3">
                        <p className="text-sm text-on-surface">
                          Type your email <span className="font-medium text-error">{user?.email}</span> to confirm:
                        </p>
                        <input
                          type="email"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Enter your email"
                          className="w-full px-3 py-2 rounded-lg bg-surface-container-low/50 border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-error/50"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={deleting || deleteConfirmText !== user?.email}
                            className="px-4 py-2 rounded-xl bg-error text-on-error text-sm font-medium hover:bg-error/90 transition-colors disabled:opacity-50"
                          >
                            {deleting ? 'Deleting...' : 'Permanently Delete'}
                          </button>
                          <button
                            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}
                            className="px-4 py-2 rounded-xl border border-outline-variant/30 text-on-surface-variant text-sm hover:bg-surface-container-low/50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
