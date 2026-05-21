'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaTrash } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const DeleteAccount = () => {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setUserProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const handleDeleteAccount = async () => {
    if (!reason.trim()) {
      toast.error("Please tell us why you're deleting your account");
      return;
    }
    if (!confirmed) {
      toast.error("Please confirm this action");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Log deletion reason
      await supabase.from('account_deletions').insert({
        user_id: user.id,
        reason: reason.trim(),
        role: userProfile?.role || 'unknown'
      });

      // Mark account as blocked / deleted
      await supabase
        .from('profiles')
        .update({ 
          is_blocked: true,
          verification_status: 'disabled'
        })
        .eq('id', user.id);

      // Sign user out
      await supabase.auth.signOut();

      toast.success("Your account has been disabled successfully.");

      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (err: any) {
      console.error(err);
      toast.error("Failed to delete account. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/artisan/settings">
            <FaArrowLeft size={24} className="text-[var(--blue)]" />
          </Link>
          <h1 className="text-3xl font-bold">Delete Account</h1>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow">
          <div className="text-center mb-8">
            <FaTrash className="mx-auto text-red-500 text-5xl mb-4" />
            <h2 className="text-2xl font-bold text-red-600">Permanently Delete Account</h2>
          </div>

          {userProfile && (
            <div className="bg-gray-100 p-4 rounded-2xl mb-8 text-center">
              <p>Deleting: <strong>{userProfile.first_name} {userProfile.last_name}</strong></p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-red-600 font-medium mb-2">
                Why are you deleting your account?
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please give us your reason..."
                rows={5}
                className="w-full border border-gray-300 rounded-2xl p-4"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 w-5 h-5 accent-red-600"
              />
              <span className="text-sm text-gray-700">
                I understand that deleting my account is <strong>permanent</strong> and I will lose all my data.
              </span>
            </label>

            <button
              onClick={handleDeleteAccount}
              disabled={loading || !reason.trim() || !confirmed}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-4 rounded-2xl font-semibold text-lg"
            >
              {loading ? 'Processing...' : 'Yes, Delete My Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;