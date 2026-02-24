'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaSave } from 'react-icons/fa'
import { User } from '@supabase/supabase-js'

const Page = () => {
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [lastLogin, setLastLogin] = useState<string | null>(null)
  const [accountCreationDate, setAccountCreationDate] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStrength, setPasswordStrength] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    let mounted = true

    const fetchUser = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !mounted) return

        setUser(user)
        setAccountCreationDate(user.created_at)

        const { data: { session } } = await supabase.auth.getSession()
        setLastLogin(session?.user?.last_sign_in_at ?? null)
      } catch (err) {
        console.error('Error fetching user:', err)
        toast.error('Failed to load account information')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchUser()

    return () => {
      mounted = false
    }
  }, [])

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (!user?.email) {
      toast.error('No email found for this account')
      return
    }

    setActionLoading(true)

    try {
      // Step 1: Re-authenticate with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        toast.error('Current password is incorrect')
        return
      }

      // Step 2: Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      toast.success('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordStrength(null)
      setPasswordError('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password'
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!user?.email) {
      toast.error('No email found for this account')
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      toast.success('Password reset email sent! Check your inbox.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email'
      toast.error(message)
    }
  }

  const handlePasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength(null)
      setPasswordError('')
      return
    }

    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const isLongEnough = password.length >= 8

    const strengthScore = +isLongEnough + +hasUpper + +hasLower + +hasNumber + +hasSpecial

    if (strengthScore >= 5) {
      setPasswordStrength('strong')
      setPasswordError('')
    } else if (strengthScore >= 3) {
      setPasswordStrength('medium')
      setPasswordError('Password is okay, but could be stronger')
    } else {
      setPasswordStrength('weak')
      setPasswordError('Password is too weak')
    }
  }

  const handleLogoutFromAllDevices = async () => {
    setActionLoading(true)
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' })

      if (error) throw error

      toast.success('Logged out from all devices!')
      // Optional: force redirect after global sign out
      // window.location.href = '/login'
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log out'
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center p-8 flex items-center justify-center min-h-[50vh]">
        <span className="w-8 h-8 rounded-full animate-spin border-4 border-[var(--blue)] border-t-transparent"></span>
        <p className="ml-3 text-[var(--blue)] text-sm">Loading account details...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center p-8 text-red-600">
        Please log in to view account details.
      </div>
    )
  }

  return (
    <div className="font-roboto min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-xl sm:text-3xl font-bold text-[var(--blue)] mb-8">
          Account Login Details
        </h1>

        <div className="bg-white rounded-xl shadow-lg border border-[var(--orange)] overflow-hidden">
          <div className="p-6 sm:p-10 bg-gradient-to-r from-[var(--blue)]/10 to-[var(--white)]">
            {/* Email Section */}
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-[var(--blue)] font-bold">
                Login Email <span className="text-sm text-[var(--blue)]/70">(Read-Only)</span>
              </h3>
              <p className="text-sm text-[var(--orange)] mt-2">
                Email address cannot be changed. Contact support if this is an issue.
              </p>
              <p className="text-lg font-medium mt-4 text-[var(--blue)]/90">
                {user.email || 'No email available'}
              </p>
            </div>

            {/* Change Password */}
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-[var(--blue)] mb-4">Change Password</h3>
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label
                    htmlFor="current-password"
                    className="block text-sm font-medium text-[var(--orange)]"
                  >
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 mt-1 border border-[var(--orange)] rounded-lg focus:ring-2 focus:ring-[var(--blue)] focus:border-[var(--orange)] outline-none"
                    required
                    disabled={actionLoading}
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-medium text-[var(--orange)]"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      handlePasswordStrength(e.target.value)
                    }}
                    className="w-full px-4 py-2.5 mt-1 border border-[var(--orange)] rounded-lg focus:ring-2 focus:ring-[var(--blue)] focus:border-[var(--orange)] outline-none"
                    required
                    disabled={actionLoading}
                  />
                  {passwordError && (
                    <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                  )}
                  {passwordStrength && (
                    <p
                      className={`mt-1 text-sm font-medium ${
                        passwordStrength === 'strong'
                          ? 'text-green-600'
                          : passwordStrength === 'medium'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      Password strength:{' '}
                      {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-[var(--orange)]"
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 mt-1 border border-[var(--orange)] rounded-lg focus:ring-2 focus:ring-[var(--blue)] focus:border-[var(--orange)] outline-none"
                    required
                    disabled={actionLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[var(--orange)] text-white px-6 py-3 flex items-center gap-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaSave />
                  {actionLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Forgot Password */}
            <div className="mb-10">
              <button
                onClick={handleResetPassword}
                disabled={actionLoading}
                className="text-[var(--blue)] text-sm font-medium hover:text-[var(--orange)] transition-colors disabled:opacity-50"
              >
                Forgot password? Reset it here
              </button>
            </div>

            {/* Security Info */}
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-[var(--blue)] mb-4">Security Information</h3>
              <p className="text-gray-700">
                Last login:{' '}
                <span className="font-medium">
                  {lastLogin ? new Date(lastLogin).toLocaleString() : 'Not available'}
                </span>
              </p>
              <p className="mt-2 text-gray-700">
                Account created:{' '}
                <span className="font-medium">
                  {accountCreationDate
                    ? new Date(accountCreationDate).toLocaleDateString()
                    : 'Not available'}
                </span>
              </p>
            </div>

            {/* Logout from all devices */}
            <div>
              <h3 className="text-lg font-semibold text-[var(--blue)] mb-4">Active Sessions</h3>
              <button
                onClick={handleLogoutFromAllDevices}
                disabled={actionLoading}
                className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Logging out...' : 'Log out from all devices'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page