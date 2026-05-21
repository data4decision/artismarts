'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaTrash, FaLock } from 'react-icons/fa';
import toast from 'react-hot-toast';

const DisableAccount = () => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleDisable = async () => {
    if (!reason.trim()) {
      toast.error("Please tell us why you're leaving");
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      toast.success("Account disable request submitted");
      // In real app: Call API to disable account
      setConfirmed(true);
      setLoading(false);
    }, 1500);
  };

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center">
          <FaLock className="mx-auto text-red-500 text-5xl mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Account Disable Request Received</h2>
          <p className="text-gray-600">
            Your request has been submitted. Our team will review it and contact you shortly.
          </p>
          <Link href="/" className="mt-8 inline-block text-[var(--blue)] hover:underline">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/artisan/settings" className="text-[var(--blue)]">
            <FaArrowLeft size={24} />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Disable Account</h1>
        </div>

        <div className="bg-white rounded-3xl shadow p-8">
          <h2 className="text-2xl font-semibold mb-2">Are you sure?</h2>
          <p className="text-gray-600 mb-8">
            Once you confirm, your Artismart account will be disabled. This action cannot be undone immediately.
          </p>

          {/* What will be lost */}
          <div className="space-y-4 mb-10">
            <p className="font-medium text-gray-800 mb-3">This will delete or hide:</p>
            
            <div className="flex gap-4 items-start bg-gray-50 p-4 rounded-2xl">
              <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                📋
              </div>
              <div>
                <p className="font-medium">Your profile and portfolio</p>
                <p className="text-sm text-gray-500">All your work samples and information</p>
              </div>
            </div>

            <div className="flex gap-4 items-start bg-gray-50 p-4 rounded-2xl">
              <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                💰
              </div>
              <div>
                <p className="font-medium">Active jobs and earnings</p>
                <p className="text-sm text-gray-500">Pending payments may be affected</p>
              </div>
            </div>

            <div className="flex gap-4 items-start bg-gray-50 p-4 rounded-2xl">
              <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                💬
              </div>
              <div>
                <p className="font-medium">Chat history and reviews</p>
                <p className="text-sm text-gray-500">All conversations with customers</p>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="mb-8">
            <label className="block text-gray-700 font-medium mb-3">
              Please tell us why you're leaving
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell us why you're leaving..."
              rows={4}
              className="w-full border border-gray-300 rounded-2xl p-4 focus:outline-none focus:border-[var(--blue)] resize-none"
              maxLength={1000}
            />
            <p className="text-right text-xs text-gray-400 mt-1">
              {reason.length}/1000 characters
            </p>
          </div>

          {/* Disable Button */}
          <button
            onClick={handleDisable}
            disabled={loading || !reason.trim()}
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-4 rounded-2xl font-semibold text-lg transition-colors"
          >
            {loading ? 'Processing...' : 'Disable My Account'}
          </button>

          <p className="text-center text-xs text-gray-500 mt-6">
            This action is permanent and cannot be undone immediately
          </p>
        </div>
      </div>
    </div>
  );
};

export default DisableAccount;