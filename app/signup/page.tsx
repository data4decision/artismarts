'use client'
import Link from 'next/link'
import React, { useState } from 'react'
import { FaArrowLeft, FaCheck, FaEye, FaEyeSlash } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Step = 'role' | 'form'

const Page = () => {
  const router = useRouter()
  const [step, setStep] = useState<Step>('role')
  const [selectedRole, setSelectRole] = useState<'customer' | 'artisan' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)   

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    state: '',
    lga: '',
  })

  const handleRoleSelect = (role: 'customer' | 'artisan') => {
    setSelectRole(role)
    setStep('form')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,           // fixed: ..prev → ...prev
      [name]: value,
    }))
  }

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) return 'First name is required'
    if (!formData.lastName.trim()) return 'Last name is required'

    if (!formData.email.trim()) return 'Email is required'
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      return 'Please enter a valid email address'    
    }

    if (!formData.password.trim()) return 'Password is required'
    if (!formData.address.trim()) return 'Address is required'
    if (!formData.state.trim()) return 'State is required'
    if (!formData.lga.trim()) return 'LGA is required'

    return null
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateForm()           
    if (validationError) {
      toast.error(validationError)
      return
    }

    const emailToUse = formData.email.trim().toLowerCase()   

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailToUse,                             
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            role: selectedRole,
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
          }
        }
      })

      if (signUpError) throw signUpError
      if (!signUpData?.user) throw new Error('No user returned after signup')

      const { error: profileError } = await supabase.from('profiles').insert({
        id: signUpData.user.id,
        role: selectedRole!,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone: formData.phone.trim() || null,
        residential_address: formData.address.trim(),
        state: formData.state.trim(),
        lga: formData.lga.trim(),
      })

      if (profileError) {
        console.error('Profile creation failed:', profileError)
        throw new Error('Failed to create user profile. Please contact support.')
      }

      setSuccess(true)
      toast.success('Account created! Kindly login.')

      setTimeout(() => {
        router.push('/login')
      }, 2800)

    } catch (err: unknown) {
      const message = (err as Error)?.message || 'Failed to create account'
      setError(message)
      toast.error(message)
      console.error('Signup error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="font-roboto min-h-screen flex items-center justify-center bg-[var(--blue)]/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[var(--blue)] px-4 py-8 rounded-lg">
        <div className="flex gap-10 items-center">
          <p>
            <Link href="/" className="text-[var(--white)] flex items-center gap-2 px-2 py-3 text-sm">
              <FaArrowLeft size={20} className="text-[var(--white)]" />
              <span className="text-[var(--white)] text-sm">Back</span>
            </Link>
          </p>
          <h1 className="w-[46%] bg-[var(--white)] text-[var(--blue)] border-4 border-[var(--orange)] rounded-lg pl-4 py-1 text-2xl sm:text-3xl md:text-3xl font-bold">
            Artismart
          </h1>
        </div>

        <h2 className="mt-5 text-[var(--white)] text-xl text-center md:text-2xl lg:text-2xl font-semibold">
          Create Your Account
        </h2>
        <p className="mt-4 text-center text-[var(--white)] text-sm md:text-xl lg:text-xl">
          Join Our Community
        </p>

        {step === 'role' ? (
          <div className="space-y-6">
            <p className="text-[var(--white)] text-xl font-semibold">I want to Sign up as:</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => handleRoleSelect('customer')}
                className="bg-[var(--white)] border-2 border-[var(--orange)] rounded-lg p-6 hover:border-[var(--blue)] transition-all text-center"
              >
                <div className="text-2xl font-bold text-[var(--blue)] mb-2">Customer</div>
                <p className="text-sm text-[var(--blue)]">Looking for artisans and services</p>
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('artisan')}
                className="bg-[var(--white)] border-2 border-[var(--orange)] rounded-lg p-6 hover:border-[var(--blue)] transition-all text-center"
              >
                <div className="text-2xl font-bold text-[var(--blue)] mb-2">Artisan</div>
                <p className="text-sm text-[var(--blue)]">Offering professional services and skills</p>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSignUp} className="mt-6 space-y-6">
            <div className="text-center mb-4">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-[var(--orange)] text-sm font-medium">
                Sign in as {selectedRole}
              </span>
            </div>

            {success ? (
              <div className="text-center py-10 space-y-4">
                <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-green-500">
                  <FaCheck size={50} className="text-white bg-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--green)]">Successfully Signup</h3>
                <p className="text-[var(--white)]">Redirecting to login...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-[var(--white)]">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--white)] text-[var(--blue)] shadow-sm focus:border-[var(--orange)] px-3 py-2"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-[var(--white)]">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"                    // fixed: lasttName → lastName
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--white)] text-[var(--blue)] shadow-sm focus:border-[var(--orange)] px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[var(--white)]">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@gmail.com"
                      className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--white)] text-[var(--blue)] shadow-sm focus:border-[var(--orange)] px-3 py-2"
                    />
                  </div>

                  <div className="relative">
                    <label htmlFor="password" className="block text-sm font-medium text-[var(--white)]">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Choose any password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--white)] text-[var(--blue)] shadow-sm focus:border-[var(--orange)] px-3 py-2 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--white)]"
                    >
                      {showPassword ? <FaEye /> : <FaEyeSlash />}
                    </button>
                    <p className="mt-1 text-xs text-[var(--white)] opacity-70">
                      Use something easy to remember
                    </p>
                  </div>
                </div>

                {/* Phone + Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-[var(--white)]">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--white)] text-[var(--blue)] shadow-sm focus:border-[var(--orange)] px-3 py-2"
                    />
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-[var(--white)]">
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--white)] text-[var(--blue)] shadow-sm focus:border-[var(--orange)] px-3 py-2"
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
                      type="text"
                      id="state"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--white)] text-[var(--blue)] shadow-sm focus:border-[var(--orange)] px-3 py-2"
                    />
                  </div>

                  <div>
                    <label htmlFor="lga" className="block text-sm font-medium text-[var(--white)]">
                      LGA
                    </label>
                    <input
                      type="text"
                      id="lga"
                      name="lga"
                      required
                      value={formData.lga}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--white)] text-[var(--blue)] shadow-sm focus:border-[var(--orange)] px-3 py-2"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--orange)] hover:bg-[var(--orange)]/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating account...' : 'Sign Up'}
                </button>

                {error && (
                  <p className="text-center text-red-300 mt-2">
                    {error}
                  </p>
                )}
              </>
            )}

            {!success && (
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep('role')
                    setSelectRole(null)
                  }}
                  className="text-[var(--white)] hover:text-[var(--orange)] font-medium"
                >
                  <p className="flex items-center gap-3 text-[var(--white)] justify-center">
                    <FaArrowLeft />
                    <span>Change Role</span>
                  </p>
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}

export default Page