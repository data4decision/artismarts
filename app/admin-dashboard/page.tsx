// 'use client'

// export const dynamic = 'force-dynamic'

// import { useEffect, useState, useCallback } from 'react'
// import { supabase } from '@/lib/supabase'
// import {
//   FaUsers,
//   FaUserTie,
//   FaBriefcase,
//   FaCheckCircle,
//   FaClock,
//   FaExclamationTriangle,
//   FaWallet,
//   FaChartLine,
//   FaStar,
//   FaRedo,
//   FaSpinner,
// } from 'react-icons/fa'
// import Image from 'next/image'

// interface DashboardStats {
//   totalUsers: number
//   totalArtisans: number
//   totalCustomers: number
//   pendingVerifications: number
//   activeJobs: number
//   completedJobs: number
//   disputedJobs: number
//   totalPlatformEarnings: number
//   averageRating: string
//   pendingSupportTickets: number
// }

// export default function AdminDashboard() {
//   const [stats, setStats] = useState<DashboardStats>({
//     totalUsers: 0,
//     totalArtisans: 0,
//     totalCustomers: 0,
//     pendingVerifications: 0,
//     activeJobs: 0,
//     completedJobs: 0,
//     disputedJobs: 0,
//     totalPlatformEarnings: 0,
//     averageRating: '0.0',
//     pendingSupportTickets: 0,
//   })

//   const [loading, setLoading] = useState(true)

//   // Fetch all stats (initial + real-time trigger)
//   const fetchDashboardStats = useCallback(async () => {
//     try {
//       setLoading(true)

//       // 1. Profiles: users, artisans, customers, pending verifications
//       const { data: profiles } = await supabase
//         .from('profiles')
//         .select('role, verification_status')

//       const totalUsers = profiles?.length || 0
//       const totalArtisans = profiles?.filter(p => p.role === 'artisan').length || 0
//       const totalCustomers = profiles?.filter(p => p.role === 'customer').length || 0
//       const pendingVerifications = profiles?.filter(
//         p => p.role === 'artisan' && p.verification_status === 'not_verified'
//       ).length || 0

//       // 2. Job requests stats (real data from your table)
//       const { data: jobs } = await supabase
//         .from('job_requests')
//         .select('status')

//       const activeJobs = jobs?.filter(j =>
//         ['assigned', 'in_progress', 'ongoing'].includes(j.status)
//       ).length || 0

//       const completedJobs = jobs?.filter(j => j.status === 'completed').length || 0

//       const disputedJobs = jobs?.filter(j =>
//         ['disputed', 'under_review', 'changes_requested', 'completed_pending_review'].includes(j.status)
//       ).length || 0

//       // 3. Other stats (placeholders - add real queries when you have the tables)
//       const totalEarnings = 0 // Replace with real transaction sum
//       const avgRating = '0.0' // Replace with real average calculation
//       const pendingTickets = 0 // Replace with real count from support_tickets

//       setStats({
//         totalUsers,
//         totalArtisans,
//         totalCustomers,
//         pendingVerifications,
//         activeJobs,
//         completedJobs,
//         disputedJobs,
//         totalPlatformEarnings: totalEarnings,
//         averageRating: avgRating,
//         pendingSupportTickets: pendingTickets,
//       })
//     } catch (err) {
//       console.error('Dashboard fetch error:', err)
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   useEffect(() => {
//     // Initial fetch
//     fetchDashboardStats()

//     // Real-time: profiles (users/artisans/customers/verifications)
//     const profileChannel = supabase
//       .channel('admin-profiles-live')
//       .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
//         console.log('PROFILE CHANGE → refreshing stats')
//         fetchDashboardStats()
//       })
//       .subscribe()

//     // Real-time: job_requests (all job stats)
//     const jobsChannel = supabase
//       .channel('admin-jobs-live')
//       .on('postgres_changes', { event: '*', schema: 'public', table: 'job_requests' }, () => {
//         console.log('JOB CHANGE → refreshing stats')
//         fetchDashboardStats()
//       })
//       .subscribe()

//     // Cleanup
//     return () => {
//       supabase.removeChannel(profileChannel)
//       supabase.removeChannel(jobsChannel)
//     }
//   }, [fetchDashboardStats])

//   const formatNaira = (amount: number) =>
//     new Intl.NumberFormat('en-NG', {
//       style: 'currency',
//       currency: 'NGN',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount)

//   const StatCard = ({
//     title,
//     value,
//     icon: Icon,
//     color = 'blue',
//     loading,
//   }: {
//     title: string
//     value: string | number
//     icon: any
//     color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
//     loading: boolean
//   }) => {
//     const colorMap = {
//       blue: 'bg-blue-50 text-blue-700 border-blue-200',
//       green: 'bg-green-50 text-green-700 border-green-200',
//       yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
//       red: 'bg-red-50 text-red-700 border-red-200',
//       purple: 'bg-purple-50 text-purple-700 border-purple-200',
//     }

//     const bgLight = colorMap[color].split(' ')[0]

//     return (
//       <div
//         className={`rounded-xl border p-6 shadow-sm ${colorMap[color]} transition-all hover:shadow-md`}
//       >
//         <div className="flex items-center justify-between">
//           <div>
//             <p className="text-sm font-medium opacity-80">{title}</p>
//             {loading ? (
//               <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-2"></div>
//             ) : (
//               <p className="text-2xl md:text-3xl font-bold mt-1">{value}</p>
//             )}
//           </div>
//           <div className={`p-3 rounded-full ${bgLight.replace('50', '100')}`}>
//             <Icon className="h-6 w-6" />
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//           <div>
//             <h1 className="text-3xl font-bold text-[var(--blue)]">Admin Dashboard</h1>
//             <p className="text-gray-600 mt-1">
//               Platform overview • Live updates • Last updated {new Date().toLocaleTimeString('en-NG')}
//             </p>
//           </div>
//           <button
//             onClick={fetchDashboardStats}
//             disabled={loading}
//             className="px-6 py-3 bg-[var(--orange)] text-[var(--white)] rounded-xl hover:bg-orange-600 transition flex items-center gap-2 disabled:opacity-50 shadow-md"
//           >
//             <FaRedo className={loading ? 'animate-spin' : ''} />
//             Refresh Now
//           </button>
//         </div>

//         {/* Loading Overlay */}
//         {loading && (
//           <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
//                       <div className="relative flex items-center justify-center">
//                       {/* Outer spinning ring */}
//                         <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-md"></div>
//                         {/* Inner static logo with subtle pulse */}
//                           <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
//                             <div className="bg-[var(--white)] rounded-full p-2 shadow-sm">
//                               <Image src="/log.png" width={48} height={48}  priority alt="Loading..." className="object-contain"  />  
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//         )}

//         {/* Main Stats Grid */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//           <StatCard title="Total Users" value={stats.totalUsers} icon={FaUsers} color="blue" loading={loading} />
//           <StatCard title="Artisans" value={stats.totalArtisans} icon={FaUserTie} color="purple" loading={loading} />
//           <StatCard title="Customers" value={stats.totalCustomers} icon={FaUsers} color="green" loading={loading} />
//           <StatCard
//             title="Pending Verifications"
//             value={stats.pendingVerifications}
//             icon={FaClock}
//             color="yellow"
//             loading={loading}
//           />
//           <StatCard title="Active Jobs" value={stats.activeJobs} icon={FaBriefcase} color="blue" loading={loading} />
//           <StatCard
//             title="Completed Jobs"
//             value={stats.completedJobs}
//             icon={FaCheckCircle}
//             color="green"
//             loading={loading}
//           />
//           <StatCard
//             title="Disputed / Pending Review"
//             value={stats.disputedJobs}
//             icon={FaExclamationTriangle}
//             color="red"
//             loading={loading}
//           />
//           <StatCard
//             title="Platform Earnings"
//             value={formatNaira(stats.totalPlatformEarnings)}
//             icon={FaWallet}
//             color="purple"
//             loading={loading}
//           />
//           <StatCard
//             title="Avg Artisan Rating"
//             value={`${stats.averageRating} ★`}
//             icon={FaStar}
//             color="yellow"
//             loading={loading}
//           />
//           <StatCard
//             title="Pending Support"
//             value={stats.pendingSupportTickets}
//             icon={FaChartLine}
//             color="red"
//             loading={loading}
//           />
//         </div>

//         {/* Placeholder sections */}
//         <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <div className="bg-[var(--white)] rounded-xl shadow p-6">
//             <h3 className="text-lg font-semibold mb-4 text-[var(--blue)]">Recent Activity</h3>
//             <p className="text-gray-500 italic">
//               Recent signups, job postings, verifications, and support tickets will appear here in real-time...
//             </p>
//           </div>

//           <div className="bg-[var(--white)] rounded-xl shadow p-6">
//             <h3 className="text-lg font-semibold mb-4 text-[var(--blue)]">Quick Actions</h3>
//             <div className="grid grid-cols-2 gap-4">
//               <button className="py-3 px-4 bg-[var(--blue)] text-[var(--white)] rounded-lg hover:bg-blue-700 transition">
//                 Review Verifications
//               </button>
//               <button className="py-3 px-4 bg-[var(--orange)] text-[var(--white)] rounded-lg hover:bg-orange-600 transition">
//                 Check Disputes
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import {toast} from 'react-hot-toast'
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
  FaDownload,
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

interface DashboardStats {
  totalUsers: number
  totalArtisans: number
  totalCustomers: number
  pendingVerifications: number
  activeJobs: number
  completedJobs: number
  disputedJobs: number
  totalPlatformEarnings: number
  dailyPlatformEarnings: number
  weeklyPlatformEarnings: number
  monthlyPlatformEarnings: number
  averageRating: string
  pendingSupportTickets: number
  earningsTrend: { date: string; amount: number }[]
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
    dailyPlatformEarnings: 0,
    weeklyPlatformEarnings: 0,
    monthlyPlatformEarnings: 0,
    averageRating: '0.0',
    pendingSupportTickets: 0,
    earningsTrend: [],
  })

  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

  const earningsChartRef = useRef<HTMLDivElement>(null)
  const jobChartRef = useRef<HTMLDivElement>(null)

  const formatNaira = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true)

      // Profiles stats
      const { data: profiles } = await supabase
        .from('profiles')
        .select('role, verification_status')

      const totalUsers = profiles?.length || 0
      const totalArtisans = profiles?.filter(p => p.role === 'artisan').length || 0
      const totalCustomers = profiles?.filter(p => p.role === 'customer').length || 0
      const pendingVerifications = profiles?.filter(
        p => p.role === 'artisan' && p.verification_status === 'not_verified'
      ).length || 0

      // Job requests stats
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

      // Earnings
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0]

      const { data: allEarnings } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'success')
      const totalEarnings = allEarnings?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

      const { data: dailyEarnings } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'success')
        .gte('paid_at', `${today}T00:00:00Z`)
        .lte('paid_at', `${today}T23:59:59Z`)
      const dailyTotal = dailyEarnings?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

      const { data: weeklyEarnings } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'success')
        .gte('paid_at', `${weekAgo}T00:00:00Z`)
      const weeklyTotal = weeklyEarnings?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

      const { data: monthlyEarnings } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'success')
        .gte('paid_at', `${monthStart}T00:00:00Z`)
      const monthlyTotal = monthlyEarnings?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

      // 30-day trend
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const { data: trendData } = await supabase
        .from('payments')
        .select('amount, paid_at')
        .eq('status', 'success')
        .gte('paid_at', `${thirtyDaysAgo}T00:00:00Z`)
        .order('paid_at', { ascending: true })

      const trendMap = new Map<string, number>()
      trendData?.forEach(p => {
        const date = p.paid_at.split('T')[0]
        trendMap.set(date, (trendMap.get(date) || 0) + Number(p.amount))
      })

      const trend: { date: string; amount: number }[] = []
      let current = new Date(thirtyDaysAgo)
      const end = new Date()
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0]
        trend.push({ date: dateStr, amount: trendMap.get(dateStr) || 0 })
        current.setDate(current.getDate() + 1)
      }

      // Other placeholders
      const avgRating = '0.0'
      const pendingTickets = 0

      setStats({
        totalUsers,
        totalArtisans,
        totalCustomers,
        pendingVerifications,
        activeJobs,
        completedJobs,
        disputedJobs,
        totalPlatformEarnings: totalEarnings,
        dailyPlatformEarnings: dailyTotal,
        weeklyPlatformEarnings: weeklyTotal,
        monthlyPlatformEarnings: monthlyTotal,
        averageRating: avgRating,
        pendingSupportTickets: pendingTickets,
        earningsTrend: trend,
      })
    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardStats()

    const profileChannel = supabase
      .channel('admin-profiles-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchDashboardStats)
      .subscribe()

    const jobsChannel = supabase
      .channel('admin-jobs-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_requests' }, fetchDashboardStats)
      .subscribe()

    const paymentsChannel = supabase
      .channel('admin-payments-earnings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' }, (payload) => {
        if (payload.new.status === 'success') {
          const amount = Number(payload.new.amount)
          setStats(prev => ({
            ...prev,
            totalPlatformEarnings: prev.totalPlatformEarnings + amount,
          }))
          toast.success('New payment added to earnings!')
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(profileChannel)
      supabase.removeChannel(jobsChannel)
      supabase.removeChannel(paymentsChannel)
    }
  }, [fetchDashboardStats])

  // Earnings chart data
  const earningsChartData = {
    labels: stats.earningsTrend.map(t => t.date.slice(5)),
    datasets: [
      {
        label: 'Daily Earnings (₦)',
        data: stats.earningsTrend.map(t => t.amount),
        borderColor: 'var(--orange)',
        backgroundColor: chartType === 'bar' ? 'rgba(249, 115, 22, 0.6)' : 'rgba(249, 115, 22, 0.2)',
        borderWidth: 2,
        tension: chartType === 'line' ? 0.3 : 0,
        fill: chartType === 'line',
      },
    ],
  }

  const earningsChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const, labels: { color: 'var(--blue)' } },
      title: {
        display: true,
        text: `Earnings Trend (Last 30 Days) – ${chartType === 'line' ? 'Line' : 'Bar'} View`,
        color: 'var(--blue)',
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { color: 'var(--blue)' } },
      x: { ticks: { color: 'var(--blue)' } },
    },
  }

  // Job completion chart (pie)
  const jobChartData = {
    labels: ['Completed', 'Active', 'Disputed/Pending'],
    datasets: [
      {
        data: [stats.completedJobs, stats.activeJobs, stats.disputedJobs],
        backgroundColor: ['#10B981', '#3B82F6', '#EF4444'],
        borderWidth: 1,
      },
    ],
  }

  const jobChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const, labels: { color: 'var(--blue)' } },
      title: { display: true, text: 'Job Completion Status', color: 'var(--blue)' },
    },
  }

  const toggleChartType = () => {
    setChartType(prev => (prev === 'line' ? 'bar' : 'line'))
  }

  // Download Earnings chart as PNG

const downloadEarningsPNG = async () => {
  if (!earningsChartRef.current) {
    toast.error('Chart not ready')
    return
  }

  try {
    // Wait a tiny bit for chart to be fully rendered
    await new Promise(resolve => setTimeout(resolve, 300))

    // Use Chart.js built-in export (best quality)
    const chart = ChartJS.getChart(earningsChartRef.current.querySelector('canvas') as HTMLCanvasElement)
    if (!chart) throw new Error('Chart instance not found')

    const base64 = chart.toBase64Image('image/png', 1.0)

    const link = document.createElement('a')
    link.download = 'earnings-trend.png'
    link.href = base64
    link.click()

    toast.success('Earnings chart downloaded as PNG')
  } catch (err) {
    console.error('PNG export failed:', err)
    toast.error('Failed to download PNG – try again')
  }
}

const downloadEarningsPDF = async () => {
  if (!earningsChartRef.current) {
    toast.error('Chart not ready')
    return
  }

  try {
    await new Promise(resolve => setTimeout(resolve, 300))

    const chart = ChartJS.getChart(earningsChartRef.current.querySelector('canvas') as HTMLCanvasElement)
    if (!chart) throw new Error('Chart instance not found')

    const base64 = chart.toBase64Image('image/png', 1.0)

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: 'a4',
    })

    // Scale image to fit A4 landscape nicely
    const imgWidth = 270
    const imgHeight = 150  // adjust ratio as needed
    pdf.addImage(base64, 'PNG', 10, 20, imgWidth, imgHeight)

    // Optional: add title
    pdf.setFontSize(16)
    pdf.setTextColor(37, 99, 235) // --blue
    pdf.text('Earnings Trend (Last 30 Days)', 10, 10)

    pdf.save('earnings-trend.pdf')
    toast.success('Earnings chart downloaded as PDF')
  } catch (err) {
    console.error('PDF export failed:', err)
    toast.error('Failed to download PDF – try again')
  }
}

// Same pattern for Job Completion chart
const downloadJobPNG = async () => {
  if (!jobChartRef.current) {
    toast.error('Chart not ready')
    return
  }

  try {
    await new Promise(resolve => setTimeout(resolve, 300))

    const chart = ChartJS.getChart(jobChartRef.current.querySelector('canvas') as HTMLCanvasElement)
    if (!chart) throw new Error('Chart instance not found')

    const base64 = chart.toBase64Image('image/png', 1.0)

    const link = document.createElement('a')
    link.download = 'job-completion.png'
    link.href = base64
    link.click()

    toast.success('Job completion chart downloaded as PNG')
  } catch (err) {
    console.error('PNG export failed:', err)
    toast.error('Failed to download PNG – try again')
  }
}

const downloadJobPDF = async () => {
  if (!jobChartRef.current) {
    toast.error('Chart not ready')
    return
  }

  try {
    await new Promise(resolve => setTimeout(resolve, 300))

    const chart = ChartJS.getChart(jobChartRef.current.querySelector('canvas') as HTMLCanvasElement)
    if (!chart) throw new Error('Chart instance not found')

    const base64 = chart.toBase64Image('image/png', 1.0)

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4',
    })

    const imgWidth = 180
    const imgHeight = 140
    pdf.addImage(base64, 'PNG', 15, 30, imgWidth, imgHeight)

    pdf.setFontSize(16)
    pdf.setTextColor(37, 99, 235)
    pdf.text('Job Completion Status', 15, 20)

    pdf.save('job-completion.pdf')
    toast.success('Job completion chart downloaded as PDF')
  } catch (err) {
    console.error('PDF export failed:', err)
    toast.error('Failed to download PDF – try again')
  }
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

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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
            title="Platform Earnings (All Time)"
            value={formatNaira(stats.totalPlatformEarnings)}
            icon={FaWallet}
            color="purple"
            loading={loading}
          />
          <StatCard
            title="Daily Earnings"
            value={formatNaira(stats.dailyPlatformEarnings)}
            icon={FaChartLine}
            color="yellow"
            loading={loading}
          />
          <StatCard
            title="Weekly Earnings"
            value={formatNaira(stats.weeklyPlatformEarnings)}
            icon={FaChartLine}
            color="blue"
            loading={loading}
          />
          <StatCard
            title="Monthly Earnings"
            value={formatNaira(stats.monthlyPlatformEarnings)}
            icon={FaWallet}
            color="blue"
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

        {/* Charts Section */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earnings Trend Chart */}
          {!loading && stats.earningsTrend.length > 0 && (
            <div className="bg-[var(--white)] rounded-xl shadow p-6 border border-[var(--orange)]/30" ref={earningsChartRef}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--blue)] flex items-center gap-2">
                  <FaChartLine className="text-[var(--orange)]" />
                  Earnings Trend (Last 30 Days)
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
                      onClick={downloadEarningsPNG}
                      className="px-3 py-2 bg-[var(--blue)] hover:bg-blue-700 text-[var(--white)] rounded-lg transition text-sm flex items-center gap-1"
                    >
                      <FaDownload size={14} /> PNG
                    </button>
                    <button
                      onClick={downloadEarningsPDF}
                      className="px-3 py-2 bg-[var(--blue)] hover:bg-blue-700 text-[var(--white)] rounded-lg transition text-sm flex items-center gap-1"
                    >
                      <FaDownload size={14} /> PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-80">
                {chartType === 'line' ? (
                  <Line data={earningsChartData} options={earningsChartOptions} />
                ) : (
                  <Bar data={earningsChartData} options={earningsChartOptions} />
                )}
              </div>
            </div>
          )}

          {/* Job Completion Chart */}
          {!loading && (stats.completedJobs + stats.activeJobs + stats.disputedJobs > 0) && (
            <div className="bg-[var(--white)] rounded-xl shadow p-6 border border-[var(--orange)]/30" ref={jobChartRef}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--blue)] flex items-center gap-2">
                  <FaBriefcase className="text-[var(--orange)]" />
                  Job Completion Status
                </h3>

                <div className="flex gap-2">
                  <button
                    onClick={downloadJobPNG}
                    className="px-3 py-2 bg-[var(--blue)] hover:bg-blue-700 text-[var(--white)] rounded-lg transition text-sm flex items-center gap-1"
                  >
                    <FaDownload size={14} /> PNG
                  </button>
                  <button
                    onClick={downloadJobPDF}
                    className="px-3 py-2 bg-[var(--blue)] hover:bg-blue-700 text-[var(--white)] rounded-lg transition text-sm flex items-center gap-1"
                  >
                    <FaDownload size={14} /> PDF
                  </button>
                </div>
              </div>

              <div className="h-80">
                <Pie data={jobChartData} options={jobChartOptions} />
              </div>
            </div>
          )}
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