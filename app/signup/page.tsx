'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase';  
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link'

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
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelect = (role: 'customer' | 'artisan') => {
    setSelectedRole(role);
    setStep('form');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

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

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    const strengthScore = +isLongEnough + +hasUpper + +hasLower + +hasNumber + +hasSpecial;

    if (strengthScore >= 5) {
      setPasswordStrength('strong');
      setPasswordError('');
    } else if (strengthScore >= 3) {
      setPasswordStrength('medium');
      setPasswordError('Password is okay, but could be stronger');
    } else {
      setPasswordStrength('weak');
      setPasswordError('Password is too weak');
    }
  };

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';

    if (!formData.email.trim()) return 'Email is required';
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      return 'Please enter a valid email address';
    }

    if (!formData.password.trim()) return 'Password is required';

    const hasUpper = /[A-Z]/.test(formData.password);
    const hasLower = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
    const isLongEnough = formData.password.length >= 8;

    if (!isLongEnough) return 'Password must be at least 8 characters long';
    if (!hasUpper) return 'Password must contain at least one uppercase letter';
    if (!hasLower) return 'Password must contain at least one lowercase letter';
    if (!hasNumber) return 'Password must contain at least one number';
    if (!hasSpecial) return 'Password must contain at least one special character';

    if (!formData.address.trim()) return 'Address is required';
    if (!formData.state.trim()) return 'State is required';
    if (!formData.lga.trim()) return 'LGA is required';

    return null;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const emailToUse = formData.email.trim().toLowerCase();

    setLoading(true);

    try {
      // 1. Sign up with Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailToUse,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            role: selectedRole,
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('No user returned after signup');

      // 2. Insert profile record
      const { error: profileError } = await supabase.from('profiles').insert({
        id: signUpData.user.id,
        role: selectedRole!,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone: formData.phone.trim() || null,
        residential_address: formData.address.trim(),
        state: formData.state.trim(),
        lga: formData.lga.trim(),
      });

      if (profileError) {
        console.error('Profile creation failed:', profileError);
        throw new Error('Failed to create user profile. Please contact support.');
      }

      // Success path
      toast.success('Account created! Check your email to verify.');

      if (signUpData.session) {
        // Instant login (if email confirmation is disabled in your project)
        const redirectPath =
          selectedRole === 'artisan' ? '/dashboard/artisan' : '/dashboard/customer';
        router.push(redirectPath);
      } else {
        // Email confirmation required (most common setting)
        setStep('success');
      }
    } catch (err: unknown) {
      const message = (err as Error)?.message || 'Failed to create account';
      setError(message);
      toast.error(message);
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[var(--blue)] px-4 py-8 rounded-lg">
        <div>
          <p className=""><Link href="/" className="text-[var(--white)] flex items-center gap-2 text-sm"><FaArrowLeft size={20} className='text-[var(--white)]'/>
                  <span>Back</span></Link></p>
          <h1 className="w-[50%] mx-auto mt-6 text-center text-3xl font-extrabold bg-[var(--white)] text-[var(--blue)] border-2 border-[var(--orange)] rounded-2xl p-2">
            Artismart
          </h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[var(--white)]">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--white)] opacity-80">
            Join our community today
          </p>
        </div>

        {step === 'role' ? (
          <div className="space-y-6">
            <p className="text-center text-lg font-medium text-[var(--orange)]">
              I want to sign up as:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => handleRoleSelect('customer')}
                className="bg-[var(--white)] border-2 border-[var(--orange)] rounded-lg p-6 hover:border-[var(--blue)] transition-all text-center"
              >
                <div className="text-2xl font-bold text-[var(--blue)] mb-2">Customer</div>
                <p className="text-sm text-[var(--blue)] opacity-90">
                  Looking for skilled artisans and services
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('artisan')}
                className="bg-[var(--white)] border-2 border-[var(--orange)] rounded-lg p-6 hover:border-[var(--blue)] transition-all text-center"
              >
                <div className="text-2xl font-bold text-[var(--blue)] mb-2">Artisan</div>
                <p className="text-sm text-[var(--blue)] opacity-90">
                  Offering professional services and skills
                </p>
              </button>
            </div>
          </div>
        ) : step === 'form' ? (
          <form onSubmit={handleSignUp} className="mt-8 space-y-6">
            <div className="text-center mb-4">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-[var(--orange)]/10 text-[var(--orange)] text-sm font-medium">
                Signing up as {selectedRole}
              </span>
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
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm focus:border-[var(--orange)] px-3 py-2"
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
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm focus:border-[var(--orange)] px-3 py-2"
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
                placeholder="you@gmail.com"
                className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm focus:border-[var(--orange)] px-3 py-2"
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
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm focus:border-[var(--blue)] px-3 py-2 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <FaEye/> : <FaEyeSlash/>}
                </button>
              </div>

              {formData.password && (
                <div className="mt-1 text-sm">
                  {passwordStrength === 'strong' && <p className="text-green-400">Strong ✓</p>}
                  {passwordStrength === 'medium' && <p className="text-yellow-400">Okay, but can improve</p>}
                  {passwordStrength === 'weak' && <p className="text-red-400">Too weak</p>}
                  {passwordError && <p className="text-red-400">{passwordError}</p>}
                </div>
              )}
            </div>

            {/* Phone + Address line */}
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
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm focus:border-[var(--blue)] px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-[var(--white)]">
                  Residential Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm focus:border-[var(--blue)] px-3 py-2"
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
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm focus:border-[var(--blue)] px-3 py-2"
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
                  className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm focus:border-[var(--blue)] px-3 py-2"
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

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep('role');
                  setSelectedRole(null);
                }}
                className="text-[var(--white)] hover:text-[var(--orange)] font-medium"
              >
                ← Change role
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-6 text-center text-[var(--white)]">
            <h3 className="text-xl font-semibold">Verify your email</h3>
            <p className='text-[var(--white)]'>
              We sent a confirmation link to <strong>{formData.email}</strong>
            </p>
            <p className="text-sm opacity-80 text-[var(--white)]">
              Please check your inbox (and spam/junk folder) and click the link to verify your account.
            </p>

            <button
              type="button"
              onClick={() => setStep('form')}
              className="mt-4 px-4 py-2 rounded-md text-[var(--blue)] bg-[var(--white)] hover:bg-bg-[var(--white)]/20"
            >
              Back to form
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
