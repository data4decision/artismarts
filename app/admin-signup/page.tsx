'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

const SECRET_CODE_REQUIRED = 'D4D_ARTISMART';

export default function AdminSignup() {
  const router = useRouter();

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
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'success'>('form');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): string | null => {
    if (formData.secretCode.trim() !== SECRET_CODE_REQUIRED) return 'Invalid secret code';
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.email.trim() || !formData.email.includes('@')) return 'Valid email is required';
    if (!formData.password.trim() || formData.password.length < 8) return 'Password must be at least 8 characters';
    if (!formData.address.trim()) return 'Residential address is required';
    if (!formData.state.trim()) return 'State is required';
    if (!formData.lga.trim()) return 'LGA is required';
    return null;
  };

  const handleAdminSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const email = formData.email.trim().toLowerCase();

    setLoading(true);
    setError(null);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin-login`,
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            phone: formData.phone.trim() || undefined,
            address: formData.address.trim(),
            state: formData.state.trim(),
            lga: formData.lga.trim(),
            secret_code: formData.secretCode.trim(), // Used by trigger
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('Signup succeeded but no user object returned');

      toast.success('Admin account created! Check your email (including spam) to verify.');
      setStep('success');
    } catch (err: any) {
      let message = 'Failed to create admin account';
      if (err?.message?.includes('duplicate key')) {
        message = 'This email is already registered.';
      } else if (err?.message) {
        message = err.message;
      }
      setError(message);
      toast.error(message);
      console.error('Admin signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────────
  // JSX remains almost identical — only minor cleanup
  // ────────────────────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex items-center justify-center bg-[var(--background)] px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-[var(--blue)] p-8 rounded-xl shadow-2xl">
        <div className="text-center">
          <Link
            href="/"
            className="text-[var(--white)] flex items-center justify-center gap-2 text-sm mb-4 hover:opacity-80"
          >
            <FaArrowLeft size={18} />
            <span>Back to Home</span>
          </Link>

          <h1 className="w-[80%] mx-auto mt-6 text-center text-3xl font-extrabold bg-[var(--white)] text-[var(--blue)] border-2 border-[var(--orange)] rounded-2xl p-3">
            ArtiSmart Admin
          </h1>
          <p className="mt-2 text-lg text-[var(--white)] opacity-90">
            Restricted Admin Registration
          </p>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleAdminSignup} className="mt-8 space-y-6">
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
                className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] px-4 py-3 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
              />
            </div>

            {/* Names */}
            <div className="grid grid-cols-2 gap-4">
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
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] px-4 py-3 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
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
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] px-4 py-3 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
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
                placeholder="admin@artismart.com"
                className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] px-4 py-3 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
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
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] px-4 py-3 pr-12 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-[var(--white)]"
                >
                  {showPassword ? <FaEye /> : <FaEyeSlash />}
                </button>
              </div>
            </div>

            {/* Phone + Address */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[var(--white)]">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+234..."
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] px-4 py-3 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
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
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] px-4 py-3 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
                />
              </div>
            </div>

            {/* State + LGA */}
            <div className="grid grid-cols-2 gap-4">
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
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] px-4 py-3 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
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
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] px-4 py-3 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
                />
              </div>
              
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 border border-transparent rounded-md shadow-md text-base font-semibold text-white bg-[var(--orange)] hover:bg-[var(--orange)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--white)] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating admin account...' : 'Create Admin Account'}
            </button>
            {/* Added signup link for convenience */}
        <div className="text-center text-sm text-[var(--white)] mt-2">
          <p>
            Already have an admin account?{' '}
            <Link
              href="/admin-login"
              className="font-medium text-[var(--orange)] hover:text-[var(--orange)]/80 transition"
            >
              Sign in here
            </Link>
          </p>
        </div>

            {error && (
              <div className="mt-4 p-4 bg-red-900/30 border-l-4 border-red-500 text-red-200 rounded">
                {error}
              </div>
            )}
          </form>
          
        ) : (
          <div className="mt-8 text-center text-[var(--white)] space-y-6">
            <h3 className="text-2xl font-bold">Check Your Email</h3>
            <p className="text-lg">
              A verification link has been sent to <br />
              <strong className="text-[var(--orange)]">{formData.email}</strong>
            </p>
            <p className="text-sm opacity-80">
              Please check your inbox (including spam/junk folder) and click the link to activate your admin account.
            </p>
            <button
              onClick={() => setStep('form')}
              className="mt-4 px-8 py-3 bg-[var(--white)] text-[var(--blue)] rounded-lg font-medium hover:bg-gray-100 transition"
            >
              Back to Form
            </button>
          </div>
        )}
      </div>
    </div>
  );
}