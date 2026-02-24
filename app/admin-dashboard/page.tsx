export const dynamic = 'force-dynamic'  

'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  FaUsers,
  FaUserTie,
  FaBriefcase,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaWallet,        
  FaChartLine,
  FaStar,
} from 'react-icons/fa'

interface DashboardStats {
  totalUsers: number
  totalArtisans: number
  totalCustomers: number
  pendingVerifications: number
  activeJobs: number
  completedJobs: number
  disputedJobs: number
  totalPlatformEarnings: number
  averageRating: string
  pendingSupportTickets: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalArtisans: 0,
    totalCustomers: 0,
    pendingVerifications: 0,
    activeJobs: 0,
    completedJobs: 0,
    disputedJobs: 0,
    totalPlatformEarnings: 0,
    averageRating: '0.0',
    pendingSupportTickets: 0,
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        setLoading(true)

        // 1. Users & role breakdown
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('role')

        if (profilesError) throw profilesError

        const totalUsers = profiles?.length || 0
        const totalArtisans = profiles?.filter(p => p.role === 'artisan').length || 0
        const totalCustomers = profiles?.filter(p => p.role === 'customer').length || 0

        // 2. Pending artisan verifications
        const { count: pendingVerif, error: verifError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'artisan')
          .eq('verification_status', 'not_verified')

        if (verifError) throw verifError

        // 3. Job stats (adjust table/column names to match your schema)
        const { data: jobs, error: jobsError } = await supabase
          .from('jobs')           // ← change if your table is named differently
          .select('status')

        if (jobsError) throw jobsError

        const activeJobs = jobs?.filter(j => ['active', 'in_progress', 'ongoing'].includes(j.status)).length || 0
        const completedJobs = jobs?.filter(j => j.status === 'completed' || j.status === 'finished').length || 0
        const disputedJobs = jobs?.filter(j => ['disputed', 'under_review', 'complaint'].includes(j.status)).length || 0

        // 4. Platform earnings (example – adjust to your actual table)
        const { data: transactions, error: txError } = await supabase
          .from('transactions')   // ← change table name if different
          .select('amount')
          .eq('status', 'completed')
          .eq('type', 'platform_fee')

        if (txError) throw txError

        const totalEarnings = transactions?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0

        // 5. Average artisan rating
        const { data: ratings, error: ratingError } = await supabase
          .from('profiles')
          .select('average_rating')
          .eq('role', 'artisan')
          .not('average_rating', 'is', null)

        if (ratingError) throw ratingError

        const avgRating =
          ratings && ratings.length > 0
            ? (ratings.reduce((sum, r) => sum + (Number(r.average_rating) || 0), 0) / ratings.length).toFixed(1)
            : '0.0'

        // 6. Pending support tickets (if you have this table)
        const { count: pendingTickets, error: ticketError } = await supabase
          .from('support_tickets')  // ← adjust table name if different
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open')

        if (ticketError) throw ticketError

        setStats({
          totalUsers,
          totalArtisans,
          totalCustomers,
          pendingVerifications: pendingVerif || 0,
          activeJobs,
          completedJobs,
          disputedJobs,
          totalPlatformEarnings: totalEarnings,
          averageRating: avgRating,
          pendingSupportTickets: pendingTickets || 0,
        })
      } catch (error) {
        console.error('Dashboard stats fetch failed:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()

    // Refresh every 60 seconds
    const interval = setInterval(fetchDashboardStats, 60000)
    return () => clearInterval(interval)
  }, [])

  const formatNaira = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = 'blue',
    loading,
  }: {
    title: string
    value: string | number
    icon: any
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
    loading: boolean
  }) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      red: 'bg-red-50 text-red-700 border-red-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
    }

    const bgLight = colorMap[color].split(' ')[0]

    return (
      <div
        className={`rounded-xl border p-6 shadow-sm ${colorMap[color]} transition-all hover:shadow-md`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            {loading ? (
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-2"></div>
            ) : (
              <p className="text-2xl md:text-3xl font-bold mt-1">{value}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${bgLight.replace('50', '100')}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Platform overview • Last updated {new Date().toLocaleTimeString('en-NG')}
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <StatCard title="Total Users" value={stats.totalUsers} icon={FaUsers} color="blue" loading={loading} />
          <StatCard title="Artisans" value={stats.totalArtisans} icon={FaUserTie} color="purple" loading={loading} />
          <StatCard title="Customers" value={stats.totalCustomers} icon={FaUsers} color="green" loading={loading} />
          <StatCard
            title="Pending Verifications"
            value={stats.pendingVerifications}
            icon={FaClock}
            color="yellow"
            loading={loading}
          />
          <StatCard title="Active Jobs" value={stats.activeJobs} icon={FaBriefcase} color="blue" loading={loading} />
          <StatCard
            title="Completed Jobs"
            value={stats.completedJobs}
            icon={FaCheckCircle}
            color="green"
            loading={loading}
          />
          <StatCard
            title="Disputed Jobs"
            value={stats.disputedJobs}
            icon={FaExclamationTriangle}
            color="red"
            loading={loading}
          />
          <StatCard
            title="Platform Earnings"
            value={formatNaira(stats.totalPlatformEarnings)}
            icon={FaWallet}
            color="purple"
            loading={loading}
          />
          <StatCard
            title="Avg Artisan Rating"
            value={`${stats.averageRating} ★`}
            icon={FaStar}
            color="yellow"
            loading={loading}
          />
          <StatCard
            title="Pending Support"
            value={stats.pendingSupportTickets}
            icon={FaChartLine}
            color="red"
            loading={loading}
          />
        </div>

        {/* Placeholder for future sections */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <p className="text-gray-500 italic">
              Recent signups, job postings, and verifications will appear here...
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Review Verifications
              </button>
              <button className="py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                Check Disputes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}