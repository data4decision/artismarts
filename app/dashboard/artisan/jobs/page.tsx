'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt, 
  FaPhoneAlt, 
  FaCheckCircle, 
  FaHourglassHalf, 
  FaTimesCircle, 
  FaMoneyBillWave,
  FaBell 
} from 'react-icons/fa'
import React from 'react'   


type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

interface Booking {
  id: string
  client_name: string
  client_phone: string | null
  service_type: string
  address: string
  scheduled_date: string          // ISO string
  scheduled_time: string          // e.g. "14:30"
  duration_minutes: number | null
  status: BookingStatus
  total_amount: number | null
  notes: string | null
  created_at: string
  // If you later add paid_at field (used in stats):
  // paid_at: string | null
}

interface Stats {
  todayEarnings: number
  weekEarnings: number
  todayJobs: number
  upcomingJobs: number
  pendingPayments: number
}

// ────────────────────────────────────────────────
// Status Colors & Icons
// ────────────────────────────────────────────────
const statusStyles: Record<BookingStatus, { bg: string; text: string; icon: React.JSX.Element }> = {
  pending:    { bg: 'bg-amber-100',     text: 'text-amber-700', icon: <FaHourglassHalf /> },
  confirmed:  { bg: 'bg-green-500',      text: 'text-blue-700',  icon: <FaCalendarAlt /> },
  in_progress:{ bg: 'bg-purple-100',    text: 'text-purple-700', icon: <FaClock /> },
  completed:  { bg: 'bg-green-100',     text: 'text-green-700', icon: <FaCheckCircle /> },
  cancelled:  { bg: 'bg-red-100',       text: 'text-red-700',   icon: <FaTimesCircle /> },
}

// ────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────
export default function ArtisanBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<Stats>({
    todayEarnings: 0,
    weekEarnings: 0,
    todayJobs: 0,
    upcomingJobs: 0,
    pendingPayments: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBookingsAndStats = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // ── Fetch bookings ───────────────────────────────────────
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('artisan_id', user.id)
          .order('scheduled_date', { ascending: true })
          .order('scheduled_time', { ascending: true })
          .limit(50)

        if (bookingsError) throw bookingsError

        setBookings(bookingsData || [])

        // ── Simple stats calculation ──
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())

        let todayEarnings = 0
        let weekEarnings = 0
        let todayJobs = 0
        let upcomingJobs = 0
        let pendingPayments = 0

        bookingsData?.forEach(b => {
          const jobDate = new Date(b.scheduled_date)

          if (b.status === 'completed' && b.total_amount) {
            if (jobDate.toDateString() === today.toDateString()) {
              todayEarnings += b.total_amount
            }
            if (jobDate >= weekStart) {
              weekEarnings += b.total_amount
            }
          }

          if (jobDate.toDateString() === today.toDateString()) todayJobs++
          
          // Upcoming = future days OR today but not completed
          if (jobDate > today || 
              (jobDate.toDateString() === today.toDateString() && b.status !== 'completed')) {
            upcomingJobs++
          }

          // Pending payments — assuming you have a paid_at column
          // If not, remove or adjust this condition
          if (b.status === 'completed' && !b.paid_at) {
            pendingPayments += b.total_amount || 0
          }
        })

        setStats({
          todayEarnings,
          weekEarnings,
          todayJobs,
          upcomingJobs,
          pendingPayments,
        })
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }

    fetchBookingsAndStats()

    // Realtime subscription (optional)
    const channel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          // For simplicity — full refresh
          fetchBookingsAndStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-[var(--blue)] text-lg animate-pulse">Loading jobs...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
          {error}
        </div>
      </div>
    )
  }

  const todayBookings = bookings.filter(b => {
    const d = new Date(b.scheduled_date)
    return d.toDateString() === new Date().toDateString()
  })

  return (
    <div className="min-h-screen bg-gray-50/70 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-[var(--blue)] text-[var(--white)] px-5 sm:px-8 py-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Job Dashboard
          </h1>
          <p className="mt-1 opacity-90">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard 
            title="Today Earnings" 
            value={`₦${stats.todayEarnings.toLocaleString()}`} 
            icon={<FaMoneyBillWave className="text-[var(--orange)] text-2xl" />} 
          />
          <StatCard 
            title="Week Earnings" 
            value={`₦${stats.weekEarnings.toLocaleString()}`} 
            icon={<FaMoneyBillWave className="text-[var(--orange)] text-2xl" />} 
          />
          <StatCard 
            title="Today's Jobs" 
            value={stats.todayJobs.toString()} 
            icon={<FaCalendarAlt className="text-[var(--orange)] text-2xl" />} 
          />
          <StatCard 
            title="Upcoming" 
            value={stats.upcomingJobs.toString()} 
            icon={<FaClock className="text-[var(--orange)] text-2xl" />} 
          />
          <StatCard 
            title="Pending ₦" 
            value={`₦${stats.pendingPayments.toLocaleString()}`} 
            icon={<FaBell className="text-[var(--orange)] text-2xl" />} 
          />
        </div>

        {/* Today's Jobs - Highlighted */}
        <section>
          <h2 className="text-xl font-semibold text-[var(--blue)] mb-4 flex items-center gap-2">
            <FaClock /> Today's Schedule
          </h2>

          {todayBookings.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 border border-gray-200">
              No jobs scheduled for today
            </div>
          ) : (
            <div className="space-y-4">
              {todayBookings.map(booking => (
                <JobCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </section>

        {/* All Upcoming + Recent */}
        <section>
          <h2 className="text-xl font-semibold text-[var(--blue)] mb-4">
            All Bookings
          </h2>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">When</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map(booking => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{booking.client_name}</div>
                        {booking.client_phone && (
                          <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <FaPhoneAlt className="text-xs" /> {booking.client_phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.service_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(booking.scheduled_date), 'MMM d')} • {booking.scheduled_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[booking.status].bg} ${statusStyles[booking.status].text}`}>
                          {statusStyles[booking.status].icon}
                          {booking.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {booking.total_amount ? `₦${booking.total_amount.toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {bookings.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                No bookings found
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────
// Reusable Components
// ────────────────────────────────────────────────
function StatCard({ title, value, icon }: { title: string; value: string; icon: React.JSX.Element }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-[var(--blue)] mt-1">{value}</p>
        </div>
        <div className="opacity-80">{icon}</div>
      </div>
    </div>
  )
}

function JobCard({ booking }: { booking: Booking }) {
  const status = statusStyles[booking.status]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-[var(--blue)]">{booking.service_type}</h3>
          <div className="flex items-center gap-2 text-gray-700">
            <FaMapMarkerAlt className="text-[var(--orange)]" />
            <span>{booking.address}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <FaClock />
            <span>
              {format(new Date(booking.scheduled_date), 'MMM d, yyyy')} • {booking.scheduled_time}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-medium ${status.bg} ${status.text}`}>
            {status.icon}
            {booking.status.replace('_', ' ')}
          </span>

          {booking.total_amount && (
            <span className="text-lg font-bold text-[var(--orange)]">
              ₦{booking.total_amount.toLocaleString()}
            </span>
          )}

          <div className="flex gap-2">
            <button className="px-4 py-2 bg-[var(--orange)] text-white rounded-lg text-sm hover:bg-orange-600 transition">
              Start Job
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition">
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}