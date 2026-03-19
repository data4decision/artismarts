// app/dashboard/customer/payment/success/SuccessContent.tsx
'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'
import { supabase } from '@/lib/supabase'

export default function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('Verifying your payment...')

  const reference = searchParams.get('reference')
  const jobId = searchParams.get('jobId')

  useEffect(() => {
    console.log('[SUCCESS CONTENT] Loaded with params:', { reference, jobId })

    if (!reference) {
      setStatus('failed')
      setMessage('Missing payment reference. Payment may have succeeded but could not be verified.')
      toast.error('Missing reference')
      return
    }

    const verifyPayment = async () => {
      try {
        const res = await fetch(`/api/paystack/verify-payment?reference=${reference}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })

        if (!res.ok) {
          const errText = await res.text()
          throw new Error(`Verify failed: ${res.status} - ${errText}`)
        }

        const data = await res.json()

        if (data.status === true && data.data?.status === 'success') {
          // Save to Supabase (non-blocking)
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              await supabase.from('payments').insert({
                job_id: jobId,
                user_id: user.id,
                reference,
                amount: data.data.amount / 100,
                currency: data.data.currency || 'NGN',
                status: data.data.status,
                channel: data.data.channel,
                paid_at: data.data.paid_at
              })
            }
          } catch (saveErr) {
            console.error('Save failed:', saveErr)
            toast.error('Payment verified but save failed')
          }

          setStatus('success')
          setMessage('Payment successful! Thank you.')
          toast.success('Payment confirmed')
        } else {
          setStatus('failed')
          setMessage(data.message || 'Verification returned non-success')
          toast.error('Payment verification issue')
        }
      } catch (err: any) {
        setStatus('failed')
        setMessage(err.message || 'Verification failed')
        toast.error('Verification failed – check Paystack dashboard')
      }
    }

    verifyPayment()
  }, [reference, jobId, router])

  return (
    <div className="max-w-md w-full text-center">
      {status === 'loading' && (
        <>
          <FaSpinner className="animate-spin text-6xl text-[var(--orange)] mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Verifying Payment</h2>
          <p className="text-gray-600">{message}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <FaCheckCircle className="text-green-500 text-7xl mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h2>
          <p className="text-lg text-gray-700 mb-8">{message}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push(jobId ? `/dashboard/customer/jobs/${jobId}` : '/dashboard')}
              className="px-8 py-4 bg-[var(--blue)] text-[var(--white)] rounded-xl hover:bg-blue-700 transition"
            >
              View Job Details
            </button>
            <button
              onClick={() => router.push('/dashboard/customer/payments')}
              className="px-8 py-4 bg-[var(--orange)] text-[var(--white)] rounded-xl hover:bg-orange-600 transition"
            >
              View My Payments
            </button>
          </div>
        </>
      )}

      {status === 'failed' && (
        <>
          <FaExclamationTriangle className="text-red-500 text-7xl mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-red-600 mb-4">Payment Issue</h2>
          <p className="text-lg text-gray-700 mb-8">{message}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.back()}
              className="px-8 py-4 bg-gray-600 text-[var(--white)] rounded-xl hover:bg-gray-700 transition"
            >
              Go Back
            </button>
            <button
              onClick={() => router.push('/dashboard/customer/payments')}
              className="px-8 py-4 bg-[var(--blue)] text-[var(--white)] rounded-xl hover:bg-blue-700 transition"
            >
              View Payments
            </button>
          </div>
        </>
      )}
    </div>
  )
}