'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
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
  FaRedo,
  FaSpinner,
} from 'react-icons/fa'
import Image from 'next/image'

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

  // Fetch all stats (initial + real-time trigger)
  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true)

      // 1. Profiles: users, artisans, customers, pending verifications
      const { data: profiles } = await supabase
        .from('profiles')
        .select('role, verification_status')

      const totalUsers = profiles?.length || 0
      const totalArtisans = profiles?.filter(p => p.role === 'artisan').length || 0
      const totalCustomers = profiles?.filter(p => p.role === 'customer').length || 0
      const pendingVerifications = profiles?.filter(
        p => p.role === 'artisan' && p.verification_status === 'not_verified'
      ).length || 0

      // 2. Job requests stats (real data from your table)
      const { data: jobs } = await supabase
        .from('job_requests')
        .select('status')

      const activeJobs = jobs?.filter(j =>
        ['assigned', 'in_progress', 'ongoing'].includes(j.status)
      ).length || 0

      const completedJobs = jobs?.filter(j => j.status === 'completed').length || 0

      const disputedJobs = jobs?.filter(j =>
        ['disputed', 'under_review', 'changes_requested', 'completed_pending_review'].includes(j.status)
      ).length || 0

      // 3. Other stats (placeholders - add real queries when you have the tables)
      const totalEarnings = 0 // Replace with real transaction sum
      const avgRating = '0.0' // Replace with real average calculation
      const pendingTickets = 0 // Replace with real count from support_tickets

      setStats({
        totalUsers,
        totalArtisans,
        totalCustomers,
        pendingVerifications,
        activeJobs,
        completedJobs,
        disputedJobs,
        totalPlatformEarnings: totalEarnings,
        averageRating: avgRating,
        pendingSupportTickets: pendingTickets,
      })
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchDashboardStats()

    // Real-time: profiles (users/artisans/customers/verifications)
    const profileChannel = supabase
      .channel('admin-profiles-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        console.log('PROFILE CHANGE → refreshing stats')
        fetchDashboardStats()
      })
      .subscribe()

    // Real-time: job_requests (all job stats)
    const jobsChannel = supabase
      .channel('admin-jobs-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_requests' }, () => {
        console.log('JOB CHANGE → refreshing stats')
        fetchDashboardStats()
      })
      .subscribe()

    // Cleanup
    return () => {
      supabase.removeChannel(profileChannel)
      supabase.removeChannel(jobsChannel)
    }
  }, [fetchDashboardStats])

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
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--blue)]">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Platform overview • Live updates • Last updated {new Date().toLocaleTimeString('en-NG')}
            </p>
          </div>
          <button
            onClick={fetchDashboardStats}
            disabled={loading}
            className="px-6 py-3 bg-[var(--orange)] text-[var(--white)] rounded-xl hover:bg-orange-600 transition flex items-center gap-2 disabled:opacity-50 shadow-md"
          >
            <FaRedo className={loading ? 'animate-spin' : ''} />
            Refresh Now
          </button>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-gray-50/80 flex items-center justify-center z-50">
            <div className="relative flex items-center justify-center">
              <FaSpinner className="animate-spin text-[var(--orange)] text-7xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src="/log.png"
                  width={56}
                  height={56}
                  alt="Loading..."
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        )}

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
            title="Disputed / Pending Review"
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

        {/* Placeholder sections */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--white)] rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-[var(--blue)]">Recent Activity</h3>
            <p className="text-gray-500 italic">
              Recent signups, job postings, verifications, and support tickets will appear here in real-time...
            </p>
          </div>

          <div className="bg-[var(--white)] rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-[var(--blue)]">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="py-3 px-4 bg-[var(--blue)] text-[var(--white)] rounded-lg hover:bg-blue-700 transition">
                Review Verifications
              </button>
              <button className="py-3 px-4 bg-[var(--orange)] text-[var(--white)] rounded-lg hover:bg-orange-600 transition">
                Check Disputes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}