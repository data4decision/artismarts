'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import {
  FaUsers,
  FaUserPlus,
  FaChartLine,
  FaRedo,
  FaSpinner,
  FaDownload,
  FaUserTie,
} from 'react-icons/fa'
import Image from 'next/image'
import { Bar, Line, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface AnalyticsStats {
  totalUsers: number
  newToday: number
  newThisWeek: number
  newThisMonth: number
  customerCount: number
  artisanCount: number
  adminCount: number
  growthTrend: { date: string; newUsers: number }[]
}

export default function UserAnalyticsDashboard() {
  const [stats, setStats] = useState<AnalyticsStats>({
    totalUsers: 0,
    newToday: 0,
    newThisWeek: 0,
    newThisMonth: 0,
    customerCount: 0,
    artisanCount: 0,
    adminCount: 0,
    growthTrend: [],
  })

  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

  const growthChartRef = useRef<HTMLDivElement>(null)
  const rolesChartRef = useRef<HTMLDivElement>(null)

  const fetchUserAnalytics = useCallback(async () => {
    try {
      setLoading(true)

      // 1. Total users + roles breakdown
      const { data: profiles } = await supabase
        .from('profiles')
        .select('role, created_at')

      const totalUsers = profiles?.length || 0
      const customerCount = profiles?.filter(p => p.role === 'customer').length || 0
      const artisanCount = profiles?.filter(p => p.role === 'artisan').length || 0
      const adminCount = profiles?.filter(p => p.role === 'admin').length || 0

      // 2. New users (today / week / month)
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0]

      const newToday = profiles?.filter(p => p.created_at?.split('T')[0] === today).length || 0
      const newThisWeek = profiles?.filter(p => p.created_at?.split('T')[0] >= weekAgo).length || 0
      const newThisMonth = profiles?.filter(p => p.created_at?.split('T')[0] >= monthStart).length || 0

      // 3. 30-day growth trend
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const trendMap = new Map<string, number>()
      profiles?.forEach(p => {
        if (p.created_at) {
          const date = p.created_at.split('T')[0]
          if (date >= thirtyDaysAgo) {
            trendMap.set(date, (trendMap.get(date) || 0) + 1)
          }
        }
      })

      const trend: { date: string; newUsers: number }[] = []
      let current = new Date(thirtyDaysAgo)
      const end = new Date()
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0]
        trend.push({ date: dateStr, newUsers: trendMap.get(dateStr) || 0 })
        current.setDate(current.getDate() + 1)
      }

      setStats({
        totalUsers,
        newToday,
        newThisWeek,
        newThisMonth,
        customerCount,
        artisanCount,
        adminCount,
        growthTrend: trend,
      })
    } catch (err: any) {
      console.error('Analytics fetch error:', err)
      toast.error('Failed to load user analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUserAnalytics()

    // Real-time: new user signups
    const profilesChannel = supabase
      .channel('admin-profiles-analytics')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
        toast.success('New user registered!')
        fetchUserAnalytics()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(profilesChannel)
    }
  }, [fetchUserAnalytics])

  // Growth chart data
  const growthChartData = {
    labels: stats.growthTrend.map(t => t.date.slice(5)), // MM-DD
    datasets: [
      {
        label: 'New Users',
        data: stats.growthTrend.map(t => t.newUsers),
        borderColor: 'var(--orange)',
        backgroundColor: chartType === 'bar' ? 'rgba(249, 115, 22, 0.6)' : 'rgba(249, 115, 22, 0.2)',
        borderWidth: 2,
        tension: chartType === 'line' ? 0.3 : 0,
        fill: chartType === 'line',
      },
    ],
  }

  const growthChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const, labels: { color: 'var(--blue)' } },
      title: {
        display: true,
        text: `User Growth (Last 30 Days) – ${chartType === 'line' ? 'Line' : 'Bar'} View`,
        color: 'var(--blue)',
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { color: 'var(--blue)' } },
      x: { ticks: { color: 'var(--blue)' } },
    },
  }

  // Roles pie chart
  const rolesChartData = {
    labels: ['Customers', 'Artisans', 'Admins'],
    datasets: [
      {
        data: [stats.customerCount, stats.artisanCount, stats.adminCount],
        backgroundColor: ['#3B82F6', '#F97316', '#6B7280'],
        borderWidth: 1,
      },
    ],
  }

  const rolesChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const, labels: { color: 'var(--blue)' } },
      title: { display: true, text: 'User Roles Breakdown', color: 'var(--blue)' },
    },
  }

  const toggleChartType = () => {
    setChartType(prev => (prev === 'line' ? 'bar' : 'line'))
  }

  // Download functions
  const downloadGrowthPNG = async () => {
    if (!growthChartRef.current) return
    const canvas = await html2canvas(growthChartRef.current)
    const link = document.createElement('a')
    link.download = 'user-growth-trend.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.success('Growth chart downloaded as PNG')
  }

  const downloadGrowthPDF = async () => {
    if (!growthChartRef.current) return
    const canvas = await html2canvas(growthChartRef.current)
    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF({ orientation: 'landscape' })
    const imgWidth = 280
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
    pdf.save('user-growth-trend.pdf')
    toast.success('Growth chart downloaded as PDF')
  }

  const downloadRolesPNG = async () => {
    if (!rolesChartRef.current) return
    const canvas = await html2canvas(rolesChartRef.current)
    const link = document.createElement('a')
    link.download = 'user-roles-breakdown.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.success('Roles chart downloaded as PNG')
  }

  const downloadRolesPDF = async () => {
    if (!rolesChartRef.current) return
    const canvas = await html2canvas(rolesChartRef.current)
    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF()
    const imgWidth = 180
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 15, 20, imgWidth, imgHeight)
    pdf.save('user-roles-breakdown.pdf')
    toast.success('Roles chart downloaded as PDF')
  }

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
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange'
    loading: boolean
  }) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      red: 'bg-red-50 text-red-700 border-red-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
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
              <div className="h-8 w-32 bg-gray-200 animate-pulse rounded mt-2"></div>
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
            <h1 className="text-3xl font-bold text-[var(--blue)]">User Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">
              User growth & demographics • Live updates • Last updated {new Date().toLocaleTimeString('en-NG')}
            </p>
          </div>
          <button
            onClick={fetchUserAnalytics}
            disabled={loading}
            className="px-6 py-3 bg-[var(--orange)] text-[var(--white)] rounded-xl hover:bg-orange-600 transition flex items-center gap-2 disabled:opacity-50 shadow-md"
          >
            <FaRedo className={loading ? 'animate-spin' : ''} />
            Refresh Now
          </button>
        </div>

        {/* Loading Overlay */}
        {loading && (
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
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <StatCard title="Total Users" value={stats.totalUsers} icon={FaUsers} color="blue" loading={loading} />
          <StatCard title="New Today" value={stats.newToday} icon={FaUserPlus} color="green" loading={loading} />
          <StatCard title="New This Week" value={stats.newThisWeek} icon={FaUserPlus} color="yellow" loading={loading} />
          <StatCard title="New This Month" value={stats.newThisMonth} icon={FaUserPlus} color="orange" loading={loading} />
          <StatCard title="Customers" value={stats.customerCount} icon={FaUsers} color="green" loading={loading} />
          <StatCard title="Artisans" value={stats.artisanCount} icon={FaUserTie} color="purple" loading={loading} />
          <StatCard title="Admins" value={stats.adminCount} icon={FaUsers} color="blue" loading={loading} />
        </div>

        {/* Charts Section */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Trend */}
          {!loading && stats.growthTrend.length > 0 && (
            <div className="bg-[var(--white)] rounded-xl shadow p-6 border border-[var(--orange)]/30" ref={growthChartRef}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--blue)] flex items-center gap-2">
                  <FaChartLine className="text-[var(--orange)]" />
                  User Growth (Last 30 Days)
                </h3>

                <div className="flex gap-3">
                  <button
                    onClick={toggleChartType}
                    className="px-4 py-2 bg-[var(--orange)] hover:bg-orange-600 text-[var(--white)] rounded-lg transition text-sm"
                  >
                    {chartType === 'line' ? 'Switch to Bar' : 'Switch to Line'}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={downloadGrowthPNG}
                      className="px-3 py-2 bg-[var(--blue)] hover:bg-blue-700 text-[var(--white)] rounded-lg transition text-sm flex items-center gap-1"
                    >
                      <FaDownload size={14} /> PNG
                    </button>
                    <button
                      onClick={downloadGrowthPDF}
                      className="px-3 py-2 bg-[var(--blue)] hover:bg-blue-700 text-[var(--white)] rounded-lg transition text-sm flex items-center gap-1"
                    >
                      <FaDownload size={14} /> PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-80">
                {chartType === 'line' ? (
                  <Line data={growthChartData} options={growthChartOptions} />
                ) : (
                  <Bar data={growthChartData} options={growthChartOptions} />
                )}
              </div>
            </div>
          )}

          {/* Roles Breakdown Pie */}
          {!loading && (stats.customerCount + stats.artisanCount + stats.adminCount > 0) && (
            <div className="bg-[var(--white)] rounded-xl shadow p-6 border border-[var(--orange)]/30" ref={rolesChartRef}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--blue)] flex items-center gap-2">
                  <FaUsers className="text-[var(--orange)]" />
                  User Roles Breakdown
                </h3>

                <div className="flex gap-2">
                  <button
                    onClick={downloadRolesPNG}
                    className="px-3 py-2 bg-[var(--blue)] hover:bg-blue-700 text-[var(--white)] rounded-lg transition text-sm flex items-center gap-1"
                  >
                    <FaDownload size={14} /> PNG
                  </button>
                  <button
                    onClick={downloadRolesPDF}
                    className="px-3 py-2 bg-[var(--blue)] hover:bg-blue-700 text-[var(--white)] rounded-lg transition text-sm flex items-center gap-1"
                  >
                    <FaDownload size={14} /> PDF
                  </button>
                </div>
              </div>

              <div className="h-80">
                <Pie data={rolesChartData} options={rolesChartOptions} />
              </div>
            </div>
          )}
        </div>

        {/* Placeholder */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--white)] rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-[var(--blue)]">User Insights</h3>
            <p className="text-gray-500 italic">
              Top locations, retention rates, and activity heatmaps coming soon...
            </p>
          </div>

          <div className="bg-[var(--white)] rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-[var(--blue)]">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="py-3 px-4 bg-[var(--blue)] text-[var(--white)] rounded-lg hover:bg-blue-700 transition">
                Export User List
              </button>
              <button className="py-3 px-4 bg-[var(--orange)] text-[var(--white)] rounded-lg hover:bg-orange-600 transition">
                View Inactive Users
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}