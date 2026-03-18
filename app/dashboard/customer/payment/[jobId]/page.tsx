// app/dashboard/customer/payment/[jobId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, 
  FaArrowLeft, 
  FaMoneyBillWave, 
  FaCheckCircle, 
  FaExclamationTriangle
} from 'react-icons/fa'
import Image from 'next/image'

interface JobRequest {
  id: string
  title: string
  description?: string
  amount: number | null
  status: string
  customer_id: string
  artisan?: {
    first_name: string | null
    last_name: string | null
  } | null
}

export default function CustomerPaymentPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const router = useRouter()

  const [job, setJob] = useState<JobRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState<number | null>(null)

  useEffect(() => {
    if (!jobId) {
      toast.error('Invalid job ID')
      router.back()
      return
    }

    const fetchJob = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error('Please sign in')
          router.replace('/login')
          return
        }

        const { data, error } = await supabase
          .from('job_requests')
          .select(`
            id,
            title,
            description,
            amount,
            status,
            customer_id,
            artisan:assigned_artisan_id (first_name, last_name)
          `)
          .eq('id', jobId)
          .eq('customer_id', user.id)
          .returns<JobRequest>()
          .single()

        if (error) throw error
        if (!data) throw new Error('Job not found')

        setJob(data)
      } catch (err: any) {
        console.error('Fetch error:', err)
        setError(err.message || 'Failed to load job details')
        toast.error('Could not load payment details')
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [jobId, router])

  const handlePayWithPaystack = async () => {
    if (!job || paying || !customAmount || customAmount < 1000) {
      toast.error('Please enter a valid amount (minimum ₦1,000)')
      return
    }

    setPaying(true)
    setError(null)

    try {
      const reference = `pay_${job.id}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

      const res = await fetch('/api/paystack/initiate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: customAmount,               // frontend sends in Naira
          email: (await supabase.auth.getUser()).data.user?.email || '',
          phone_number: '',
          fullname: '',
          tx_ref: reference,                  // Paystack calls it "reference"
          currency: 'NGN',
          redirect_url: `${window.location.origin}/dashboard/customer/payment/success?jobId=${job.id}&reference=${reference}`,
          meta: {
            job_id: job.id,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            type: 'job_payment_ngn'
          }
        })
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Server error ${res.status}: ${errText}`)
      }

      const result = await res.json()

      if (!result.success || !result.paymentLink) {
        throw new Error(result.error || 'Failed to start payment')
      }

      // Redirect to Paystack checkout
      window.location.href = result.paymentLink
    } catch (err: any) {
      console.error('Paystack payment failed:', err)
      setError(err.message || 'Could not start payment. Please try again.')
      toast.error(err.message || 'Payment failed – please check your connection')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-md"></div>
          <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
            <div className="bg-[var(--white)] rounded-full p-2 shadow-sm">
              <Image src="/log.png" width={48} height={48} priority alt="Loading..." className="object-contain" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="text-red-500 text-7xl mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-[var(--blue)] mb-4">
            {error || 'Job not found'}
          </h2>
          <p className="text-[var(--blue)] mb-8">
            We couldn't load this job request or it's not yours.
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-8 py-4 bg-[var(--blue)] text-white rounded-xl hover:bg-[var(--blue)]/70 transition"
          >
            <FaArrowLeft className="mr-2" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center text-[var(--blue)]/70 hover:text-[var(--blue)] transition"
        >
          <FaArrowLeft className="mr-2" />
          Back to Job Details
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--blue)] to-[var(--orange)] px-8 py-10 text-white">
            <h1 className="text-3xl font-bold mb-2">
              Complete Payment for {job.title}
            </h1>
            <p className="text-lg opacity-90 text-[var(--white)]">
              Secure payment powered by Paystack
            </p>
          </div>

          {/* Job Summary */}
          <div className="p-8 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-[var(--blue)] mb-3">
                  Job Details
                </h3>
                <p className="text-[var(--blue)] mb-2">
                  <span className="font-medium">Title:</span> {job.title}
                </p>
                {job.description && (
                  <p className="text-[var(--blue)] mb-2">
                    <span className="font-medium">Description:</span> {job.description}
                  </p>
                )}
                <p className="text-[var(--blue)]">
                  <span className="font-medium">Status:</span> {job.status}
                </p>
              </div>

              <div className="flex flex-col justify-center items-center md:items-end">
                <div className="text-center md:text-right">
                  <p className="text-sm text-[var(--blue)] mb-1">Amount to Pay (NGN)</p>
                  <p className="text-4xl md:text-5xl font-bold text-[var(--orange)]">
                    {job.amount != null && job.amount > 0
                      ? `₦${job.amount.toLocaleString()}`
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Input & Button */}
          <div className="p-8 bg-gray-50">
            <div className="max-w-md mx-auto">
              <div className="bg-white p-6 rounded-xl border border-[var(--orange)]/70 shadow-sm mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-green-100 p-4 rounded-full">
                    <FaCheckCircle className="text-green-600 text-3xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[var(--blue)]">Secure & Instant Payment</h3>
                    <p className="text-[var(--blue)] text-sm">
                      Powered by Paystack • Card, Bank Transfer, USSD, Mobile Money
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-start gap-3">
                    <FaExclamationTriangle className="text-xl mt-1" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Custom amount input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[var(--blue)] mb-2">
                    Amount to Pay (NGN)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--blue)]">₦</span>
                    <input
                      type="number"
                      min="1000"
                      step="100"
                      value={customAmount ?? ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setCustomAmount(val === '' ? null : Number(val))
                      }}
                      placeholder="Enter amount"
                      className="w-full pl-10 pr-4 py-4 border border-[var(--blue)]/70 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xl font-medium"
                    />
                  </div>
                  <p className="mt-2 text-sm text-[var(--blue)]">
                    Enter any amount you wish to pay (minimum ₦1,000 recommended)
                  </p>
                </div>

                <button
                  onClick={handlePayWithPaystack}
                  disabled={paying || !customAmount || customAmount < 1000}
                  className={`
                    w-full py-5 px-8 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-3 shadow-lg
                    ${paying || !customAmount || customAmount < 1000
                      ? 'bg-[var(--blue)] cursor-not-allowed text-[var(--white)]'
                      : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white'
                    }
                  `}
                >
                  {paying ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaMoneyBillWave className="text-2xl" />
                      Pay ₦{customAmount?.toLocaleString() || '—'}
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-[var(--orange)] mt-6">
                  Secured by Paystack • SSL Encrypted
                </p>
              </div>

              <div className="text-center text-sm text-[var(--orange)]">
                <p>Need help? Contact support or chat with the artisan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}