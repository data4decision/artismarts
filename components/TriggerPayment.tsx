'use client'

import { useState } from 'react'

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false)

  const handlePay = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/flutterwave/initiate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 5000,
          email: 'user@example.com',
          phone_number: '08012345678',
          fullname: 'John Doe',
          tx_ref: `order_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          currency: 'NGN',
          redirect_url: `${window.location.origin}/payment/success?tx_ref=your-tx-ref-here`,
          meta: {
            order_id: 'ORD-12345',
            user_id: 'user_789'
          }
        })
      })

      const data = await res.json()

      if (data.success && data.paymentLink) {
        // Redirect to Flutterwave payment page
        window.location.href = data.paymentLink
      } else {
        alert(data.error || 'Something went wrong')
      }
    } catch (err) {
      console.error(err)
      alert('Payment initiation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-6">Checkout</h1>
      <button
        onClick={handlePay}
        disabled={loading}
        className="bg-green-600 text-white px-8 py-4 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Pay ₦5,000 with Flutterwave'}
      </button>
    </div>
  )
}