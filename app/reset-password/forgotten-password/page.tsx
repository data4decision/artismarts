'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: 'http://localhost:3000/reset-password', // ← change this in production
        }
      );

      if (error) throw error;

      setMessage('Password reset link sent! Check your email .');
      toast.success('Reset link sent');
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to send reset link';
      setError(msg);
      toast.error(msg);
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--white)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[var(--blue)] px-4 py-4 rounded-lg">
        <div>
          <h1 className=' w-[50%] m-auto mt-6 text-center text-3xl font-extrabold bg-[var(--white)] text-[var(--blue)] border-2 border-[var(--orange)] rounded-2xl'>Artismart</h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[var(--white)]">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--white)] opacity-80">
            Enter your email and we will send you a link to reset your password
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 text-green-700 text-sm rounded">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm focus:border-[var(--blue)] focus:ring-[var(--orange)] sm:text-sm px-3 py-2"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--orange)] hover:bg-[var(--orange)]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--blue)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending reset link...' : 'Send Reset Link'}
            </button>
          </div>

          <div className="text-center text-sm">
            <p className="text-[var(--white)] opacity-80">
              Remember your password?{' '}
              <Link href="/login" className="font-medium text-[var(--blue)] hover:text-[var(--orange)]/80">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}