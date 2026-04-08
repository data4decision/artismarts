// app/dashboard/admin/Sidebar.tsx
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

// Logout handler
const logout = () => {
  console.log('Logging out...')
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
  { label: 'Messages ', href: '/admin-dashboard/messages', icon: FaComments },
  { label: 'Earnings & Payouts', href: '/admin-dashboard/earnings', icon: FaWallet },
  { label: 'Analytics', href: '/admin-dashboard/analytics', icon: FaChartLine },
  { label: 'Notifications', href: '/admin-dashboard/notifications', icon: FaBell },
  { label: 'Settings', href: '/admin-dashboard/settings', icon: FaCog },
  { label: 'Security & Logs', href: '/admin-dashboard/security', icon: FaShieldAlt },
  { label: 'Help / Support', href: '/admin-dashboard/help', icon: FaLifeRing },
];

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [loadingUnread, setLoadingUnread] = useState(true)
  const [pendingVerificationCount, setPendingVerificationCount] = useState(0)
  const [pendingJobRequestsCount, setPendingJobRequestsCount] = useState(0)
  const [activeJobsCount, setActiveJobsCount] = useState(0)
  const [completedJobsCount, setCompletedJobsCount] = useState(0)

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

// Fetch Completed Jobs Count
const fetchCompletedJobsCount = async () => {
  try {
    const {count, error} = await supabase
    .from('job_requests')
    .select('*', {count: 'exact', head: true})
    .in('status',[ 'completed'])

    if (error) throw error
    setCompletedJobsCount(count || 0)
  } catch (err) {
    console.error('Completed jobs count fetch failed:', err)
    setCompletedJobsCount(0)
  }
}

//Real-time subscription for Completed jobs
useEffect(() => {
  fetchCompletedJobsCount()

  const channel = supabase
  .channel('completed_jobs')
  .on('postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'job_requests',
    }, () => {
      fetchCompletedJobsCount()
    }
  )
  .subscribe()
  const handleFocus = () => {
    fetchCompletedJobsCount()
  }
  window.addEventListener('focus', handleFocus)
  return () => {
    supabase.removeChannel(channel)
    window.removeEventListener('focus', handleFocus)
  }
}, [])

const handleCompletedJobsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
  if (isActive('/admin-dashboard/completed-job')) {
    return
    
  }
  setCompletedJobsCount(0)
}

// Fetch Active Jobs Count
const fetchActiveJobsCount = async () => {
  try {
    const {count, error} = await supabase
      .from('job_requests')
      .select('*', {count: 'exact', head: true})
      .in('status', ['assigned', 'in_progress', 'completed_pending_review'])

      if (error) throw error
      setActiveJobsCount(count || 0)
  } catch (err) {
    console.error('Active jobs count fetch failed:', err)
    setActiveJobsCount(0)
  }
}

//Real-time subscription for active job requests
useEffect(() =>{
  fetchActiveJobsCount()

  const channel = supabase
  .channel('active_jobs')
  .on('postgres_changes', 
    {
      event: '*',
      schema: 'public',
      table: 'job_requests'
    }, () => {
      fetchActiveJobsCount()
    }
  )
  .subscribe()

  const handleFocus = () => {
    fetchActiveJobsCount()
  }
  window.addEventListener('focus', handleFocus)
  return () => {
    supabase.removeChannel(channel)
    window.removeEventListener('focus', handleFocus)
  }
}, [])

//Clear active job requests badge when clicking on Job Requests link
const handleActiveJobsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
  if (isActive('/admin-dashboard/assigned-jobs')) {
    return //Already on page, no need to clear
    
  }
  setActiveJobsCount(0)
}



// Fetch pending job requests count
const fetchPendingJobRequestsCount = async () => {
  try {
    const { count, error } = await supabase
      .from('job_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending'])
      // .eq('status', 'pending')

    if (error) throw error
    setPendingJobRequestsCount(count || 0)
  } catch (err) {
    console.error('Pending job requests count fetch failed:', err)
    setPendingJobRequestsCount(0)
  }
}

// Real-time subscription for pending job requests
useEffect(() => {
  fetchPendingJobRequestsCount()

  const channel = supabase
    .channel('pending_job_requests')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'job_requests',
    }, () => {
      fetchPendingJobRequestsCount()
    })
    .subscribe()

  const handleFocus = () => {
    fetchPendingJobRequestsCount()
  }

  window.addEventListener('focus', handleFocus)

  return () => {
    supabase.removeChannel(channel)
    window.removeEventListener('focus', handleFocus)
  }
}, [])

  //Clear pending job requests badge when clicking on Job Requests link
  const handleJobRequestsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isActive('/admin-dashboard/requests')) {
      return //Already on page, no need to clear
    }
    setPendingJobRequestsCount(0)
  }

  
  // Fetch pending verification count
  const fetchPendingVerificationCount = async () => {
    try {
      const { count, error}= await supabase
      .from ('profiles')
      .select('*', {count: 'exact', head: true})
      .eq ('role', 'artisan')
      .eq ('verification_status', 'pending')

      if (error) throw error
      setPendingVerificationCount(count || 0)
    } catch (err){
      console.error('pending verification count fetch failed:', err)
    setPendingVerificationCount(0)
    }
    
  }

   // Real-time subscription for pending verifications
   useEffect(() => {
    fetchPendingVerificationCount()
    fetchUnreadCount()
     // Realtime for new pending verifications
     const verificationChannel = supabase
     .channel('pending_verifications')
     .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: 'role=eq.artisan',
      },
      ()=> {
        fetchPendingVerificationCount()
      }
     ).subscribe()
     // Refresh on window focus
     const handleFocus = () => {
      fetchPendingVerificationCount()
      fetchUnreadCount()
     }
     window.addEventListener('focus', handleFocus)
     return () => {
      supabase.removeChannel(verificationChannel)
      window.removeEventListener('focus', handleFocus)
     }
   }, [])

   // Clear verification badge when clicking on Verification link
   const handleVerificationClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isActive('/admin-dashboard/verification')) {
      return //Already on page, no need to clear
   }
   // Optimistically hide the badge
   setPendingVerificationCount(0)
  }

  // Fetch initial unread count
  const fetchUnreadCount = async () => {
    setLoadingUnread(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: jobs } = await supabase
        .from('job_requests')
        .select('id')
        .not('assigned_artisan_id', 'is', null)

      if (!jobs?.length) {
        setUnreadTotal(0)
        return
      }

      const jobIds = jobs.map(j => j.id)

      const { data: readStatuses } = await supabase
        .from('user_job_read_status')
        .select('job_id, last_read_at')
        .eq('user_id', user.id)
        .in('job_id', jobIds)

      const readMap = new Map(readStatuses?.map(r => [r.job_id, r.last_read_at]) || [])

      let total = 0

      for (const jobId of jobIds) {
        const lastRead = readMap.get(jobId)
        let query = supabase
          .from('admin_artisan_messages')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', jobId)
          .neq('sender_id', user.id)

        if (lastRead) {
          query = query.gt('created_at', lastRead)
        }

        const { count } = await query
        total += count || 0
      }

      setUnreadTotal(total)
    } catch (err) {
      console.error('Unread fetch failed:', err)
      setUnreadTotal(0)
    } finally {
      setLoadingUnread(false)
    }
  }

  useEffect(() => {
  const setup = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const channel = supabase
      .channel('admin_unread_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_artisan_messages',
        filter: `sender_id=neq.${user.id}`
      }, () => {
        setUnreadTotal(prev => prev + 1)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  setup()
}, [])

  // Optimistic clear when clicking Messages link
  const handleMessagesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname.startsWith('/admin-dashboard/messages')) {
      // Already on messages page → no need to clear
      return
    }
    // Optimistically clear badge
    setUnreadTotal(0)
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
              const isCompletedJobs = label === 'Completed Jobs'
              const isActiveJobs = label === 'Active Jobs'
              const isPendingJobRequests = label === 'Job Requests'
              const isVerification = label === 'Verification'
              const isMessages = label === 'Messages / Support Tickets'
              return (
                <li key={href} className="relative">
                  <Link
                    href={href}
                    onClick={isCompletedJobs ? handleCompletedJobsClick : isActiveJobs ? handleActiveJobsClick : isPendingJobRequests ? handleJobRequestsClick : isVerification ? handleVerificationClick : isMessages ? handleMessagesClick : undefined}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm sm:text-[15px] ${
                      isActive(href)
                        ? 'bg-[var(--orange)] text-[var(--white)] font-semibold shadow'
                        : 'hover:bg-[var(--orange)]/90'
                    }`}
                    aria-current={isActive(href) ? 'page' : undefined}
                  >
                    <Icon className="shrink-0 text-lg" />
                    <span className="text-sm sm:text-[12px]">{label}</span>

                    {/* Completed Jobs Badge */}
                    {isCompletedJobs && completedJobsCount > 0 && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-[var(--orange)] text-white border border-[var(--white)] text-xs font-bold px-1 py-0.5 rounded-full min-w-[20px] text-center shadow">
                        {completedJobsCount > 99 ? '99+' : completedJobsCount}
                        </span>
                    )}

                    {/* Active Jobs Badge */}
                    {isActiveJobs && activeJobsCount > 0 && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-[var(--orange)] text-white border border-[var(--white)] text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
                        {activeJobsCount > 99 ? '99+' : activeJobsCount}
                        </span>
                    )}
                     
                      {/* Job Requests Badge */}
                      {isPendingJobRequests && pendingJobRequestsCount > 0 && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-[var(--orange)] text-white border border-[var(--white)] text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
                          {pendingJobRequestsCount > 99 ? '99+' : pendingJobRequestsCount}
                        </span>
                      )}

                    {/* Verification Badge */}
                    {isVerification && pendingVerificationCount > 0 && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-[var(--orange)] text-white border border-[var(--white)] text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
                        {pendingVerificationCount > 99 ? '99+' : pendingVerificationCount}
                      </span>
                    )}

                    {/* Unread badge */}
                    {isMessages && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-[var(--orange)] border border-[var(--white)] text-white border border-[var(--white)] text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
                        {loadingUnread ? '...' : unreadTotal > 99 ? '99+' : unreadTotal || ''}
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
          aria-label="Logout"
        >
          <FaSignOutAlt className="text-lg" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}