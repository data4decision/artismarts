'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa'
import Link from 'next/link'

const SUPER_ADMIN_SECRET_CODE = 'ARTISMART@D4D'

export default function SuperAdminSignup() {
  const router = useRouter()

  const [step, setStep] = useState<'role' | 'form' | 'success'>('role')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    secretCode: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '+234',
    address: '',
    state: '',
    lga: '',
  })

  const handleRoleSelect = () => {
    setStep('form')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = (): string | null => {
    if (formData.secretCode.trim() !== SUPER_ADMIN_SECRET_CODE) {
      return 'Invalid secret code'
    }
    if (!formData.firstName.trim()) return 'First name is required'
    if (!formData.lastName.trim()) return 'Last name is required'
    if (!formData.email.trim() || !formData.email.includes('@')) return 'Valid email is required'
    if (!formData.password.trim()) return 'Password is required'
    if (!formData.address.trim()) return 'Address is required'
    if (!formData.state.trim()) return 'State is required'
    if (!formData.lga.trim()) return 'LGA is required'

    return null
  }

  const handleSuperAdminSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    const email = formData.email.trim().toLowerCase()

    setLoading(true)
    setError(null)

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            role: 'superadmin',
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            phone: formData.phone.trim() || undefined,
            address: formData.address.trim(),
            state: formData.state.trim(),
            lga: formData.lga.trim(),
          },
        },
      })

      if (signUpError) throw signUpError
      if (!signUpData.user) throw new Error('No user returned after signup')

      // Insert into super_admin_profiles
      const { error: profileError } = await supabase.from('super_admin_profiles').insert({
        id: signUpData.user.id,
        secret_code: formData.secretCode.trim(),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone: formData.phone.trim() || null,
        residential_address: formData.address.trim(),
        state: formData.state.trim(),
        lga: formData.lga.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error('Profile insert failed:', profileError)
        throw new Error('Failed to create super admin profile: ' + (profileError.message || 'Unknown error'))
      }

      toast.success('Super Admin account created successfully!')

      // Redirect to login page (as requested)
      router.push('/super-admin-login')

    } catch (err: any) {
      const message = err?.message?.includes('duplicate key')
        ? 'This email is already registered.'
        : err?.message || 'Failed to create super admin account'

      setError(message)
      toast.error(message)
      console.error('Super admin signup error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--white)] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[var(--blue)] px-6 py-8 rounded-lg shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2 text-[var(--white)] text-sm hover:opacity-80">
            <FaArrowLeft size={20} />
            <span>Back</span>
          </Link>

          <h1 className="bg-[var(--white)] text-[var(--blue)] border-4 border-[var(--orange)] px-4 py-2 rounded-lg font-bold text-xl">
            Artismart Super Admin
          </h1>
        </div>

        <h2 className="text-[var(--white)] text-2xl font-bold text-center mb-2">
          Create Super Admin Account
        </h2>
        <p className="text-[var(--white)] opacity-70 text-center text-sm mb-8">
          Restricted Access
        </p>

        {step === 'role' ? (
          <div className="space-y-6">
            <h3 className="text-[var(--orange)] text-xl font-semibold text-center">
              Ready to register?
            </h3>

            <button
              type="button"
              onClick={handleRoleSelect}
              className="w-full bg-[var(--white)] border-2 border-[var(--orange)] rounded-lg p-8 hover:border-[var(--blue)] transition-all text-center"
            >
              <div className="text-3xl font-bold text-[var(--blue)] mb-3">Super Admin</div>
              <p className="text-base text-[var(--blue)] opacity-90">Platform Overseer</p>
            </button>
          </div>
        ) : step === 'form' ? (
          <form onSubmit={handleSuperAdminSignUp} className="space-y-6">
            <div className="text-center mb-4">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-[var(--orange)]/10 text-[var(--orange)] text-sm font-medium">
                Registering as Super Admin
              </span>
            </div>

            {/* Secret Code */}
            <div>
              <label htmlFor="secretCode" className="block text-sm font-medium text-[var(--white)]">
                Secret Code
              </label>
              <input
                id="secretCode"
                name="secretCode"
                type="text"
                required
                value={formData.secretCode}
                onChange={handleChange}
                placeholder="Enter secret code"
                className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2"
              />
            </div>

            {/* Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-[var(--white)]">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-[var(--white)]">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2"
                />
              </div>
            </div>

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
                className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2"
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
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--white)]"
                >
                  {showPassword ? <FaEye /> : <FaEyeSlash />}
                </button>
              </div>
              <p className="mt-1 text-xs text-[var(--white)] opacity-70">
                Use something easy to remember
              </p>
            </div>

            {/* Phone + Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[var(--white)]">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+2348012345678"
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-[var(--white)]">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2"
                />
              </div>
            </div>

            {/* State + LGA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-[var(--white)]">
                  State
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="lga" className="block text-sm font-medium text-[var(--white)]">
                  LGA
                </label>
                <input
                  id="lga"
                  name="lga"
                  type="text"
                  required
                  value={formData.lga}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--orange)] hover:bg-[var(--orange)]/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating account...' : 'Create Super Admin Account'}
            </button>

            {error && <p className="text-center text-red-300 mt-2">{error}</p>}

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setStep('role')}
                className="text-[var(--white)] hover:text-[var(--orange)] font-medium"
              >
                ← Back
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 text-center text-[var(--white)] space-y-4">
            <h3 className="text-2xl font-bold">Account Created!</h3>
            <p>Super Admin account has been created successfully.</p>
            <p className="text-sm opacity-80">Redirecting to login...</p>
          </div>
        )}
      </div>
    </div>
  )
}