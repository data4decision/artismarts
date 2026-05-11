
'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, FaMoneyBillWave, FaCheckCircle, 
  FaCalendarAlt, FaUserTie, FaArrowLeft, 
  FaExclamationTriangle, FaReceipt, FaDownload, 
  FaFilePdf, FaImage
} from 'react-icons/fa'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import Image from 'next/image'

// Define the expected shape from Supabase query
type PaymentWithJob = {
  id: string
  job_id: string
  reference: string
  amount: number
  currency: string
  status: string
  channel?: string | null
  paid_at: string
  job_requests: {
    title: string
    assigned_artisan_id: {
      first_name: string | null
      last_name: string | null
    } | null
  } | null
}

interface Payment {
  id: string
  job_id: string
  reference: string
  amount: number
  currency: string
  status: string
  channel?: string
  paid_at: string
  job_title?: string
  artisan_name?: string
}

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in')
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          job_id,
          reference,
          amount,
          currency,
          status,
          channel,
          paid_at,
          job_requests!inner (
            title,
            assigned_artisan_id (first_name, last_name)
          )
        `)
        .eq('user_id', user.id)
        .order('paid_at', { ascending: false })
        .returns<PaymentWithJob[]>()

      if (error) throw error

      const formatted: Payment[] = (data || []).map(p => ({
        id: p.id,
        job_id: p.job_id,
        reference: p.reference,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        channel: p.channel ?? undefined,
        paid_at: p.paid_at,
        job_title: p.job_requests?.title || 'Unknown Job',
        artisan_name: p.job_requests?.assigned_artisan_id
          ? `${p.job_requests.assigned_artisan_id.first_name || ''} ${p.job_requests.assigned_artisan_id.last_name || ''}`.trim() || 'Unknown Artisan'
          : undefined
      }))

      setPayments(formatted)
    } catch (err: any) {
      console.error('Fetch payments error:', err)
      setError(err.message || 'Failed to load payment history')
      toast.error('Could not load your payments')
    } finally {
      setLoading(false)
    }
  }

  const downloadReceiptAsPNG = async () => {
  if (!receiptRef.current || !selectedPayment) {
    toast.error('Receipt not ready')
    return
  }

  try {
    // Small delay helps with rendering completion
    await new Promise(r => setTimeout(r, 300))

    const canvas = await html2canvas(receiptRef.current, {
      scale: 2,                        // higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: receiptRef.current.scrollWidth,
      windowHeight: receiptRef.current.scrollHeight,
      // Important flags for better capture
      allowTaint: true,
      foreignObjectRendering: true,
      removeContainer: true,
    })

    const link = document.createElement('a')
    link.download = `receipt_${selectedPayment.reference}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()

    toast.success('Receipt downloaded as PNG')
  } catch (err) {
    console.error('PNG download failed:', err)
    toast.error('Failed to capture receipt. Try browser screenshot instead.')
  }
}

const downloadReceiptAsPDF = async () => {
  if (!receiptRef.current || !selectedPayment) {
    toast.error('Receipt not ready')
    return
  }

  try {
    await new Promise(r => setTimeout(r, 300))

    const canvas = await html2canvas(receiptRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4',
      putOnlyUsedFonts: true,
      floatPrecision: 16,
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    const imgWidth = pageWidth - 40 // margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight)

    // Optional footer
    pdf.setFontSize(10)
    pdf.setTextColor(100)
    pdf.text('Thank you for your payment • ArtisMarts', pageWidth / 2, pageHeight - 15, { align: 'center' })

    pdf.save(`receipt_${selectedPayment.reference}.pdf`)
    toast.success('Receipt downloaded as PDF')
  } catch (err) {
    console.error('PDF download failed:', err)
    toast.error('Failed to generate PDF. Try PNG or browser print.')
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--white)] p-6">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="text-red-500 text-7xl mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops!</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={fetchPayments}
            className="inline-flex items-center px-8 py-4 bg-[var(--blue)] text-[var(--white)] rounded-xl hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--white)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center text-[var(--blue)] hover:text-blue-800 transition"
            >
              <FaArrowLeft className="mr-2 text-[var(--blue)] cursor-pointer"/>
              Back to Dashboard
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--blue)]">
              My Payments
            </h1>
            <p className="mt-3 text-lg text-[var(--blue)]">
              View all your successful payments and receipts
            </p>
          </div>
          <button
            onClick={fetchPayments}
            className="px-6 py-3 bg-[var(--orange)] hover:bg-orange-600 text-[var(--white)] rounded-xl transition"
          >
            Refresh
          </button>
        </div>

        {payments.length === 0 ? (
          <div className="bg-[var(--white)] rounded-2xl shadow-lg p-12 text-center border border-gray-200">
            <FaMoneyBillWave className="text-[var(--orange)] text-8xl mx-auto mb-6 opacity-70" />
            <h2 className="text-3xl font-bold text-[var(--blue)] mb-4">
              No payments yet
            </h2>
            <p className="text-xl text-[var(--blue)]/90 mb-8 max-w-2xl mx-auto">
              When you complete a payment for a job, it will appear here with full details.
            </p>
            <button
              onClick={() => router.push('/dashboard/customer/requests')}
              className="inline-flex items-center px-10 py-5 bg-[var(--blue)] text-[var(--white)] text-lg font-medium rounded-xl hover:bg-blue-700 transition shadow-md"
            >
              View My Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {payments.map(payment => (
              <div
                key={payment.id}
                className="bg-[var(--white)] rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="bg-gradient-to-r from-[var(--blue)] to-[var(--orange)] px-6 py-5 text-[var(--white)]">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-xl">
                      {payment.job_title || 'Job Payment'}
                    </h3>
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                      {new Date(payment.paid_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-[var(--blue)]/90">Reference</p>
                      <p className="font-medium text-[var(--blue)] break-all">{payment.reference}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--blue)]/90">Amount</p>
                      <p className="text-2xl font-bold text-[var(--orange)]">
                        ₦{payment.amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--blue)]/90">Method</p>
                      <p className="font-medium capitalize">{payment.channel || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--blue)]/90">Artisan</p>
                      <p className="font-medium">{payment.artisan_name || '—'}</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setSelectedPayment(payment)}
                      className="flex items-center gap-2 px-6 py-3 bg-[var(--blue)] hover:bg-blue-700 text-[var(--white)] rounded-xl transition"
                    >
                      <FaReceipt />
                      View Receipt
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Receipt Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--white)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[var(--blue)] to-[var(--orange)] text-[var(--white)] px-8 py-6 rounded-t-2xl z-10 flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaReceipt />
                  Payment Receipt
                </h2>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-[var(--white)] hover:text-gray-200 text-3xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Receipt Content */}
              <div ref={receiptRef} className="p-8 bg-[var(--white)]">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-[var(--blue)]">ArtisMarts Payment</h3>
                  <p className="text-gray-600 mt-1">Official Receipt</p>
                </div>

                <div className="border border-gray-200 rounded-xl p-6 mb-8 bg-gray-50">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Reference</p>
                      <p className="font-medium break-all">{selectedPayment.reference}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date Paid</p>
                      <p className="font-medium">
                        {new Date(selectedPayment.paid_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Job</p>
                      <p className="font-medium">{selectedPayment.job_title || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Artisan</p>
                      <p className="font-medium">{selectedPayment.artisan_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="text-2xl font-bold text-[var(--orange)]">
                        ₦{selectedPayment.amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Method</p>
                      <p className="font-medium capitalize">{selectedPayment.channel || 'Unknown'}</p>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500 border-t pt-6">
                  Thank you for your payment • Secured by Paystack • ArtisMarts
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-[var(--white)] border-t px-8 py-6 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={downloadReceiptAsPNG}
                  className="flex-1 py-4 px-6 bg-[var(--orange)] hover:bg-orange-600 text-[var(--white)] rounded-xl transition flex items-center justify-center gap-2 font-medium"
                >
                  <FaImage />
                  Download PNG
                </button>
                <button
                  onClick={downloadReceiptAsPDF}
                  className="flex-1 py-4 px-6 bg-[var(--blue)] hover:bg-blue-700 text-[var(--white)] rounded-xl transition flex items-center justify-center gap-2 font-medium"
                >
                  <FaFilePdf />
                  Download PDF
                </button>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="flex-1 py-4 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}