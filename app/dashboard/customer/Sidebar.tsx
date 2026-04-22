// 'use client'

// import React, { useState, useEffect } from 'react'
// import Link from 'next/link'
// import Image from 'next/image'
// import toast from 'react-hot-toast'
// import { usePathname } from 'next/navigation'
// import {
//   FaTachometerAlt,
//   FaUser,
//   FaSearch,
//   FaBriefcase,
//   FaClipboardList,
//   FaComments,
//   FaCreditCard,
//   FaStar,
//   FaBell,
//   FaLifeRing,
//   FaSignOutAlt,
//   FaBars,
//   FaTimes,
//   FaCheckCircle,
// } from 'react-icons/fa'
// import { supabase } from '@/lib/supabase'

// const logout = () => {
//   window.location.href = '/login'
// }

// const nav = [
//   { label: 'Dashboard', href: '/dashboard/customer', icon: FaTachometerAlt },
//   { label: 'Profile', href: '/dashboard/customer/profile', icon: FaUser },
//   { label: 'Browse Artisans', href: '/dashboard/customer/artisans', icon: FaSearch },
//   { label: 'My Bookings', href: '/dashboard/customer/bookings', icon: FaClipboardList },
//   { label: 'Booking Requests', href: '/dashboard/customer/requests', icon: FaBriefcase },
//   { label: 'Completed Jobs', href: '/dashboard/customer/completed-jobs', icon: FaCheckCircle },
//   { label: 'Messages', href: '/dashboard/customer/messages', icon: FaComments },
//   { label: 'Payments', href: '/dashboard/customer/payment', icon: FaCreditCard },
//   { label: 'Reviews', href: '/dashboard/customer/reviews', icon: FaStar },
//   { label: 'Notifications', href: '/dashboard/customer/notifications', icon: FaBell },
//   { label: 'Support', href: '/dashboard/customer/support', icon: FaLifeRing },
// ]

// export default function Sidebar() {
//   const pathname = usePathname()
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
//   const [unreadTotal, setUnreadTotal] = useState(0)
//   const [loadingUnread, setLoadingUnread] = useState(true)

//   const isActive = (href: string) => {
//     return pathname === href || pathname.startsWith(href + '/')
//   }

//   // ✅ FETCH UNREAD COUNT (CORRECT LOGIC)
//   const fetchUnreadCount = async () => {
//     setLoadingUnread(true)

//     try {
//       const { data: { user } } = await supabase.auth.getUser()
//       if (!user) return

//       // ✅ INCLUDE ALL RELEVANT STATUSES
//       const { data: jobs, error: jobsError } = await supabase
//         .from('job_requests')
//         .select('id')
//         .eq('customer_id', user.id)
//         .in('status', [
//           'pending',
//           'assigned',
//           'in_progress',
//           'completed_pending_review',
//           'completed'
//         ])

//       if (jobsError || !jobs?.length) {
//         setUnreadTotal(0)
//         return
//       }

//       const jobIds = jobs.map(j => j.id)

//       // Get read timestamps
//       const { data: readStatuses } = await supabase
//         .from('user_job_read_status')
//         .select('job_id, last_read_at')
//         .eq('user_id', user.id)
//         .in('job_id', jobIds)

//       const readMap = new Map(
//         readStatuses?.map(r => [r.job_id, r.last_read_at]) || []
//       )

//       let total = 0

//       for (const jobId of jobIds) {
//         let query = supabase
//           .from('admin_customer_messages')
//           .select('*', { count: 'exact', head: true })
//           .eq('job_request_id', jobId)
//           .neq('sender_id', user.id)

//         const lastRead = readMap.get(jobId)

//         if (lastRead) {
//           query = query.gt('created_at', lastRead)
//         }

//         const { count } = await query
//         total += count || 0
//       }

//       setUnreadTotal(total)
//     } catch (err) {
//       console.error('Unread fetch failed:', err)
//       setUnreadTotal(0)
//     } finally {
//       setLoadingUnread(false)
//     }
//   }

//   useEffect(() => {
//     fetchUnreadCount()

//     // ✅ REAL-TIME (SAFE VERSION)
//     const channel = supabase
//       .channel('customer_unread_messages')
//       .on('postgres_changes', {
//         event: 'INSERT',
//         schema: 'public',
//         table: 'admin_customer_messages'
//       }, async (payload) => {
//         const newMsg = payload.new as any

//         const { data: { user } } = await supabase.auth.getUser()
//         if (newMsg.sender_id === user?.id) return

//         // ✅ ALWAYS RECALCULATE (NO WRONG COUNT)
//         fetchUnreadCount()

//         toast('New message from admin', {
//           icon: '💬',
//           duration: 4000,
//           position: 'top-right',
//           style: {
//             background: '#0b0b5c',
//             color: '#ffffff',
//             border: '1px solid #f47b20',
//           }
//         })

//         // Optional sound
//         try {
//           const audio = new Audio('/notification.mp3')
//           audio.volume = 0.4
//           audio.play().catch(() => {})
//         } catch {}
//       })
//       .subscribe()

//     // ✅ REFRESH WHEN USER RETURNS
//     window.addEventListener('focus', fetchUnreadCount)

//     const interval = setInterval(fetchUnreadCount, 30000)

//     return () => {
//       supabase.removeChannel(channel)
//       window.removeEventListener('focus', fetchUnreadCount)
//       clearInterval(interval)
//     }
//   }, [])

//   // ✅ INSTANT UI CLEAR (LIKE WHATSAPP)
//   const handleMessagesClick = () => {
//     setUnreadTotal(0)
//   }

//   return (
//     <>
//       {/* Mobile button */}
//       <button
//         className="md:hidden fixed top-3 left-4 z-50 bg-white p-2 text-[var(--blue)] rounded-full shadow-lg border border-[var(--orange)]"
//         onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//       >
//         {isMobileMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
//       </button>

//       {/* Sidebar */}
//       <aside
//         className={`fixed md:static inset-y-0 top-0 left-0 h-screen bg-[var(--blue)] text-white flex flex-col z-40 transition-all duration-300 ${
//           isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
//         } md:translate-x-0`}
//       >
//         <div className="px-4 h-16 flex items-center gap-2 border-b border-[var(--orange)]">
//           <div className="h-9 w-9 grid place-items-center rounded-full bg-white overflow-hidden">
//             <Image src="/log.png" width={70} height={70} alt="Logo" />
//           </div>
//           <span className="text-lg font-semibold">Artismart</span>
//         </div>

//         <nav className="flex-1">
//           <ul className="py-2">
//             {nav.map(({ href, icon: Icon, label }) => {
//               const isMessages = href === '/dashboard/customer/messages'

//               return (
//                 <li key={href}>
//                   <Link
//                     href={href}
//                     onClick={isMessages ? handleMessagesClick : undefined}
//                     className={`flex items-center gap-3 px-4 py-3 text-sm relative ${
//                       isActive(href)
//                         ? 'bg-[var(--orange)] text-white font-semibold'
//                         : 'hover:bg-[var(--orange)]/90'
//                     }`}
//                   >
//                     <Icon className="text-lg" />
//                     <span>{label}</span>

//                     {/* ✅ BADGE */}
//                     {isMessages && unreadTotal > 0 && (
//                       <span className="ml-auto bg-[var(--orange)] border border-white text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
//                         {loadingUnread ? '...' : unreadTotal}
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
//           className="flex items-center gap-3 px-4 py-3 hover:text-[var(--orange)]"
//         >
//           <FaSignOutAlt />
//           Logout
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
import toast from 'react-hot-toast'
import { usePathname } from 'next/navigation'
import {
  FaTachometerAlt,
  FaUser,
  FaSearch,
  FaBriefcase,
  FaClipboardList,
  FaComments,
  FaCreditCard,
  FaStar,
  FaBell,
  FaLifeRing,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaCheckCircle,
  FaCog,
} from 'react-icons/fa'
import { supabase } from '@/lib/supabase'

const logout = () => {
  window.location.href = '/login'
}

const nav = [
  { label: 'Dashboard', href: '/dashboard/customer', icon: FaTachometerAlt },
  { label: 'Profile', href: '/dashboard/customer/profile', icon: FaUser },
  { label: 'Browse Artisans', href: '/dashboard/customer/artisans', icon: FaSearch },
  { label: 'My Bookings', href: '/dashboard/customer/bookings', icon: FaClipboardList },
  { label: 'Booking Requests', href: '/dashboard/customer/requests', icon: FaBriefcase },
  { label: 'Completed Jobs', href: '/dashboard/customer/completed-jobs', icon: FaCheckCircle },
  { label: 'Messages', href: '/dashboard/customer/messages', icon: FaComments },
  { label: 'Payments', href: '/dashboard/customer/payment', icon: FaCreditCard },
  { label: 'Settings', href: '/dashboard/customer/settings', icon: FaCog },
  { label: 'Notifications', href: '/dashboard/customer/notifications', icon: FaBell },
  { label: 'Support', href: '/dashboard/customer/support', icon: FaLifeRing },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [loadingUnread, setLoadingUnread] = useState(true)

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Fetch total unread messages using is_seen column
  const fetchUnreadCount = async () => {
    setLoadingUnread(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUnreadTotal(0)
        return
      }

      // Get all jobs for the customer (no status filter)
      const { data: jobs, error: jobsError } = await supabase
        .from('job_requests')
        .select('id')
        .eq('customer_id', user.id)

      if (jobsError || !jobs?.length) {
        setUnreadTotal(0)
        return
      }

      const jobIds = jobs.map(j => j.id)

      let total = 0

      // Count unseen messages from admin for each job
      for (const jobId of jobIds) {
        const { count } = await supabase
          .from('admin_customer_messages')
          .select('*', { count: 'exact', head: true })
          .eq('job_request_id', jobId)
          .eq('is_seen', false)
          .neq('sender_id', user.id)

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
    fetchUnreadCount()

    // Real-time: new message → refresh count
    const channel = supabase
      .channel('customer_unread_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_customer_messages'
      }, async (payload) => {
        const newMsg = payload.new as any

        const { data: { user } } = await supabase.auth.getUser()
        if (newMsg.sender_id === user?.id) return

        fetchUnreadCount()

        toast('New message from admin', {
          icon: '💬',
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#0b0b5c',
            color: '#ffffff',
            border: '1px solid #f47b20',
          }
        })

        try {
          const audio = new Audio('/notification.mp3')
          audio.volume = 0.4
          audio.play().catch(() => {})
        } catch {}
      })
      .subscribe()

    window.addEventListener('focus', fetchUnreadCount)
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('focus', fetchUnreadCount)
      clearInterval(interval)
    }
  }, [])

  // When clicking on Messages in sidebar → we no longer clear everything here
  // The clearing now happens per job when user clicks on a specific chat
  const handleMessagesClick = () => {
    // Optional: You can keep a soft clear for instant feedback, but we rely on the page now
    // fetchUnreadCount() will be called when returning from chat
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-3 left-4 z-50 bg-white p-2 text-[var(--blue)] rounded-full shadow-lg border border-[var(--orange)]"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 top-0 left-0 h-screen bg-[var(--blue)] text-white flex flex-col z-40 transition-all duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="px-4 h-16 flex items-center gap-2 border-b border-[var(--orange)]">
          <div className="h-9 w-9 grid place-items-center rounded-full bg-white overflow-hidden">
            <Image src="/log.png" width={70} height={70} alt="Logo" priority />
          </div>
          <span className="text-lg font-semibold">Artismart</span>
        </div>

        <nav className="flex-1">
          <ul className="py-2">
            {nav.map(({ href, icon: Icon, label }) => {
              const isMessages = href === '/dashboard/customer/messages'

              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={isMessages ? handleMessagesClick : undefined}
                    className={`flex items-center gap-3 px-4 py-3 text-sm relative ${
                      isActive(href)
                        ? 'bg-[var(--orange)] text-white font-semibold'
                        : 'hover:bg-[var(--orange)]/90'
                    }`}
                  >
                    <Icon className="text-lg" />
                    <span>{label}</span>

                    {/* Badge - shows total unread across all jobs */}
                    {isMessages && unreadTotal > 0 && (
                      <span className="ml-auto bg-[var(--orange)] border border-white text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
                        {loadingUnread ? '...' : unreadTotal}
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
          className="flex items-center gap-3 px-4 py-3 hover:text-[var(--orange)] transition-colors"
        >
          <FaSignOutAlt className="text-lg" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}