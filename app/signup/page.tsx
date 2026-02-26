'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

// Get the correct base URL (works in dev & production)
const getBaseUrl = () => {
  // In production → use env variable (set in Vercel/Netlify/Hosting dashboard)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Client-side fallback (works during local dev)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Server-side fallback (rare case)
  return 'http://localhost:3000'; // won't be used in production
};

type Step = 'role' | 'form' | 'success';

export default function SignUp() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('role');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'artisan' | null>(null);

  const [formData, setFormData] = useState({
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
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [passwordError, setPasswordError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRoleSelect = (role: 'customer' | 'artisan') => {
    setSelectedRole(role);
    setStep('form');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'password') {
      evaluatePasswordStrength(value);
    }
  };

  const evaluatePasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength(null);
      setPasswordError('');
      return;
    }

    const hasUpper   = /[A-Z]/.test(password);
    const hasLower   = /[a-z]/.test(password);
    const hasNumber  = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const longEnough = password.length >= 8;

    const score = +longEnough + +hasUpper + +hasLower + +hasNumber + +hasSpecial;

    if (score >= 5) {
      setPasswordStrength('strong');
      setPasswordError('');
    } else if (score >= 3) {
      setPasswordStrength('medium');
      setPasswordError('Password is okay, but could be stronger');
    } else {
      setPasswordStrength('weak');
      setPasswordError('Password is too weak');
    }
  };

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim())  return 'Last name is required';
    if (!formData.email.trim())     return 'Email is required';
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      return 'Please enter a valid email address';
    }
    if (!formData.password.trim()) return 'Password is required';

    const pw = formData.password;
    if (pw.length < 8)               return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(pw))           return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(pw))           return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(pw))           return 'Password must contain at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw)) {
      return 'Password must contain at least one special character';
    }

    if (!formData.address.trim()) return 'Address is required';
    if (!formData.state.trim())   return 'State is required';
    if (!formData.lga.trim())     return 'LGA is required';

    return null;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const email = formData.email.trim().toLowerCase();
    const baseUrl = getBaseUrl();

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Supabase Auth signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          // Use reliable base URL + path
          emailRedirectTo: `${baseUrl}/login?from=signup`,
          data: {
            role: selectedRole,
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned after signup');

      // 2. Insert into profiles table
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        role: selectedRole!,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone: formData.phone.trim() || null,
        residential_address: formData.address.trim(),
        state: formData.state.trim(),
        lga: formData.lga.trim(),
      });

      if (profileError) throw profileError;

      toast.success('Account created! Check your email to verify.');

      if (authData.session) {
        // auto-login (if email confirmations are disabled)
        const path = selectedRole === 'artisan' ? '/dashboard/artisan' : '/dashboard/customer';
        router.push(path);
      } else {
        setStep('success');
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to create account';
      console.error('Signup error:', err);
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[var(--blue)] px-6 py-10 rounded-xl shadow-xl">
        <div>
          <p className="mb-4">
            <Link href="/" className="text-[var(--white)] flex items-center gap-2 text-sm hover:text-[var(--orange)] transition-colors">
              <FaArrowLeft size={18} />
              <span>Back to home</span>
            </Link>
          </p>

          <h1 className="w-3/5 mx-auto text-center text-3xl font-extrabold bg-[var(--white)] text-[var(--blue)] border-2 border-[var(--orange)] rounded-2xl p-3 shadow">
            Artismart
          </h1>

          <h2 className="mt-8 text-center text-3xl font-bold text-[var(--white)]">
            Create your account
          </h2>
          <p className="mt-3 text-center text-sm text-[var(--white)] opacity-90">
            Join our community of skilled artisans & happy customers
          </p>
        </div>

        {step === 'role' ? (
          <div className="space-y-8 pt-4">
            <p className="text-center text-xl font-semibold text-[var(--orange)]">
              I want to sign up as:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button
                onClick={() => handleRoleSelect('customer')}
                className="bg-[var(--white)] border-2 border-[var(--orange)] rounded-xl p-6 text-center hover:border-[var(--orange)] hover:shadow-lg transition-all duration-200"
              >
                <div className="text-2xl font-bold text-[var(--blue)] mb-2">Customer</div>
                <p className="text-sm text-[var(--blue)] opacity-90">
                  Looking for artisans & quality services
                </p>
              </button>

              <button
                onClick={() => handleRoleSelect('artisan')}
                className="bg-[var(--white)] border-2 border-[var(--orange)] rounded-xl p-6 text-center hover:border-[var(--orange)] hover:shadow-lg transition-all duration-200"
              >
                <div className="text-2xl font-bold text-[var(--blue)] mb-2">Artisan</div>
                <p className="text-sm text-[var(--blue)] opacity-90">
                  Offering professional skills & services
                </p>
              </button>
            </div>
          </div>
        ) : step === 'form' ? (
          <form onSubmit={handleSignUp} className="mt-6 space-y-6">
            <div className="text-center">
              <span className="inline-flex px-5 py-1.5 rounded-full bg-[var(--orange)]/20 text-[var(--orange)] text-sm font-semibold">
                Signing up as {selectedRole}
              </span>
            </div>

            {/* Names */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[var(--white)] mb-1.5">First Name</label>
                <input
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-[var(--orange)]/60 bg-[var(--white)]/10 text-[var(--white)] placeholder:text-[var(--white)]/60 px-4 py-2.5 focus:border-[var(--orange)] focus:bg-[var(--white)]/5 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--white)] mb-1.5">Last Name</label>
                <input
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-[var(--orange)]/60 bg-[var(--white)]/10 text-[var(--white)] placeholder:text-[var(--white)]/60 px-4 py-2.5 focus:border-[var(--orange)] focus:bg-[var(--white)]/5 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[var(--white)] mb-1.5">Email address</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="block w-full rounded-lg border border-[var(--orange)]/60 bg-[var(--white)]/10 text-[var(--white)] placeholder:text-[var(--white)]/60 px-4 py-2.5 focus:border-[var(--orange)] focus:bg-[var(--white)]/5 focus:outline-none transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[var(--white)] mb-1.5">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-[var(--orange)]/60 bg-[var(--white)]/10 text-[var(--white)] placeholder:text-[var(--white)]/60 px-4 py-2.5 pr-11 focus:border-[var(--orange)] focus:bg-[var(--white)]/5 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--white)]/80 hover:text-[var(--orange)]"
                >
                  {showPassword ? <FaEye size={18} /> : <FaEyeSlash size={18} />}
                </button>
              </div>

              {formData.password && (
                <div className="mt-2 text-sm">
                  {passwordStrength === 'strong'   && <p className="text-green-400 font-medium">Strong ✓</p>}
                  {passwordStrength === 'medium'  && <p className="text-yellow-300">Okay, but can improve</p>}
                  {passwordStrength === 'weak'    && <p className="text-red-400">Too weak</p>}
                  {passwordError && <p className="text-red-300 mt-1">{passwordError}</p>}
                </div>
              )}
            </div>

            {/* Phone + Address */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[var(--white)] mb-1.5">Phone Number</label>
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+2348012345678"
                  className="block w-full rounded-lg border border-[var(--orange)]/60 bg-[var(--white)]/10 text-[var(--white)] placeholder:text-[var(--white)]/60 px-4 py-2.5 focus:border-[var(--orange)] focus:bg-[var(--white)]/5 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--white)] mb-1.5">Residential Address</label>
                <input
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-[var(--orange)]/60 bg-[var(--white)]/10 text-[var(--white)] placeholder:text-[var(--white)]/60 px-4 py-2.5 focus:border-[var(--orange)] focus:bg-[var(--white)]/5 focus:outline-none transition"
                />
              </div>
            </div>

            {/* State + LGA */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[var(--white)] mb-1.5">State</label>
                <input
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-[var(--orange)]/60 bg-[var(--white)]/10 text-[var(--white)] placeholder:text-[var(--white)]/60 px-4 py-2.5 focus:border-[var(--orange)] focus:bg-[var(--white)]/5 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--white)] mb-1.5">LGA</label>
                <input
                  name="lga"
                  type="text"
                  value={formData.lga}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-[var(--orange)]/60 bg-[var(--white)]/10 text-[var(--white)] placeholder:text-[var(--white)]/60 px-4 py-2.5 focus:border-[var(--orange)] focus:bg-[var(--white)]/5 focus:outline-none transition"
                />
              </div>
            </div>

            {errorMsg && <p className="text-red-300 text-center text-sm">{errorMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg font-semibold text-[var(--white)] bg-[var(--orange)] hover:bg-[var(--orange)]/90 disabled:opacity-60 transition disabled:cursor-not-allowed shadow-md"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => { setStep('role'); setSelectedRole(null); }}
                className="text-[var(--white)] hover:text-[var(--orange)] font-medium transition"
              >
                ← Change role
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 text-center text-[var(--white)] space-y-5">
            <h3 className="text-2xl font-semibold">Verify your email</h3>
            <p>
              We sent a confirmation link to <strong className="text-[var(--orange)]">{formData.email}</strong>
            </p>
            <p className="text-sm opacity-85">
              Please check your inbox (including spam/junk) and click the link to activate your account.
            </p>
            <button
              type="button"
              onClick={() => setStep('form')}
              className="mt-3 px-6 py-2.5 rounded-lg text-[var(--blue)] bg-[var(--white)] hover:bg-[var(--white)]/90 font-medium transition"
            >
              Back to form
            </button>
          </div>
        )}
      </div>
    </div>
  );
}