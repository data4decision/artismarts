'use client'

export const dynamic = 'force-dynamic'

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

// ──────────────────────────────────────────────────────────────
// Configuration – change values here instead of in code
// ──────────────────────────────────────────────────────────────
const STATS_CONFIG = [
  {
    key: 'totalUsers',
    title: 'Total Users',
    icon: FaUsers,
    color: 'blue',
    fetch: async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      return count || 0
    },
  },
  {
    key: 'totalArtisans',
    title: 'Artisans',
    icon: FaUserTie,
    color: 'purple',
    fetch: async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'artisan')
      return count || 0
    },
  },
  {
    key: 'totalCustomers',
    title: 'Customers',
    icon: FaUsers,
    color: 'green',
    fetch: async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer')
      return count || 0
    },
  },
  {
    key: 'pendingVerifications',
    title: 'Pending Verifications',
    icon: FaClock,
    color: 'yellow',
    fetch: async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'artisan')
        .eq('verification_status', 'pending') // ← update status value if needed
      return count || 0
    },
  },
  // Add more stats here as needed
  // Example:
  // {
  //   key: 'activeJobs',
  //   title: 'Active Jobs',
  //   icon: FaBriefcase,
  //   color: 'blue',
  //   fetch: async () => { ... }
  // },
]

// ──────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState<Record<string, number | string>>(() =>
    STATS_CONFIG.reduce((acc, curr) => ({ ...acc, [curr.key]: 0 }), {})
  )
  const [loading, setLoading] = useState(true)

  const fetchAllStats = async () => {
    setLoading(true)
    try {
      const newStats = { ...stats }

      await Promise.all(
        STATS_CONFIG.map(async (stat) => {
          try {
            const value = await stat.fetch()
            newStats[stat.key] = value
          } catch (err) {
            console.error(`Failed to fetch ${stat.title}:`, err)
            newStats[stat.key] = 0 // fallback
          }
        })
      )

      setStats(newStats)
    } catch (error) {
      console.error('Dashboard stats fetch failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllStats()

    const interval = setInterval(fetchAllStats, 60000) // refresh every 60s
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
              <p className="text-2xl md:text-3xl font-bold mt-1">
                {typeof value === 'number' && title.includes('Earnings')
                  ? formatNaira(value)
                  : value}
              </p>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {STATS_CONFIG.map((stat) => (
            <StatCard
              key={stat.key}
              title={stat.title}
              value={stats[stat.key]}
              icon={stat.icon}
              color={stat.color as any}
              loading={loading}
            />
          ))}
        </div>

        {/* Placeholder sections */}
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