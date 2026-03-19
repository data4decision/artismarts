'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, FaMoneyBillWave, FaDownload, 
  FaChevronLeft, FaChevronRight 
} from 'react-icons/fa'
import Image from 'next/image'

// ────────────────────────────────────────────────
// Expected shape from Supabase query
type PaymentQueryResult = {
  id: string
  reference: string
  amount: number
  paid_at: string
  status: string
  channel?: string | null
  job_requests: {
    title: string
    customer: {
  first_name: string | null
  last_name: string | null
} | null
    artisan: {
      first_name: string | null
      last_name: string | null
    } | null
  } | null
}

// Flattened shape for UI
interface AdminPayment {
  id: string
  reference: string
  amount: number
  paid_at: string
  status: string
  channel?: string
  job_title?: string
  customer_name?: string
  artisan_name?: string
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  

  const fetchPayments = async (resetPage = false) => {
    if (resetPage) setPage(1)
    setLoading(true)

    try {
      // ✅ Start with SELECT (IMPORTANT FIX)
      let query = supabase
  .from('payments')
  .select(`
    id,
    reference,
    amount,
    paid_at,
    status,
    channel,
    job_requests!inner (
      title,
      customer:profiles!job_requests_customer_id_fkey (first_name, last_name),
      artisan:assigned_artisan_id (first_name, last_name)
    )
  `, { count: 'exact' })

      // ✅ Search filter (FIXED .or syntax)
      if (searchTerm.trim()) {
        const term = `%${searchTerm.trim()}%`
        query = query.or(
  `reference.ilike.${term},` +
  `job_requests.title.ilike.${term},` +
  `job_requests.customer.email.ilike.${term},` +
  `job_requests.artisan.first_name.ilike.${term},` +
  `job_requests.artisan.last_name.ilike.${term}`
)
      }

      // ✅ Status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      // ✅ Date filters
      if (dateFrom) {
        query = query.gte('paid_at', `${dateFrom}T00:00:00Z`)
      }

      if (dateTo) {
        query = query.lte('paid_at', `${dateTo}T23:59:59Z`)
      }

      // ✅ Pagination + ordering
      const { data, error, count } = await query
        .range((page - 1) * perPage, page * perPage - 1)
        .order('paid_at', { ascending: false })
        .returns<PaymentQueryResult[]>()

      if (error) throw error

      const formatted: AdminPayment[] = (data || []).map(p => ({
        id: p.id,
        reference: p.reference,
        amount: p.amount,
        paid_at: p.paid_at,
        status: p.status,
        channel: p.channel ?? undefined,
        job_title: p.job_requests?.title || '—',
       customer_name: p.job_requests?.customer
  ? `${p.job_requests.customer.first_name || ''} ${p.job_requests.customer.last_name || ''}`.trim() || '—'
  : '—',
artisan_name: p.job_requests?.artisan
  ? `${p.job_requests.artisan.first_name || ''} ${p.job_requests.artisan.last_name || ''}`.trim() || '—'
  : '—'
      }))

      setPayments(formatted)
      setTotalCount(count || 0)

    } catch (err: any) {
      console.error('Fetch error:', err)
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'payments' },
        () => {
          toast.success('New payment received!')
          fetchPayments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Load on mount + filter/page change
  useEffect(() => {
    fetchPayments()
  }, [page, searchTerm, statusFilter, dateFrom, dateTo])

  const totalPages = Math.ceil(totalCount / perPage)

  const exportToCSV = () => {
    if (payments.length === 0) {
      toast.error('No payments to export')
      return
    }

    const headers = [
      'Reference', 'Customer Email', 'Job Title', 'Artisan', 
      'Amount (NGN)', 'Method', 'Date', 'Status'
    ]

    const rows = payments.map(p => [
      `"${p.reference}"`,
      `"${p.customer_name}"`,
      `"${p.job_title}"`,
      `"${p.artisan_name}"`,
      p.amount,
      p.channel || '',
      new Date(p.paid_at).toLocaleString(),
      p.status
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `payments_export_${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    toast.success('Exported to CSV')
  }


  return (
    <div className="min-h-screen bg-[var(--white)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[var(--blue)] flex items-center gap-3">
            <FaMoneyBillWave className="text-[var(--orange)] text-4xl" />
            Admin – All Payments
          </h1>

          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchPayments(true)}
              className="px-6 py-3 bg-[var(--orange)] hover:bg-orange-600 text-[var(--white)] rounded-xl transition"
            >
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              disabled={payments.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--blue)] hover:bg-blue-700 text-[var(--white)] rounded-xl transition disabled:opacity-50"
            >
              <FaDownload />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-[var(--white)] p-6 rounded-xl border border-[var(--orange)]/30 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-[var(--blue)] mb-1">Search</label>
              <input
                type="text"
                placeholder="Reference, job, email, artisan..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--orange)]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--blue)] mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--orange)]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)]"
              >
                <option value="all">All</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--blue)] mb-1">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--orange)]/50 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--blue)] mb-1">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--orange)]/50 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Loading with your animation */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="relative flex items-center justify-center">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-md"></div>
              <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
                <div className="bg-[var(--white)] rounded-full p-2 shadow-sm">
                  <Image src="/log.png" width={48} height={48} priority alt="Loading..." className="object-contain" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No data */}
        {!loading && payments.length === 0 && (
          <div className="text-center py-16 text-[var(--blue)] bg-[var(--white)] rounded-xl border border-[var(--orange)]/30">
            <FaMoneyBillWave className="text-[var(--orange)] text-6xl mx-auto mb-4 opacity-70" />
            <h2 className="text-2xl font-bold mb-2">No payments found</h2>
            <p>No records match your filters or none have been made yet.</p>
          </div>
        )}

        {/* Table */}
        {!loading && payments.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-xl border border-[var(--orange)]/30 bg-[var(--white)] shadow-sm">
              <table className="min-w-full divide-y divide-[var(--orange)]/20">
                <thead className="bg-[var(--orange)]/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--blue)]">Reference</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--blue)]">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--blue)]">Job</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--blue)]">Artisan</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--blue)]">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--blue)]">Method</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--blue)]">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--blue)]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--orange)]/10">
                  {payments.map(payment => (
                    <tr key={payment.id} className="hover:bg-[var(--orange)]/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--blue)]">
                        {payment.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {payment.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {payment.job_title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {payment.artisan_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--orange)]">
                        ₦{payment.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                        {payment.channel || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(payment.paid_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                          payment.status === 'success' 
                            ? 'bg-[var(--orange)]/20 text-[var(--orange)] border border-[var(--orange)]/40'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {payment.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalCount > perPage && (
              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-6 py-3 bg-[var(--orange)]/10 hover:bg-[var(--orange)]/20 disabled:opacity-50 text-[var(--blue)] rounded-xl transition"
                >
                  <FaChevronLeft />
                  Previous
                </button>

                <span className="text-[var(--blue)] font-medium">
                  Page {page} of {Math.ceil(totalCount / perPage)}
                </span>

                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(totalCount / perPage)}
                  className="flex items-center gap-2 px-6 py-3 bg-[var(--orange)]/10 hover:bg-[var(--orange)]/20 disabled:opacity-50 text-[var(--blue)] rounded-xl transition"
                >
                  Next
                  <FaChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}