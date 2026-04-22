// import React, {useState} from 'react'
// import { FaBell, FaCheck, FaCog, FaTimes } from 'react-icons/fa'
// import { useRouter } from 'next/navigation'
// import Link from 'next/link'
// import { supabase } from '@/lib/supabase'

// interface notificationItems {
// id: string,
// artisanId: string,
// artisanName: string,
// message: string,
// createdAt: string,
// jobTitle: string,
// type: 'assignedjob' | 'in_progress' | 'completed_job' | 'payment_received' | 'adminMessage'
// }

// const CustomerNotificationBell = () => {
//     const [isOpen, setIsOpen] = useState(false)
//     const [notificationItems, setNotificationItems] = useState<notificationItems[]>([])
//     const [unreadCount, setUnreadCount] = useState (1)
//     const router = useRouter()



//     const fetchNotifications = async () => {
//   try {
//     const { data: assignedJobs, error } = await supabase
//       .from('job_requests')
//       .select(`
//         id,
//         title,
//         created_at,
//         artisan_id
//       `)
//       .eq('status', 'assigned')
//       .order('created_at', { ascending: false })
//       .limit(8)

//     if (error) throw error

//     const formattedNotifications = (assignedJobs || []).map((job: any) => ({
//       id: job.id,
//       artisanId: job.artisan_id,
//       artisanName: 'Artisan',
//       message: `You have a new job request for ${job.title}`,
//       createdAt: job.created_at,
//       jobTitle: job.title,
//       type: 'assigned_job'
//     }))

//     setNotificationItems(formattedNotifications)
//     setUnreadCount(formattedNotifications.length)

//   } catch (error) {
//     console.error('Fetch notifications error:', error)
//   }
// }


//     const markAsRead = () => {
//         setUnreadCount (0)
//     }

//     const goToSettings = () => {
//         setIsOpen(false)
//             router.push('/dashboard/customer/settings')
//         }
    
//   return (
//     <div className='relative'>
//         <button onClick={()=> setIsOpen(!isOpen)}
//             className="relative p-3 text-[var(--white)] hover:bg-[var(--orange)]/10 rounded-full transition-all duration-200"
//             >
//                 {unreadCount > 0 && (
//                     <span className='absolute -top-1 right-1 bg-[var(--orange)] text-white text-xs font-bold 
//                            min-w-[20px] h-5 flex items-center justify-center rounded-full shadow border-2 border-[var(--blue)] animate-pulse'>
//                         {unreadCount > 99 ? '99+' : unreadCount}
//                     </span>
//                 )}
//             <FaBell size={24}/>
//         </button>

//         {isOpen && (
//             <div className="absolute bg-[var(--white)] right-0 mt-3 w-96 rounded-2xl shadow-2xl border-l-2 border-[var(--orange)] overflow-hidden z-50">
//                 <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[var(--orange)] bg-[var(--blue)] text-[var(--white)] rounded-t-2xl">
//                     <h3 className="font-bold text-lg">Notifications</h3>
//                     <div className="flex items-center gap-4">
//                         <button onClick={goToSettings}
//                             className="text-white hover:text-gray-200 transition-colors cursor-pointer"
//                              title="Notification Settings">
//                             <FaCog size={18}/>
//                         </button>
//                         {unreadCount > 0 && (
//                             <button onClick={markAsRead}
//                                 className="text-sm flex items-center gap-1 hover:underline cursor-pointer"
//                                 title="Mark as Read">
//                                 <FaCheck size={18}/> Mark All
//                             </button>
//                         )}
//                         <button onClick={() => setIsOpen(false)}>
//                             <FaTimes />
//                         </button>
//                     </div>
//                 </div>
//                 <section>
//                     <div className="min-h-[420px] overflow-y-auto p-4">
//                         {Notification.length === 0 ? (
//                             <div className="p-16 text-center text-[var(--blue)]">
//                                 <FaBell size={56} className="mx-auto mb-4 opacity-40" />
//                                 <p>No new activity</p>
//                             </div>
//                         ) : (
//                             notificationItems.map((notification) => (
//                                 <div key={notification.id} className="border-b border-[var(--gray)] py-3">
//                                     <p className="text-sm">{notification.message}</p>
//                                 </div>
//                             ))
//                         )}
//                     </div>
//                 </section>
//                 <div className="bg-[var(--blue)] p-3 border-t-2 border-[var(--orange)] text-center">
//                     <Link href="/dashboard/customer/notifications" 
//                     className="text-sm text-white hover:underline"
//                     onClick={()=> setIsOpen(false)}>
//                         View All Notifications →
//                     </Link>
//                 </div>
//             </div>
//         )}
//     </div>
//   )
// }

// export default CustomerNotificationBell

'use client'

import React, { useState, useEffect } from 'react'
import { FaBell, FaCheck, FaCog, FaTimes } from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface NotificationItem {
  id: string
  artisanId: string | null
  artisanName: string
  message: string
  createdAt: string
  jobTitle: string
  type: 'assigned_job' | 'in_progress' | 'completed_job' | 'payment_received' | 'adminMessage'
}

const CustomerNotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  // ================= FETCH NOTIFICATIONS =================
  const fetchNotifications = async () => {
    try {
      const { data: assignedJobs, error } = await supabase
        .from('job_requests')
        .select(`
          id,
          title,
          created_at,
          artisan_id
        `)
        .eq('status', 'assigned')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      const formattedNotifications: NotificationItem[] = (assignedJobs || []).map((job: any) => ({
        id: job.id,
        artisanId: job.artisan_id,
        artisanName: 'Artisan',
        message: `Your job has been assigned to an artisan: ${job.title}`,
        createdAt: job.created_at,
        jobTitle: job.title,
        type: 'assigned_job'
      }))

      setNotificationItems(formattedNotifications)
      setUnreadCount(formattedNotifications.length)

    } catch (error) {
      console.error('Fetch notifications error:', error)
    }
  }

  // ================= INITIAL LOAD =================
  useEffect(() => {
    fetchNotifications()
  }, [])

  // ================= MARK AS READ =================
  const markAsRead = () => {
    setUnreadCount(0)
  }

  // ================= SETTINGS =================
  const goToSettings = () => {
    setIsOpen(false)
    router.push('/dashboard/customer/settings')
  }

  return (
    <div className='relative'>
      {/* ================= BELL BUTTON ================= */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 text-[var(--white)] hover:bg-[var(--orange)]/10 rounded-full transition-all duration-200"
      >
        {unreadCount > 0 && (
          <span className='absolute -top-1 right-1 bg-[var(--orange)] text-white text-xs font-bold 
            min-w-[20px] h-5 flex items-center justify-center rounded-full shadow border-2 border-[var(--blue)] animate-pulse'>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        <FaBell size={24} />
      </button>

      {/* ================= DROPDOWN ================= */}
      {isOpen && (
        <div className="absolute bg-[var(--white)] right-0 mt-3 w-96 rounded-2xl shadow-2xl border-l-2 border-[var(--orange)] overflow-hidden z-50">

          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[var(--orange)] bg-[var(--blue)] text-[var(--white)] rounded-t-2xl">
            <h3 className="font-bold text-lg">Notifications</h3>

            <div className="flex items-center gap-4">
              <button
                onClick={goToSettings}
                className="text-white hover:text-gray-200 transition-colors"
                title="Notification Settings"
              >
                <FaCog size={18} />
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={markAsRead}
                  className="text-sm flex items-center gap-1 hover:underline"
                  title="Mark as Read"
                >
                  <FaCheck size={18} /> Mark All
                </button>
              )}

              <button onClick={() => setIsOpen(false)}>
                <FaTimes />
              </button>
            </div>
          </div>

          {/* BODY */}
          <section>
            <div className="min-h-[420px] overflow-y-auto p-4">

              {/* EMPTY STATE FIXED */}
              {notificationItems.length === 0 ? (
                <div className="p-16 text-center text-[var(--blue)]">
                  <FaBell size={56} className="mx-auto mb-4 opacity-40" />
                  <p>No new activity</p>
                </div>
              ) : (
                notificationItems.map((notification) => (
                  <div
                    key={notification.id}
                    className="border-b border-[var(--gray)] py-3 hover:bg-gray-50 px-2 rounded-md"
                  >
                    <p className="text-sm font-medium text-[var(--blue)]">
                      {notification.jobTitle}
                    </p>
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-[var(--blue)] mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}

            </div>
          </section>

          {/* FOOTER */}
          <div className="bg-[var(--blue)] p-3 border-t-2 border-[var(--orange)] text-center">
            <Link
              href="/dashboard/customer/notifications"
              className="text-sm text-white hover:underline"
              onClick={() => setIsOpen(false)}
            >
              View All Notifications →
            </Link>
          </div>

        </div>
      )}
    </div>
  )
}

export default CustomerNotificationBell