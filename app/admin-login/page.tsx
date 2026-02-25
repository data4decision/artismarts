'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

export default function AdminLogin() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseClient()
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Sign in with email + password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (signInError) throw signInError;
      if (!signInData.user || !signInData.session) {
        throw new Error('Login failed – no user or session returned');
      }

      // 2. Check if this user has a row in admin_profiles (existence = admin)
      const { data: adminProfile, error: profileError } = await supabase
        .from('admin_profiles')
        .select('id')  // We only need to know if row exists → minimal select
        .eq('id', signInData.user.id)
        .maybeSingle();  // Returns null if no row, no error

      if (profileError) {
        console.error('Admin profile check failed:', profileError);
        throw new Error('Failed to verify admin status. Try again.');
      }

      if (!adminProfile) {
        // No row in admin_profiles → not an admin
        await supabase.auth.signOut();
        throw new Error('This account does not have administrator privileges.');
      }

      // 3. Success: user exists in admin_profiles
      toast.success('Admin login successful');
      router.push('/admin-dashboard');
      router.refresh(); // Helps refresh any server components/layouts
    } catch (err: any) {
      let message = err?.message || 'Invalid email or password';

      if (message.includes('not confirmed')) {
        message = 'Please confirm your email before signing in.';
      } else if (message.includes('administrator privileges')) {
        message = 'Access denied. This is not an admin account.';
      }

      setError(message);
      toast.error(message);
      console.error('Admin login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[var(--blue)] px-4 py-8 rounded-lg">
        {/* Back & Logo */}
        <div>
          <p>
            <Link href="/" className="text-[var(--white)] flex items-center gap-2 text-sm hover:opacity-80">
              <FaArrowLeft size={20} />
              <span>Back to Home</span>
            </Link>
          </p>

          <h1 className="w-[60%] mx-auto mt-6 text-center text-3xl font-extrabold bg-[var(--white)] text-[var(--blue)] border-2 border-[var(--orange)] rounded-2xl p-3">
            ArtiSmart Admin
          </h1>

          <h2 className="mt-6 text-center text-3xl font-extrabold text-[var(--white)]">
            Admin Login
          </h2>

          <p className="mt-2 text-center text-sm text-[var(--white)] opacity-80">
            Sign in to manage the platform
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--white)]">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@artismart.com"
              className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] px-3 py-2 shadow-sm focus:border-[var(--orange)] focus:ring-[var(--orange)]"
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
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] px-3 py-2 pr-10 shadow-sm focus:border-[var(--orange)] focus:ring-[var(--orange)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--white)]"
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div className="flex items-center justify-between text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-[var(--white)] hover:text-[var(--orange)] transition"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-[var(--orange)] hover:bg-[var(--orange)]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--white)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in to Admin Panel'}
          </button>
        </form>

        {/* Added signup link for convenience */}
        <div className="text-center text-sm text-[var(--white)] mt-6">
          <p>
            Don't have an admin account?{' '}
            <Link
              href="/admin-signup"
              className="font-medium text-[var(--orange)] hover:text-[var(--orange)]/80 transition"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}