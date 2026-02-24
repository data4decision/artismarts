'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaShieldAlt, FaIdCard, FaVideo, FaCheckCircle, FaSpinner } from 'react-icons/fa'

export default function VerificationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Unverified') // will be updated from DB later

  const startVerification = async () => {
    setLoading(true)
    console.log('Start verification button clicked')

    try {
      // 1. Check if user is logged in
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.log('No user found')
        toast.error('Please sign in first')
        router.push('/login')
        return
      }

      console.log('User found:', user.id)

      // 2. Update status to pending (you can expand this later)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          verification_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Update failed:', updateError)
        throw updateError
      }

      console.log('Status updated to pending')

      toast.success('Verification started! We will guide you through the steps soon.', {
        duration: 5000,
      })

      // Optional: refresh status or redirect
      setStatus('Pending')

      // In real app → redirect to first step or open verification modal
      // router.push('/verification/step1')

    } catch (err: any) {
      console.error('Verification start failed:', err)
      toast.error(err.message || 'Failed to start verification. Please try again.', {
        duration: 6000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--blue)] to-[var(--orange)] p-8 text-white text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Identity Verification
          </h1>
          <p className="text-lg opacity-90">
            Stand out to clients. Build trust. Get hired faster.
          </p>
        </div>

        <div className="p-6 sm:p-10 space-y-10">

          {/* Status */}
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700 mb-2">Your current status:</p>
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-gray-100 rounded-full text-xl font-bold">
              {status === 'Verified' ? (
                <>
                  <FaCheckCircle className="text-green-500 text-2xl" />
                  <span className="text-green-700">Verified</span>
                </>
              ) : status === 'Pending' ? (
                <>
                  <FaSpinner className="animate-spin text-orange-500 text-2xl" />
                  <span className="text-[var(--orange)]">Pending Review</span>
                </>
              ) : (
                <span className="text-red-600">Unverified</span>
              )}
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
            <p className="text-lg font-medium text-[var(--orange)] mb-3">
              Why verify your identity?
            </p>
            <ul className="text-gray-700 space-y-2 text-left max-w-xl mx-auto">
              <li>• Get seen more in client searches</li>
              <li>• Clients trust verified artisans faster</li>
              <li>• More job requests and bookings</li>
              <li>• Show you're a real professional</li>
            </ul>
          </div>

          {/* Steps */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-[var(--blue)] text-center">
              How it works – 3 simple steps
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-md transition">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                  <FaIdCard className="text-[var(--orange)] text-3xl" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--blue)] mb-2">
                  1. Upload Government ID
                </h3>
                <p className="text-gray-600 text-sm">
                  Show us your ID. We check it matches your country.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-md transition">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                  <FaVideo className="text-[var(--orange)] text-3xl" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--blue)] mb-2">
                  2. Take a Selfie
                </h3>
                <p className="text-gray-600 text-sm">
                  Quick face check to confirm it's you.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-md transition">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                  <FaCheckCircle className="text-[var(--orange)] text-3xl" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--blue)] mb-2">
                  3. Submit for Review
                </h3>
                <p className="text-gray-600 text-sm">
                  We verify instantly or manually. You'll get your badge soon.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="text-center text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
            <p>We keep your data safe and share it only with our trusted verification partner.</p>
            <a href="#" className="text-[var(--orange)] hover:underline">
              Privacy Policy
            </a>
          </div>

          {/* Big Action Button */}
          <div className="text-center pt-8">
            <button
              onClick={startVerification}
              disabled={loading || status === 'Verified'}
              className={`px-10 sm:px-16 py-4 rounded-xl font-medium text-lg transition shadow-md flex items-center justify-center gap-3 mx-auto w-full max-w-md ${
                status === 'Verified'
                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                  : loading
                  ? 'bg-gray-300 text-gray-600 cursor-wait'
                  : 'bg-[var(--orange)] text-white hover:bg-orange-600'
              }`}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Starting...
                </>
              ) : status === 'Verified' ? (
                <>
                  <FaCheckCircle />
                  Already Verified
                </>
              ) : (
                <>
                  <FaShieldAlt />
                  Start Verification Now
                </>
              )}
            </button>
          </div>

          {/* Footer note */}
          <div className="text-center text-sm text-gray-500 pt-8">
            <p>We'll remind you when it's time to renew.</p>
            <p className="mt-2">
              Questions? <a href="#" className="text-[var(--orange)] hover:underline">Learn more</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}