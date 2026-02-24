'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FaArrowLeft } from 'react-icons/fa';

export default function Login() {
  const router = useRouter();

  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Login with email + password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      });

      if (signInError) throw signInError;

      if (!signInData.user || !signInData.session) {
        throw new Error('Login successful but no user or session returned');
      }

      toast.success('Login successful! Redirecting...');

      // Get role from profiles table (fallback to metadata or default to customer)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', signInData.user.id)
        .single();

      const role = profile?.role || signInData.user.user_metadata?.role || 'customer';

      // Redirect to correct dashboard
      if (role === 'artisan') {
        router.push('/dashboard/artisan');
      } else {
        router.push('/dashboard/customer');
      }
    } catch (err: unknown) {
      const message = (err as Error)?.message || 'Invalid email or password';
      setError(message);
      toast.error(message);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      
      <div className="max-w-md w-full space-y-8 bg-[var(--blue)] px-2 py-2 rounded-lg">
        <p className=""><Link href="/" className="text-[var(--white)] flex items-center gap-2 text-sm"><FaArrowLeft size={20} className='text-[var(--white)]'/>
        <span>Back</span></Link></p>
        <div>
          <h1 className=' w-[50%] m-auto mt-6 text-center text-3xl font-extrabold bg-[var(--white)] text-[var(--blue)] border-2 border-[var(--orange)] rounded-2xl'>Artismart</h1>
          <h2 className="mt-6 text-center text-2xl font-bold text-[var(--white)]">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--white)] opacity-80">
            Welcome back
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">
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
              value={credentials.email}
              onChange={handleChange}
              placeholder="you@gmail.com"
              className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm focus:border-[var(--blue)] focus:ring-[var(--orange)] sm:text-sm px-3 py-2"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--white)]">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={credentials.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm focus:border-[var(--blue)] focus:ring-[var(--orange)] sm:text-sm px-3 py-2"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                href="/forgotten-password"
                className="font-medium text-[var(--white)] hover:text-[var(--orange)]"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--orange)] hover:bg-[var(--orange)]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--white)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center text-sm">
            <p className="text-[var(--white)] opacity-80">
              Did not have an account?{' '}
              <Link href="/signup" className="font-medium text-[var(--orange)] hover:text-[var(--orange)]/80">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}