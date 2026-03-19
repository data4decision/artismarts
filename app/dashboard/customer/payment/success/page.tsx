// // app/dashboard/customer/payment/success/page.tsx
// 'use client'

// import { useEffect, useState } from 'react'
// import { useSearchParams, useRouter } from 'next/navigation'
// import toast from 'react-hot-toast'
// import { FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'
// import { supabase } from '@/lib/supabase'

// export default function PaymentSuccess() {
//   const searchParams = useSearchParams()
//   const router = useRouter()
//   const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
//   const [message, setMessage] = useState('Verifying your payment...')

//   const reference = searchParams.get('reference')   // Paystack uses "reference"
//   const jobId = searchParams.get('jobId')

//   useEffect(() => {
//     console.log('[SUCCESS PAGE] Loaded with params:', {
//       reference,
//       jobId,
//       fullUrl: window.location.href
//     })

//     if (!reference) {
//       console.warn('[SUCCESS PAGE] No reference found in URL')
//       setStatus('failed')
//       setMessage('Missing payment reference in URL. Payment may have succeeded but could not be verified.')
//       toast.error('Missing reference – payment may still have gone through')
//       return
//     }

//     const verifyPayment = async () => {
//       try {
//         console.log('[SUCCESS PAGE] Starting verification for reference:', reference)

//         const res = await fetch(`/api/paystack/verify-payment?reference=${reference}`, {
//           method: 'GET',
//           cache: 'no-store',
//           headers: { 'Cache-Control': 'no-cache' }
//         })

//         console.log('[SUCCESS PAGE] Verify endpoint status:', res.status)

//         if (!res.ok) {
//           const errText = await res.text()
//           throw new Error(`Verify endpoint failed: ${res.status} - ${errText}`)
//         }

//         const data = await res.json()
//         console.log('[SUCCESS PAGE] Full Paystack verify response:', JSON.stringify(data, null, 2))

//         if (data.status === true && data.data?.status === 'success') {
//           console.log('[SUCCESS PAGE] Payment verified SUCCESSFULLY')

//           // Save payment record to Supabase (non-blocking)
//           const savePayment = async () => {
//             try {
//               const { data: { user } } = await supabase.auth.getUser()
//               if (!user) throw new Error('User not authenticated')

//               const { error } = await supabase
//                 .from('payments')
//                 .insert({
//                   job_id: jobId,
//                   user_id: user.id,
//                   reference: reference,
//                   amount: data.data.amount / 100, // kobo → Naira
//                   currency: data.data.currency || 'NGN',
//                   status: data.data.status,
//                   channel: data.data.channel,
//                   paid_at: data.data.paid_at
//                 })

//               if (error) {
//                 console.error('Failed to save payment record:', error.message, error.details, error.hint)
//                 toast.error('Payment verified, but could not save record – contact support')
//               } else {
//                 console.log('Payment record saved successfully')
//               }
//             } catch (saveErr: any) {
//               console.error('Save payment error:', saveErr)
//               toast.error('Payment verified, but save failed – check console')
//             }
//           }

//           await savePayment()

//           setStatus('success')
//           setMessage('Payment successful! Thank you for your payment.')
//           toast.success('Payment confirmed')
//         } else {
//           console.warn('[SUCCESS PAGE] Payment NOT successful according to Paystack:', data)
//           setStatus('failed')
//           setMessage(data.message || data.data?.gateway_response || 'Payment verification returned non-success status.')
//           toast.error('Payment could not be verified – but check your Paystack dashboard')
//         }
//       } catch (err: any) {
//         console.error('[SUCCESS PAGE] Verification error:', err)
//         setStatus('failed')
//         setMessage(err.message || 'Could not verify payment right now.')
//         toast.error('Verification failed – please check Paystack dashboard and contact support if needed')
//       }
//     }

//     verifyPayment()
//   }, [reference, jobId, router])

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-[var(--white)] p-6">
//       <div className="max-w-md w-full text-center">
//         {status === 'loading' && (
//           <div>
//             <FaSpinner className="animate-spin text-6xl text-[var(--orange)] mx-auto mb-6" />
//             <h2 className="text-2xl font-bold text-gray-800 mb-4">Verifying Payment</h2>
//             <p className="text-gray-600">{message}</p>
//           </div>
//         )}

//         {status === 'success' && (
//           <div>
//             <FaCheckCircle className="text-green-500 text-7xl mx-auto mb-6" />
//             <h2 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h2>
//             <p className="text-lg text-gray-700 mb-8">
//               Your payment has been confirmed. Thank you!
//             </p>
//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <button
//                 onClick={() => router.push('/dashboard/customer/requests')}
//                 className="inline-flex items-center px-8 py-4 bg-[var(--blue)] text-[var(--white)] rounded-xl hover:bg-blue-700 transition"
//               >
//                 View Job Details
//               </button>
//               <button
//                 onClick={() => router.push('/dashboard/customer/payment')}
//                 className="inline-flex items-center px-8 py-4 bg-[var(--orange)] text-[var(--white)] rounded-xl hover:bg-orange-600 transition"
//               >
//                 View My Payments
//               </button>
//             </div>
//           </div>
//         )}

//         {status === 'failed' && (
//           <div>
//             <FaExclamationTriangle className="text-red-500 text-7xl mx-auto mb-6" />
//             <h2 className="text-3xl font-bold text-red-600 mb-4">Payment Issue</h2>
//             <p className="text-lg text-gray-700 mb-8">{message}</p>
//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <button
//                 onClick={() => router.back()}
//                 className="px-8 py-4 bg-gray-600 text-[var(--white)] rounded-xl hover:bg-gray-700 transition"
//               >
//                 Go Back
//               </button>
//               <button
//                 onClick={() => router.push('/dashboard/customer/payment')}
//                 className="px-8 py-4 bg-[var(--blue)] text-[var(--white)] rounded-xl hover:bg-blue-700 transition"
//               >
//                 View Payments
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// app/dashboard/customer/payment/success/page.tsx
import { Suspense } from 'react'
import SuccessContent from './SuccessContent'
import { FaSpinner } from 'react-icons/fa'
import Image from 'next/image'

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--white)] p-6">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
                <div className="relative flex items-center justify-center">
                  <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-md"></div>
                  <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
                    <div className="bg-[var(--white)] rounded-full p-2 shadow-sm">
                      <Image src="/log.png" width={48} height={48} priority alt="Loading..." className="object-contain" />
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[var(--blue)] mb-4">Verifying Payment</h2>
              </div>
              
      }>
        <SuccessContent />
      </Suspense>
    </div>
  )
}