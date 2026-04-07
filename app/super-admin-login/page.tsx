'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa'
import Link from 'next/link'

export default function SuperAdminLogin() {
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email.trim() || !formData.password.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      })

      if (signInError) throw signInError
      if (!data.user) throw new Error('Login failed - no user returned')

      // Optional: Check if this is really a superadmin (extra safety)
      const { data: profile, error: profileError } = await supabase
        .from('super_admin_profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile) {
        await supabase.auth.signOut()
        throw new Error('Access denied: Not a Super Admin account')
      }

      toast.success('Welcome back, Super Admin!')

      // Redirect to your admin dashboard (adjust path as needed)
      router.push('/super-admin')
      // or router.replace('/super-admin/dashboard') to prevent back navigation to login

    } catch (err: any) {
      const message =
        err?.message?.includes('Invalid login credentials')
          ? 'Incorrect email or password'
          : err?.message || 'Failed to sign in'

      setError(message)
      toast.error(message)
      console.error('Super admin login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--white)] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[var(--blue)] px-6 py-8 rounded-lg shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--white)] text-sm hover:opacity-80 transition-opacity"
          >
            <FaArrowLeft size={20} />
            <span>Back</span>
          </Link>

          <h1 className="bg-[var(--white)] text-[var(--blue)] border-4 border-[var(--orange)] px-4 py-2 rounded-lg font-bold text-xl">
            Artismart Super Admin
          </h1>
        </div>

        <h2 className="text-[var(--white)] text-2xl sm:text-3xl font-bold text-center mb-2">
          Super Admin Login
        </h2>
        <p className="text-[var(--white)] opacity-70 text-center text-sm mb-10">
          Restricted Access
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--white)]">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="superadmin@artismart.com"
              autoComplete="email"
              className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--orange)]"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-[var(--white)]">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[var(--orange)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--white)] hover:text-[var(--orange)]"
              >
                {showPassword ? <FaEye size={18} /> : <FaEyeSlash size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-center text-red-300 text-sm mt-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-[var(--orange)] hover:bg-[var(--orange)]/90 disabled:opacity-50 transition-colors mt-4"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center mt-6">
            <Link
              href="/super-admin-signup"
              className="text-[var(--white)] hover:text-[var(--orange)] text-sm font-medium transition-colors"
            >
              Don't have an account? Create one
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}