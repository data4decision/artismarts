// 'use client'

// import React, { useState, useEffect } from 'react'
// import Link from 'next/link'
// import Image from 'next/image'
// import { usePathname, useRouter } from 'next/navigation'
// import {
//   FaTachometerAlt,
//   FaUsers,
//   FaUserCog,
//   FaBriefcase,
//   FaTasks,
//   FaCheckCircle,
//   FaTimesCircle,
//   FaStar,
//   FaComments,
//   FaWallet,
//   FaChartLine,
//   FaCog,
//   FaBell,
//   FaLifeRing,
//   FaShieldAlt,
//   FaTimes,
//   FaBars,
//   FaSignOutAlt,
// } from 'react-icons/fa'
// import { supabase } from '@/lib/supabase'
// import toast from 'react-hot-toast'

// const logout = () => {
//   window.location.href = '/login'
// }

// const nav = [
//   { label: 'Dashboard', href: '/admin-dashboard', icon: FaTachometerAlt },
//   { label: 'Users', href: '/admin-dashboard/users', icon: FaUsers },
//   { label: 'Verification', href: '/admin-dashboard/verification', icon: FaCheckCircle },
//   { label: 'Artisans', href: '/admin-dashboard/artisans', icon: FaUserCog },
//   { label: 'Customers', href: '/admin-dashboard/customers', icon: FaUsers },
//   { label: 'Job Requests', href: '/admin-dashboard/requests', icon: FaBriefcase },
//   { label: 'Active Jobs', href: '/admin-dashboard/assigned-jobs', icon: FaTasks },
//   { label: 'Completed Jobs', href: '/admin-dashboard/completed-job', icon: FaCheckCircle },
//   { label: 'Disputed Jobs', href: '/admin-dashboard/disputes', icon: FaTimesCircle },
//   { label: 'Reviews & Ratings', href: '/admin-dashboard/reviews', icon: FaStar },
//   { label: 'Messages', href: '/admin-dashboard/messages', icon: FaComments },
//   { label: 'Earnings & Payouts', href: '/admin-dashboard/earnings', icon: FaWallet },
//   { label: 'Analytics', href: '/admin-dashboard/analytics', icon: FaChartLine },
//   { label: 'Notifications', href: '/admin-dashboard/notifications', icon: FaBell },
//   { label: 'Settings', href: '/admin-dashboard/settings', icon: FaCog },
//   { label: 'Security & Logs', href: '/admin-dashboard/security', icon: FaShieldAlt },
//   { label: 'Help / Support', href: '/admin-dashboard/help', icon: FaLifeRing },
// ]

// export default function Sidebar() {
//   const pathname = usePathname()
//   const router = useRouter()

//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
//   const [unreadTotal, setUnreadTotal] = useState(0)
//   const [loadingUnread, setLoadingUnread] = useState(true)

//   // Other badge states (kept from your original code)
//   const [pendingVerificationCount, setPendingVerificationCount] = useState(0)
//   const [pendingJobRequestsCount, setPendingJobRequestsCount] = useState(0)
//   const [activeJobsCount, setActiveJobsCount] = useState(0)
//   const [completedNotificationCount, setCompletedNotificationCount] = useState(0)
//   const [disputedNotificationCount, setDisputedNotificationCount] = useState(0)

//   const isActive = (href: string) => {
//     return pathname === href || pathname.startsWith(href + '/')
//   }

//   // ====================== MESSAGES BADGE - is_seen logic ======================
//   const fetchUnreadCount = async () => {
//     setLoadingUnread(true)

//     try {
//       const { data: jobs } = await supabase
//         .from('job_requests')
//         .select('id')
//         .not('assigned_artisan_id', 'is', null)

//       if (!jobs?.length) {
//         setUnreadTotal(0)
//         return
//       }

//       const jobIds = jobs.map(j => j.id)

//       let total = 0

//       for (const jobId of jobIds) {
//         const { count } = await supabase
//           .from('admin_artisan_messages')
//           .select('*', { count: 'exact', head: true })
//           .eq('job_id', jobId)
//           .eq('is_seen', false)
//           .neq('sender_id', (await supabase.auth.getUser()).data.user?.id)

//         total += count || 0
//       }

//       setUnreadTotal(total)
//     } catch (err) {
//       console.error('Admin unread messages fetch failed:', err)
//       setUnreadTotal(0)
//     } finally {
//       setLoadingUnread(false)
//     }
//   }

//   useEffect(() => {
//     fetchUnreadCount()

//     const channel = supabase
//       .channel('admin_unread_messages')
//       .on('postgres_changes', {
//         event: 'INSERT',
//         schema: 'public',
//         table: 'admin_artisan_messages'
//       }, () => {
//         fetchUnreadCount()
//       })
//       .subscribe()

//     window.addEventListener('focus', fetchUnreadCount)
//     const interval = setInterval(fetchUnreadCount, 30000)

//     return () => {
//       supabase.removeChannel(channel)
//       window.removeEventListener('focus', fetchUnreadCount)
//       clearInterval(interval)
//     }
//   }, [])

//   const handleMessagesClick = () => {
//     if (pathname.startsWith('/admin-dashboard/messages')) return
//     setUnreadTotal(0) // optimistic clear
//   }

//   // ====================== YOUR OTHER BADGE FUNCTIONS ======================
//   // (Kept as-is from your original code)

//   const fetchDisputedNotificationCount = async () => {
//     try {
//       const { count, error } = await supabase
//         .from('notifications')
//         .select('*', { count: 'exact', head: true })
//         .eq('type', 'new_disputed_job')
//         .eq('read', false)

//       if (error) throw error
//       setDisputedNotificationCount(count ?? 0)
//     } catch (err) {
//       console.error('Disputed notification count fetch failed:', err)
//       setDisputedNotificationCount(0)
//     }
//   }

//   const fetchCompletedNotificationCount = async () => {
//     try {
//       const { count, error } = await supabase
//         .from('notifications')
//         .select('*', { count: 'exact', head: true })
//         .eq('type', 'new_completed_job')
//         .eq('read', false)

//       if (error) throw error
//       setCompletedNotificationCount(count ?? 0)
//     } catch (err) {
//       console.error('Completed notification count fetch failed:', err)
//       setCompletedNotificationCount(0)
//     }
//   }

//   const fetchActiveJobsCount = async () => {
//     try {
//       const { count, error } = await supabase
//         .from('job_requests')
//         .select('*', { count: 'exact', head: true })
//         .in('status', ['assigned', 'in_progress', 'completed_pending_review'])

//       if (error) throw error
//       setActiveJobsCount(count || 0)
//     } catch (err) {
//       console.error('Active jobs count fetch failed:', err)
//       setActiveJobsCount(0)
//     }
//   }

//   const fetchPendingJobRequestsCount = async () => {
//     try {
//       const { count, error } = await supabase
//         .from('job_requests')
//         .select('*', { count: 'exact', head: true })
//         .eq('status', 'pending')

//       if (error) throw error
//       setPendingJobRequestsCount(count || 0)
//     } catch (err) {
//       console.error('Pending job requests count fetch failed:', err)
//       setPendingJobRequestsCount(0)
//     }
//   }

//   const fetchPendingVerificationCount = async () => {
//     try {
//       const { count, error } = await supabase
//         .from('profiles')
//         .select('*', { count: 'exact', head: true })
//         .eq('role', 'artisan')
//         .eq('verification_status', 'pending')

//       if (error) throw error
//       setPendingVerificationCount(count || 0)
//     } catch (err) {
//       console.error('Pending verification count fetch failed:', err)
//       setPendingVerificationCount(0)
//     }
//   }

//   // Real-time & focus handlers for other badges (kept minimal)
//   useEffect(() => {
//     fetchDisputedNotificationCount()
//     fetchCompletedNotificationCount()
//     fetchActiveJobsCount()
//     fetchPendingJobRequestsCount()
//     fetchPendingVerificationCount()
//   }, [])

//   // Click handlers for other badges (kept from your code)
//   const handleDisputedNotificationClick = async () => {
//     if (isActive('/admin-dashboard/disputes')) return
//     try {
//       await supabase
//         .from('notifications')
//         .update({ read: true })
//         .eq('type', 'new_disputed_job')
//         .eq('read', false)
//       setDisputedNotificationCount(0)
//     } catch (err) {
//       console.error(err)
//       fetchDisputedNotificationCount()
//     }
//   }

//   const handleCompletedNotificationClick = async () => {
//     if (isActive('/admin-dashboard/completed-job')) return
//     try {
//       await supabase
//         .from('notifications')
//         .update({ read: true })
//         .eq('type', 'new_completed_job')
//         .eq('read', false)
//       setCompletedNotificationCount(0)
//     } catch (err) {
//       console.error(err)
//       fetchCompletedNotificationCount()
//     }
//   }

//   const handleActiveJobsClick = () => {
//     if (isActive('/admin-dashboard/assigned-jobs')) return
//     setActiveJobsCount(0)
//   }

//   const handleJobRequestsClick = () => {
//     if (isActive('/admin-dashboard/requests')) return
//     setPendingJobRequestsCount(0)
//   }

//   const handleVerificationClick = () => {
//     if (isActive('/admin-dashboard/verification')) return
//     setPendingVerificationCount(0)
//   }

//   return (
//     <>
//       {/* Mobile hamburger */}
//       <button
//         className="md:hidden fixed top-3 left-4 z-50 bg-white p-2 text-[var(--blue)] rounded-full shadow-lg border border-[var(--orange)]"
//         onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//         aria-label="Toggle menu"
//       >
//         {isMobileMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
//       </button>

//       {/* Sidebar */}
//       <aside
//         className={`fixed md:static inset-y-0 top-0 left-0 h-screen bg-[var(--blue)] text-[var(--white)] flex flex-col z-40 transition-all duration-300 ${
//           isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
//         } md:translate-x-0`}
//         aria-label="Admin sidebar"
//       >
//         <div className="px-4 h-16 flex items-center gap-2 font-semibold border-b border-[var(--orange)]">
//           <div className="h-9 w-9 grid place-items-center rounded-full bg-[var(--white)] overflow-hidden">
//             <Image src="/log.png" width={70} height={70} alt="Artismart logo" priority />
//           </div>
//           <span className="text-lg">Artismart Admin</span>
//         </div>

//         <nav className="flex-1">
//           <ul className="py-2">
//             {nav.map(({ href, icon: Icon, label }) => {
//               const isMessages = label === 'Messages'
//               const isDisputedJobs = label === 'Disputed Jobs'
//               const isCompletedJobs = label === 'Completed Jobs'
//               const isActiveJobs = label === 'Active Jobs'
//               const isPendingJobRequests = label === 'Job Requests'
//               const isVerification = label === 'Verification'

//               return (
//                 <li key={href}>
//                   <Link
//                     href={href}
//                     onClick={(e) => {
//                       if (isMessages) return handleMessagesClick()
//                       if (isDisputedJobs) return handleDisputedNotificationClick()
//                       if (isCompletedJobs) return handleCompletedNotificationClick()
//                       if (isActiveJobs) return handleActiveJobsClick()
//                       if (isPendingJobRequests) return handleJobRequestsClick()
//                       if (isVerification) return handleVerificationClick()
//                     }}
//                     className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm sm:text-[15px] ${
//                       isActive(href)
//                         ? 'bg-[var(--orange)] text-[var(--white)] font-semibold shadow'
//                         : 'hover:bg-[var(--orange)]/90'
//                     }`}
//                   >
//                     <Icon className="shrink-0 text-lg" />
//                     <span>{label}</span>

//                     {/* Messages Badge */}
//                     {isMessages && unreadTotal > 0 && (
//                       <span className="ml-auto bg-[var(--orange)] border border-white text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
//                         {loadingUnread ? '...' : unreadTotal > 99 ? '99+' : unreadTotal}
//                       </span>
//                     )}

//                     {/* Disputed Jobs Badge */}
//                     {isDisputedJobs && disputedNotificationCount > 0 && (
//                       <span className="ml-auto bg-[var(--orange)] border border-white text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
//                         {disputedNotificationCount > 99 ? '99+' : disputedNotificationCount}
//                       </span>
//                     )}

//                     {/* Completed Jobs Badge */}
//                     {isCompletedJobs && completedNotificationCount > 0 && (
//                       <span className="ml-auto bg-[var(--orange)] border border-white text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
//                         {completedNotificationCount > 99 ? '99+' : completedNotificationCount}
//                       </span>
//                     )}

//                     {/* Active Jobs Badge */}
//                     {isActiveJobs && activeJobsCount > 0 && (
//                       <span className="ml-auto bg-[var(--orange)] border border-white text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
//                         {activeJobsCount > 99 ? '99+' : activeJobsCount}
//                       </span>
//                     )}

//                     {/* Pending Job Requests Badge */}
//                     {isPendingJobRequests && pendingJobRequestsCount > 0 && (
//                       <span className="ml-auto bg-[var(--orange)] border border-white text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
//                         {pendingJobRequestsCount > 99 ? '99+' : pendingJobRequestsCount}
//                       </span>
//                     )}

//                     {/* Verification Badge */}
//                     {isVerification && pendingVerificationCount > 0 && (
//                       <span className="ml-auto bg-[var(--orange)] border border-white text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
//                         {pendingVerificationCount > 99 ? '99+' : pendingVerificationCount}
//                       </span>
//                     )}
//                   </Link>
//                 </li>
//               )
//             })}
//           </ul>
//         </nav>

//         <button
//           onClick={logout}
//           className="flex items-center gap-3 px-4 py-3 text-left text-[var(--white)] hover:text-[var(--orange)] hover:bg-[var(--blue)]/90 transition-colors"
//         >
//           <FaSignOutAlt className="text-lg" />
//           <span>Logout</span>
//         </button>
//       </aside>

//       {isMobileMenuOpen && (
//         <div
//           className="fixed inset-0 bg-black/50 z-30 md:hidden"
//           onClick={() => setIsMobileMenuOpen(false)}
//         />
//       )}
//     </>
//   )
// }



'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  FaTachometerAlt,
  FaUsers,
  FaUserCog,
  FaBriefcase,
  FaTasks,
  FaCheckCircle,
  FaTimesCircle,
  FaStar,
  FaComments,
  FaWallet,
  FaChartLine,
  FaCog,
  FaBell,
  FaLifeRing,
  FaShieldAlt,
  FaTimes,
  FaBars,
  FaSignOutAlt,
} from 'react-icons/fa'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const logout = () => {
  window.location.href = '/login'
}

const nav = [
  { label: 'Dashboard', href: '/admin-dashboard', icon: FaTachometerAlt },
  { label: 'Users', href: '/admin-dashboard/users', icon: FaUsers },
  { label: 'Verification', href: '/admin-dashboard/verification', icon: FaCheckCircle },
  { label: 'Artisans', href: '/admin-dashboard/artisans', icon: FaUserCog },
  { label: 'Customers', href: '/admin-dashboard/customers', icon: FaUsers },
  { label: 'Job Requests', href: '/admin-dashboard/requests', icon: FaBriefcase },
  { label: 'Active Jobs', href: '/admin-dashboard/assigned-jobs', icon: FaTasks },
  { label: 'Completed Jobs', href: '/admin-dashboard/completed-job', icon: FaCheckCircle },
  { label: 'Disputed Jobs', href: '/admin-dashboard/disputes', icon: FaTimesCircle },
  { label: 'Reviews & Ratings', href: '/admin-dashboard/reviews', icon: FaStar },
  { label: 'Messages', href: '/admin-dashboard/messages', icon: FaComments },
  { label: 'Earnings & Payouts', href: '/admin-dashboard/earnings', icon: FaWallet },
  { label: 'Analytics', href: '/admin-dashboard/analytics', icon: FaChartLine },
  { label: 'Notifications', href: '/admin-dashboard/notifications', icon: FaBell },
  { label: 'Settings', href: '/admin-dashboard/settings', icon: FaCog },
  { label: 'Security & Logs', href: '/admin-dashboard/security', icon: FaShieldAlt },
  { label: 'Help / Support', href: '/admin-dashboard/help', icon: FaLifeRing },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [loadingUnread, setLoadingUnread] = useState(true)

  // Other badge states
  const [pendingVerificationCount, setPendingVerificationCount] = useState(0)
  const [pendingJobRequestsCount, setPendingJobRequestsCount] = useState(0)
  const [activeJobsCount, setActiveJobsCount] = useState(0)
  const [completedNotificationCount, setCompletedNotificationCount] = useState(0)
  const [disputedNotificationCount, setDisputedNotificationCount] = useState(0)

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  // ====================== MESSAGES BADGE - Combined Artisan + Customer using is_seen ======================
  const fetchUnreadCount = async () => {
    setLoadingUnread(true)

    try {
      // Get all jobs that have assigned artisans or customers
      const { data: jobs } = await supabase
        .from('job_requests')
        .select('id')
        .or('assigned_artisan_id.not.is.null,customer_id.not.is.null')

      if (!jobs?.length) {
        setUnreadTotal(0)
        return
      }

      const jobIds = jobs.map(j => j.id)

      let total = 0

      // Count unread from admin_artisan_messages
      for (const jobId of jobIds) {
        const { count: artisanCount } = await supabase
          .from('admin_artisan_messages')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', jobId)
          .eq('is_seen', false)
          .neq('sender_id', (await supabase.auth.getUser()).data.user?.id)

        total += artisanCount || 0
      }

      // Count unread from admin_customer_messages
      for (const jobId of jobIds) {
        const { count: customerCount } = await supabase
          .from('admin_customer_messages')
          .select('*', { count: 'exact', head: true })
          .eq('job_request_id', jobId)
          .eq('is_seen', false)
          .neq('sender_id', (await supabase.auth.getUser()).data.user?.id)

        total += customerCount || 0
      }

      setUnreadTotal(total)
    } catch (err) {
      console.error('Admin unread messages fetch failed:', err)
      setUnreadTotal(0)
    } finally {
      setLoadingUnread(false)
    }
  }

  useEffect(() => {
    fetchUnreadCount()

    // Real-time for both tables
    const artisanChannel = supabase
      .channel('admin_unread_artisan')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_artisan_messages'
      }, () => fetchUnreadCount())
      .subscribe()

    const customerChannel = supabase
      .channel('admin_unread_customer')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_customer_messages'
      }, () => fetchUnreadCount())
      .subscribe()

    window.addEventListener('focus', fetchUnreadCount)
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => {
      supabase.removeChannel(artisanChannel)
      supabase.removeChannel(customerChannel)
      window.removeEventListener('focus', fetchUnreadCount)
      clearInterval(interval)
    }
  }, [])

  const handleMessagesClick = () => {
    if (pathname.startsWith('/admin-dashboard/messages')) return
    setUnreadTotal(0) // optimistic clear
  }

  // ====================== YOUR OTHER BADGE FUNCTIONS (unchanged) ======================
  const fetchDisputedNotificationCount = async () => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'new_disputed_job')
        .eq('read', false)

      if (error) throw error
      setDisputedNotificationCount(count ?? 0)
    } catch (err) {
      console.error('Disputed notification count fetch failed:', err)
      setDisputedNotificationCount(0)
    }
  }

  const fetchCompletedNotificationCount = async () => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'new_completed_job')
        .eq('read', false)

      if (error) throw error
      setCompletedNotificationCount(count ?? 0)
    } catch (err) {
      console.error('Completed notification count fetch failed:', err)
      setCompletedNotificationCount(0)
    }
  }

  const fetchActiveJobsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('job_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['assigned', 'in_progress', 'completed_pending_review'])

      if (error) throw error
      setActiveJobsCount(count || 0)
    } catch (err) {
      console.error('Active jobs count fetch failed:', err)
      setActiveJobsCount(0)
    }
  }

  const fetchPendingJobRequestsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('job_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (error) throw error
      setPendingJobRequestsCount(count || 0)
    } catch (err) {
      console.error('Pending job requests count fetch failed:', err)
      setPendingJobRequestsCount(0)
    }
  }

  const fetchPendingVerificationCount = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'artisan')
        .eq('verification_status', 'pending')

      if (error) throw error
      setPendingVerificationCount(count || 0)
    } catch (err) {
      console.error('Pending verification count fetch failed:', err)
      setPendingVerificationCount(0)
    }
  }

  // Real-time & focus for other badges
  useEffect(() => {
    fetchDisputedNotificationCount()
    fetchCompletedNotificationCount()
    fetchActiveJobsCount()
    fetchPendingJobRequestsCount()
    fetchPendingVerificationCount()
  }, [])

  const handleDisputedNotificationClick = async () => {
    if (isActive('/admin-dashboard/disputes')) return
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('type', 'new_disputed_job')
        .eq('read', false)
      setDisputedNotificationCount(0)
    } catch (err) {
      console.error(err)
      fetchDisputedNotificationCount()
    }
  }

  const handleCompletedNotificationClick = async () => {
    if (isActive('/admin-dashboard/completed-job')) return
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('type', 'new_completed_job')
        .eq('read', false)
      setCompletedNotificationCount(0)
    } catch (err) {
      console.error(err)
      fetchCompletedNotificationCount()
    }
  }

  const handleActiveJobsClick = () => {
    if (isActive('/admin-dashboard/assigned-jobs')) return
    setActiveJobsCount(0)
  }

  const handleJobRequestsClick = () => {
    if (isActive('/admin-dashboard/requests')) return
    setPendingJobRequestsCount(0)
  }

  const handleVerificationClick = () => {
    if (isActive('/admin-dashboard/verification')) return
    setPendingVerificationCount(0)
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-3 left-4 z-50 bg-white p-2 text-[var(--blue)] rounded-full shadow-lg border border-[var(--orange)]"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 top-0 left-0 h-screen bg-[var(--blue)] text-[var(--white)] flex flex-col z-40 transition-all duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
        aria-label="Admin sidebar"
      >
        <div className="px-4 h-16 flex items-center gap-2 font-semibold border-b border-[var(--orange)]">
          <div className="h-9 w-9 grid place-items-center rounded-full bg-[var(--white)] overflow-hidden">
            <Image src="/log.png" width={70} height={70} alt="Artismart logo" priority />
          </div>
          <span className="text-lg">Artismart Admin</span>
        </div>

        <nav className="flex-1">
          <ul className="py-2">
            {nav.map(({ href, icon: Icon, label }) => {
              const isMessages = label === 'Messages'
              const isDisputedJobs = label === 'Disputed Jobs'
              const isCompletedJobs = label === 'Completed Jobs'
              const isActiveJobs = label === 'Active Jobs'
              const isPendingJobRequests = label === 'Job Requests'
              const isVerification = label === 'Verification'

              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={(e) => {
                      if (isMessages) return handleMessagesClick()
                      if (isDisputedJobs) return handleDisputedNotificationClick()
                      if (isCompletedJobs) return handleCompletedNotificationClick()
                      if (isActiveJobs) return handleActiveJobsClick()
                      if (isPendingJobRequests) return handleJobRequestsClick()
                      if (isVerification) return handleVerificationClick()
                    }}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm sm:text-[15px] ${
                      isActive(href)
                        ? 'bg-[var(--orange)] text-[var(--white)] font-semibold shadow'
                        : 'hover:bg-[var(--orange)]/90'
                    }`}
                  >
                    <Icon className="shrink-0 text-lg" />
                    <span>{label}</span>

                    {/* Messages Badge - Combined Artisan + Customer */}
                    {isMessages && unreadTotal > 0 && (
                      <span className="ml-auto bg-[var(--orange)] border border-white text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
                        {loadingUnread ? '...' : unreadTotal > 99 ? '99+' : unreadTotal}
                      </span>
                    )}

                    {/* Disputed Jobs Badge */}
                    {isDisputedJobs && disputedNotificationCount > 0 && (
                      <span className="ml-auto bg-[var(--orange)] border border-white text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
                        {disputedNotificationCount > 99 ? '99+' : disputedNotificationCount}
                      </span>
                    )}

                    {/* Completed Jobs Badge */}
                    {isCompletedJobs && completedNotificationCount > 0 && (
                      <span className="ml-auto bg-[var(--orange)] border border-white text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
                        {completedNotificationCount > 99 ? '99+' : completedNotificationCount}
                      </span>
                    )}

                    {/* Active Jobs Badge */}
                    {isActiveJobs && activeJobsCount > 0 && (
                      <span className="ml-auto bg-[var(--orange)] border border-white text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
                        {activeJobsCount > 99 ? '99+' : activeJobsCount}
                      </span>
                    )}

                    {/* Pending Job Requests Badge */}
                    {isPendingJobRequests && pendingJobRequestsCount > 0 && (
                      <span className="ml-auto bg-[var(--orange)] border border-white text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
                        {pendingJobRequestsCount > 99 ? '99+' : pendingJobRequestsCount}
                      </span>
                    )}

                    {/* Verification Badge */}
                    {isVerification && pendingVerificationCount > 0 && (
                      <span className="ml-auto bg-[var(--orange)] border border-white text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
                        {pendingVerificationCount > 99 ? '99+' : pendingVerificationCount}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 text-left text-[var(--white)] hover:text-[var(--orange)] hover:bg-[var(--blue)]/90 transition-colors"
        >
          <FaSignOutAlt className="text-lg" />
          <span>Logout</span>
        </button>
      </aside>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}