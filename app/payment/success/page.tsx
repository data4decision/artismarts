'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function PaymentSuccess() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const tx_ref = searchParams.get('tx_ref')

  useEffect(() => {
    if (status === 'successful' && tx_ref) {
      // Verify transaction on backend (recommended)
      fetch('/api/flutterwave/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx_ref })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data.status === 'successful') {
            alert('Payment verified! Thank you.')
            // Update order status, send email, etc.
          } else {
            alert('Payment verification failed.')
          }
        })
        .catch(() => alert('Verification error'))
    }
  }, [status, tx_ref])

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="text-center p-10 bg-white rounded-xl shadow-lg max-w-md">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
        <p className="text-lg mb-6">Thank you for your purchase.</p>
        <p className="text-gray-600 mb-8">
          Transaction reference: {tx_ref || 'N/A'}
        </p>
        <a
          href="/dashboard/orders"
          className="inline-block bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700"
        >
          View Your Orders
        </a>
      </div>
    </div>
  )
}