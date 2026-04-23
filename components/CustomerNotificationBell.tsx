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

// 'use client'

// import React, { useState, useEffect } from 'react'
// import { FaBell, FaCheck, FaCog, FaTimes } from 'react-icons/fa'
// import { useRouter } from 'next/navigation'
// import Link from 'next/link'
// import { supabase } from '@/lib/supabase'
// import { toast } from 'react-hot-toast'

// interface NotificationItem {
//   id: string
//   title: string
//   message: string
//   read: boolean
//   createdAt: string
//   type: string
//   jobRequestId?: string
// }

// const CustomerNotificationBell = () => {
//   const [isOpen, setIsOpen] = useState(false)
//   const [notifications, setNotifications] = useState<NotificationItem[]>([])
//   const [unreadCount, setUnreadCount] = useState(0)
//   const router = useRouter()

//   // Fetch notifications
//   const fetchNotifications = async () => {
//     try {
//       const { data: userData } = await supabase.auth.getUser()
//       if (!userData.user) return

//       const { data, error } = await supabase
//         .from('customer_notifications')
//         .select('*')
//         .eq('customer_id', userData.user.id)
//         .order('created_at', { ascending: false })
//         .limit(20)

//       if (error) throw error

//       const formatted = (data || []).map((n: any) => ({
//         id: n.id,
//         title: n.title,
//         message: n.message,
//         read: n.read,
//         createdAt: n.created_at,
//         type: n.type,
//         jobRequestId: n.job_request_id
//       }))

//       setNotifications(formatted)
//       setUnreadCount(formatted.filter(n => !n.read).length)
//     } catch (err) {
//       console.error('Failed to fetch notifications:', err)
//     }
//   }

//   // Initial load + Realtime
//   useEffect(() => {
//     fetchNotifications()

//     const channel = supabase
//       .channel('customer-notifications')
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'customer_notifications'
//         },
//         (payload) => {
//           const newNotif = payload.new as any
//           if (!newNotif) return

//           const formatted: NotificationItem = {
//             id: newNotif.id,
//             title: newNotif.title,
//             message: newNotif.message,
//             read: newNotif.read,
//             createdAt: newNotif.created_at,
//             type: newNotif.type,
//             jobRequestId: newNotif.job_request_id
//           }

//           setNotifications(prev => {
//             if (prev.some(n => n.id === newNotif.id)) return prev
//             return [formatted, ...prev]
//           })

//           if (!newNotif.read) {
//             setUnreadCount(prev => prev + 1)
//             toast('New notification!', { icon: '🔔' })
//           }
//         }
//       )
//       .subscribe()

//     return () => {
//       supabase.removeChannel(channel)
//     }
//   }, [])

//   // Mark all as read
//   const markAllAsRead = async () => {
//     try {
//       const { data: userData } = await supabase.auth.getUser()
//       if (!userData.user) return

//       await supabase
//         .from('customer_notifications')
//         .update({ read: true })
//         .eq('customer_id', userData.user.id)
//         .eq('read', false)

//       setNotifications(prev => prev.map(n => ({ ...n, read: true })))
//       setUnreadCount(0)
//       toast.success('All marked as read')
//     } catch (err) {
//       toast.error('Failed to mark as read')
//     }
//   }

//   const handleNotificationClick = async (notif: NotificationItem) => {
//     try {
//       if (!notif.read) {
//         await supabase
//           .from('customer_notifications')
//           .update({ read: true })
//           .eq('id', notif.id)
//       }

//       setNotifications(prev =>
//         prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
//       )
//       setUnreadCount(prev => Math.max(prev - 1, 0))
//       setIsOpen(false)

//       if (notif.jobRequestId) {
//         router.push(`/dashboard/customer/request/${notif.jobRequestId}`)
//       }
//     } catch (error) {
//       console.error(error)
//       toast.error('Something went wrong')
//     }
//   }

//   const goToSettings = () => {
//     setIsOpen(false)
//     router.push('/dashboard/customer/settings')
//   }

//   return (
//     <div className="relative">
//       {/* Bell Button */}
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="relative p-3 text-[var(--white)] hover:bg-[var(--orange)]/10 rounded-full transition-all duration-200"
//       >
//         {unreadCount > 0 && (
//           <span className="absolute -top-1 right-1 bg-[var(--orange)] text-white text-xs font-bold 
//             min-w-[20px] h-5 flex items-center justify-center rounded-full shadow border-2 border-[var(--blue)] animate-pulse">
//             {unreadCount > 99 ? '99+' : unreadCount}
//           </span>
//         )}
//         <FaBell size={24} />
//       </button>

//       {/* Dropdown */}
//       {isOpen && (
//         <div className="absolute bg-white right-0 mt-3 w-96 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">

//           {/* Header */}
//           <div className="flex items-center justify-between px-4 py-3 border-b bg-[var(--blue)] text-white rounded-t-2xl">
//             <h3 className="font-bold text-lg">Notifications</h3>
//             <div className="flex items-center gap-4">
//               <button onClick={markAllAsRead} title="Mark all as read">
//                 <FaCheck size={18} />
//               </button>
//               <button onClick={goToSettings} title="Settings">
//                 <FaCog size={18} />
//               </button>
//               <button onClick={() => setIsOpen(false)}>
//                 <FaTimes />
//               </button>
//             </div>
//           </div>

//           {/* Body */}
//           <div className="max-h-[480px] overflow-y-auto p-4">
//             {notifications.length === 0 ? (
//               <div className="text-center py-16 text-gray-500">
//                 <FaBell size={48} className="mx-auto mb-4 opacity-40" />
//                 <p>No notifications yet</p>
//               </div>
//             ) : (
//               notifications.map((notif) => (
//                 <div
//                   key={notif.id}
//                   onClick={() => handleNotificationClick(notif)}
//                   className={`p-4 mb-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-all ${
//                     !notif.read ? 'bg-orange-50 border-l-4 border-l-[var(--blue)]' : 'border border-gray-100'
//                   }`}
//                 >
//                   <p className="font-medium text-sm">{notif.title}</p>
//                   <p className="text-sm text-[var(--blue)] mt-1 line-clamp-2">{notif.message}</p>
//                   <p className="text-xs text-[var(--blue)] mt-2">
//                     {new Date(notif.createdAt).toLocaleDateString()}
//                   </p>
//                 </div>
//               ))
//             )}
//           </div>

//           {/* Footer */}
//           <div className="p-3 border-t text-center bg-gray-50">
//             <Link 
//               href="/dashboard/customer/notifications" 
//               className="text-sm text-blue-600 hover:underline"
//               onClick={() => setIsOpen(false)}
//             >
//               View all notifications →
//             </Link>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default CustomerNotificationBell
// 'use client'

// import React, { useState, useEffect, useRef } from 'react'
// import { FaBell, FaCheck, FaCog, FaTimes } from 'react-icons/fa'
// import { useRouter } from 'next/navigation'
// import Link from 'next/link'
// import { supabase } from '@/lib/supabase'
// import { toast } from 'react-hot-toast'
// import Image from 'next/image'

// interface NotificationItem {
//   id: string
//   title: string
//   message: string
//   createdAt: string
//   type: string
//   jobRequestId?: string
//   artisanName: string
//   artisanImage?: string
// }

// const CustomerNotificationBell = () => {
//   const [isOpen, setIsOpen] = useState(false)
//   const [notifications, setNotifications] = useState<NotificationItem[]>([])
//   const [loading, setLoading] = useState(true)

//   const router = useRouter()
//   const channelRef = useRef<any>(null)

//   // ================= FETCH UNREAD ONLY =================
//   const fetchNotifications = async () => {
//     try {
//       setLoading(true)

//       const { data: userData } = await supabase.auth.getUser()
//       if (!userData.user) return

//       const { data, error } = await supabase
//         .from('customer_notifications')
//         .select(`
//           id,
//           title,
//           message,
//           created_at,
//           type,
//           job_request_id,
//           job_requests!inner(assigned_artisan_id)
//         `)
//         .eq('customer_id', userData.user.id)
//         .eq('read', false) // ✅ ONLY UNREAD
//         .order('created_at', { ascending: false })
//         .limit(20)

//     // ================= 2. IN-PROGRESS JOBS =================
//     const { data: inProgressJobs } = await supabase
//       .from('job_requests')
//       .select(`
//         id,
//         title,
//         created_at,
//         assigned_artisan_id,
//         artisan:assigned_artisan_id(first_name, last_name, profile_image)
//       `)
//       .eq('customer_id', userData.user.id)
//       .eq('status', 'in_progress')
//       .order('created_at', { ascending: false })
//       .limit(10)

//       if (error) throw error

//       // ===== Fetch artisan profiles =====
//       const artisanIds = [...new Set(
//         (data || [])
//           .map((n: any) => n.job_requests?.assigned_artisan_id)
//           .filter(Boolean)
//       )]

//       let artisanProfiles: Record<string, { name: string; image?: string }> = {}

//       if (artisanIds.length > 0) {
//         const { data: profiles } = await supabase
//           .from('profiles')
//           .select('id, first_name, last_name, profile_image')
//           .in('id', artisanIds)

//         artisanProfiles = (profiles || []).reduce((acc: any, p: any) => {
//           const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Artisan'
//           acc[p.id] = { name: fullName, image: p.profile_image }
//           return acc
//         }, {})
//       }

//       // ===== Format =====
//       const formatted: NotificationItem[] = (data || []).map((n: any) => {
//         const artisanId = n.job_requests?.assigned_artisan_id
//         const artisan = artisanProfiles[artisanId] || { name: 'Artisan', image: undefined }

//         return {
//           id: n.id,
//           title: n.title,
//           message: n.message,
//           createdAt: n.created_at,
//           type: n.type,
//           jobRequestId: n.job_request_id,
//           artisanName: artisan.name,
//           artisanImage: artisan.image
//         }
//       })

//       // ================= FORMAT IN-PROGRESS =================
//     const inProgressFormatted = (inProgressJobs || []).map((job: any) => {
//       const artisan = job.artisan

//       return {
//         id: `inprogress-${job.id}`, // 🔑 IMPORTANT (unique id)
//         title: 'Job Accepted',
//         message: `${artisan?.first_name || 'An artisan'} accepted your job: ${job.title}`,
//         createdAt: job.created_at,
//         type: 'job_accepted',
//         jobRequestId: job.id,
//         artisanName: `${artisan?.first_name || ''} ${artisan?.last_name || ''}`.trim() || 'Artisan',
//         artisanImage: artisan?.profile_image
//       }
//     })

//        // ================= MERGE =================
//     const allNotifications = [
//       ...inProgressFormatted,
//       ...formatted
//     ].sort(
//       (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//     )
//     setNotifications(allNotifications)

//     } catch (err) {
//       console.error('Fetch error:', err)
//     } finally {
//       setLoading(false)
//     }
//   }

//   // ================= REALTIME =================
//   const setupRealtime = () => {
//     if (channelRef.current) {
//       supabase.removeChannel(channelRef.current)
//     }

//     const channel = supabase
//       .channel('customer_notifications_realtime')
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'customer_notifications'
//         },
        
//         () => fetchNotifications()
//       )
//       .subscribe()

//     channelRef.current = channel
//   }

//   useEffect(() => {
//     fetchNotifications()
//     setupRealtime()

//     return () => {
//       if (channelRef.current) {
//         supabase.removeChannel(channelRef.current)
//       }
//     }
//   }, [])

//   // ================= CLICK =================
//   const handleNotificationClick = async (notif: NotificationItem) => {
//     try {
//       // mark as read
//       await supabase
//         .from('customer_notifications')
//         .update({ read: true })
//         .eq('id', notif.id)

//       // remove from UI safely
//       setNotifications(prev => prev.filter(n => n.id !== notif.id))

//       setIsOpen(false)

//       // navigate
//       if (notif.jobRequestId) {
//         router.push('/dashboard/customer/requests')
//       }

//     } catch (error) {
//       console.error(error)
//       toast.error('Something went wrong')
//     }
//   }

//   // ================= MARK ALL =================
//   const markAllAsRead = async () => {
//     try {
//       const { data: userData } = await supabase.auth.getUser()
//       if (!userData.user) return

//       await supabase
//         .from('customer_notifications')
//         .update({ read: true })
//         .eq('customer_id', userData.user.id)
//         .eq('read', false)

//       setNotifications([]) // safe now
//       setIsOpen(false)

//       toast.success('All notifications marked as read')

//     } catch (err) {
//       toast.error('Failed to mark all')
//     }
//   }

//   const goToSettings = () => {
//     setIsOpen(false)
//     router.push('/dashboard/customer/settings')
//   }

//   // ================= UI =================
//   return (
//     <div className="relative">
//       {/* Bell */}
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="relative p-3 text-[var(--white)] hover:bg-[var(--orange)]/10 rounded-full"
//       >
//         {notifications.length > 0 && (
//           <span className="absolute -top-1 right-1 bg-[var(--orange)] text-white text-xs font-bold 
//             min-w-[20px] h-5 flex items-center justify-center rounded-full border-2 border-[var(--blue)] animate-pulse">
//             {notifications.length > 99 ? '99+' : notifications.length}
//           </span>
//         )}
//         <FaBell size={24} />
//       </button>

//       {/* Dropdown */}
//       {isOpen && (
//         <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border z-50">

//           {/* Header */}
//           <div className="flex justify-between px-4 py-3 bg-[var(--blue)] text-white">
//             <h3 className="font-bold">Notifications</h3>
//             <div className="flex gap-3">
//               <button onClick={markAllAsRead}><FaCheck /></button>
//               <button onClick={goToSettings}><FaCog /></button>
//               <button onClick={() => setIsOpen(false)}><FaTimes /></button>
//             </div>
//           </div>

//           {/* Body */}
//           <div className="max-h-[450px] overflow-y-auto p-4">
//             {loading ? (
//               <p className="text-center py-10">Loading...</p>
//             ) : notifications.length === 0 ? (
//               <p className="text-center py-10 text-gray-500">No new notifications</p>
//             ) : (
//               notifications.map(notif => (
//                 <div
//                   key={notif.id}
//                   onClick={() => handleNotificationClick(notif)}
//                   className="p-4 mb-3 bg-orange-50 border-l-4 border-[var(--blue)] rounded-xl cursor-pointer hover:bg-gray-50 flex gap-4"
//                 >
//                   {notif.artisanImage ? (
//                     <Image src={notif.artisanImage} alt="" width={40} height={40} className="rounded-full" />
//                   ) : (
//                     <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">👤</div>
//                   )}

//                   <div>
//                     <p className="font-medium">{notif.title}</p>
//                     <p className="text-sm text-gray-600">{notif.message}</p>
//                     <p className="text-xs text-gray-400 mt-1">
//                       {new Date(notif.createdAt).toLocaleDateString()}
//                     </p>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>

//           {/* Footer */}
//           <div className="p-3 border-t text-center bg-[var(--blue)] text-[var(--white)]">
//             <Link href="/dashboard/customer/notifications" onClick={() => setIsOpen(false)}>
//               View all →
//             </Link>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default CustomerNotificationBell


// 'use client'

// import React, { useState, useEffect, useRef } from 'react'
// import { FaBell, FaCheck, FaCog, FaTimes, FaUser } from 'react-icons/fa'
// import { useRouter } from 'next/navigation'
// import Link from 'next/link'
// import { supabase } from '@/lib/supabase'
// import { toast } from 'react-hot-toast'
// import Image from 'next/image'

// interface NotificationItem {
//   id: string
//   title: string
//   message: string
//   read: boolean
//   createdAt: string
//   type: string
//   jobRequestId?: string

//   artisanName?: string
//   artisanImage?: string | null
//   adminName?: string
//   adminImage?: string | null

//   data?: any
// }

// const CustomerNotificationBell = () => {
//   const [isOpen, setIsOpen] = useState(false)
//   const [notifications, setNotifications] = useState<NotificationItem[]>([])
//   const [loading, setLoading] = useState(true)

//   const router = useRouter()
//   const channelRef = useRef<any>(null)

//   // ================= FETCH NOTIFICATIONS =================
//   const fetchNotifications = async () => {
//   try {
//     setLoading(true)

//     const { data: userData } = await supabase.auth.getUser()
//     if (!userData.user) return

//     const { data, error } = await supabase
//       .from('customer_notifications')
//       .select(`
//         id,
//         title,
//         message,
//         read,
//         created_at,
//         type,
//         job_request_id,
//         data
//       `)
//       .eq('customer_id', userData.user.id)
//       .eq('read', false)
//       .order('created_at', { ascending: false })
//       .limit(20)

//     if (error) throw error

//     // ================= GET ARTISAN IDS =================
//     const artisanIds = [...new Set(
//       (data || [])
//         .map((n: any) => n.data?.assigned_artisan_id)
//         .filter(Boolean)
//     )]

//     let artisanMap: Record<string, { name: string; image?: string }> = {}

//     if (artisanIds.length > 0) {
//       const { data: profiles } = await supabase
//         .from('profiles')
//         .select('id, first_name, last_name, profile_image')
//         .in('id', artisanIds)

//       artisanMap = (profiles || []).reduce((acc: any, p: any) => {
//         acc[p.id] = {
//           name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
//           image: p.profile_image
//         }
//         return acc
//       }, {})
//     }

//     let adminMap: Record<string, {name: string; image?: string}> = {}

//     if (adminIds.length > 0) {
//       const {data: adminProfiles} = await supabase
//       .from('admin_profiles')
//       .select('id, first_name, last_name, profile_image')

//       adminMap = (adminProfiles || []).reduce((acc: any, p: any) => {
//         acc[p.id] = {
//           name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
//           image: p.profile_image
//         }
//         return acc
//       }
//     }

//     // ================= FORMAT NOTIFICATIONS =================
//     const formatted: NotificationItem[] = (data || []).map((n: any): NotificationItem => {
//       const artisanId = n.data?.assigned_artisan_id
//       const artisan = artisanMap[artisanId]

//       return {
//         id: n.id,
//         title: n.title,
//         message: n.message,
//         read: n.read,
//         createdAt: n.created_at,
//         type: n.type,
//         jobRequestId: n.job_request_id,

        
//         artisanName: artisan?.name || 'Artisan',
//         artisanImage: artisan?.image || null,

//         data: n.data
//       }
//     })


//       setNotifications(formatted)

//     } catch (err) {
//       console.error('Fetch error:', err)
//     } finally {
//       setLoading(false)
//     }
//   }

//   // ================= REALTIME =================
//   const setupRealtime = () => {
//     if (channelRef.current) {
//       supabase.removeChannel(channelRef.current)
//     }

//     const channel = supabase
//       .channel('customer_notifications_realtime')
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'customer_notifications'
//         },
//         () => fetchNotifications()
//       )
//       .subscribe()

//     channelRef.current = channel
//   }

//   useEffect(() => {
//     fetchNotifications()
//     setupRealtime()

//     return () => {
//       if (channelRef.current) {
//         supabase.removeChannel(channelRef.current)
//       }
//     }
//   }, [])

//   // ================= CLICK NOTIFICATION =================
//   const handleNotificationClick = async (notif: NotificationItem) => {
//     try {
//       await supabase
//         .from('customer_notifications')
//         .update({ read: true })
//         .eq('id', notif.id)

//       setNotifications(prev => prev.filter(n => n.id !== notif.id))
//       setIsOpen(false)

//       // ================= ROUTING BASED ON TYPE =================
//       switch (notif.type) {
//         case 'assigned':
//         case 'in_progress':
//         // case 'completed_pending_review':
//         case 'completed':
//         case 'cancelled':
//           if (notif.jobRequestId) {
//             router.push('/dashboard/customer/requests')
//           }
//           break

//         default:
//           router.push('/dashboard/customer/notifications')
//        case 'admin_message':
//         if (notif.jobRequestId) {
//          router.push(`/dashboard/customer/messages?job=${notif.jobRequestId}`)
//   }
//   break
//       }
      

//     } catch (error) {
//       console.error(error)
//       toast.error('Something went wrong')
//     }
//   }

//   // ================= MARK ALL AS READ =================
//   const markAllAsRead = async () => {
//     try {
//       const { data: userData } = await supabase.auth.getUser()
//       if (!userData.user) return

//       await supabase
//         .from('customer_notifications')
//         .update({ read: true })
//         .eq('customer_id', userData.user.id)
//         .eq('read', false)

//       setNotifications([])
//       setIsOpen(false)

//       toast.success('All notifications marked as read')

//     } catch (err) {
//       toast.error('Failed to mark all as read')
//     }
//   }

//   const goToSettings = () => {
//     setIsOpen(false)
//     router.push('/dashboard/customer/settings')
//   }

//   // ================= UI LABEL HELPER =================
//   const getNotificationLabel = (type: string) => {
//     switch (type) {
//       case 'assigned':
//         return '🧑‍🔧 Job Assigned'

//       case 'in_progress':
//         return '🔨 In Progress'

//       // case 'completed_pending_review':
//       //   return '📝 Awaiting Review'

//       case 'completed':
//         return '🎉 Completed'

//       case 'cancelled':
//         return '❌ Cancelled'
//       case 'admin_message':
//         return '💬 Admin Message'

//       default:
//         return '🔔 Notification'
//     }
//   }

//   // ================= UI =================
//   return (
//     <div className="relative">

//       {/* Bell */}
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="relative p-3 text-[var(--white)] hover:bg-[var(--orange)]/5 rounded-full"
//       >
//         {notifications.length > 0 && (
//           <span className="absolute -top-1 right-1 bg-[var(--orange)] text-[var(--white)] text-xs font-bold 
//             min-w-[20px] h-5 flex items-center justify-center rounded-full animate-pulse">
//             {notifications.length > 99 ? '99+' : notifications.length}
//           </span>
//         )}
//         <FaBell size={24} />
//       </button>

//       {/* Dropdown */}
//       {isOpen && (
//         <div className="absolute right-0 mt-3 w-66 sm:w-96 bg-[var(--white)] rounded-2xl shadow-2xl border border-[var(--white)] overflow-hidden z-50">

//           {/* Header */}
//           <div className="flex items-center justify-between px-6 py-4 border-b bg-[var(--blue)] text-[var(--white)] rounded-t-2xl">
//             <h3 className="font-semibold text-lg">Notifications</h3>
//             <div className="flex items-center gap-4">
//               <button 
//                 onClick={goToSettings}
//                 className="text-[var(--white)] hover:text-[var(--orange)] transition-colors"
//                 title="Notification Settings"
//               >
//                 <FaCog size={18} />
//               </button>
              
//                 <button onClick={markAllAsRead} className="text-sm flex items-center gap-1 hover:underline">
//                   <FaCheck size={14} /> Mark all
//                 </button>
             
//               <button onClick={() => setIsOpen(false)}>
//                 <FaTimes size={18} />
//               </button>
//             </div>
//           </div>

//           {/* Body */}
//           <div className="max-h-[420px] overflow-y-auto p-4">

//             {loading ? (
//               <p className="text-center py-10">Loading...</p>
//             ) : notifications.length === 0 ? (
//               <p className="text-center py-10 text-[var(--blue)]">No notifications</p>
//             ) : (
//               notifications.map((notif) => (
//                 <div
//                   key={notif.id}
//                   onClick={() => handleNotificationClick(notif)}
//                   className={`group px-6 py-5 border-b hover:bg-[var(--blue)]/5 cursor-pointer transition-all
//                     ${!notif.read ? 'bg-[var(--orange)]/5 border-l-4 border-l-[var(--blue)]' : ''}`}
//                 >

//                  <div className="flex gap-4">
//                    {/* Avatar */}
//                  <div className="flex-shrink-0">
//                    {notif.artisanImage ? (
//                     <Image
//                       src={notif.artisanImage}
//                       alt="artisan"
//                       width={48}
//                       height={48}
//                       className="rounded-full object-cover border border-[var(--orange)]"
//                     />
//                   ) : (
//                     <div className="w-12 h-12 bg-[var(--orange)]/10 rounded-full flex items-center justify-center text-2xl">
//                       <FaUser size={20} className="text-[var(--blue)]" />
//                     </div>
//                   )}
//                  </div>

//                   {/* Content */}
//                   <div className="flex-1">
//                      <p className="text-xl text-[var(--blue)]">
//                       {notif.artisanName}
//                     </p>
//                     <p className="font-semibold text-sm text-[var(--blue)]">
//                       {getNotificationLabel(notif.type)}
//                     </p>

//                     <p className="text-sm text-[var(--blue)]">
//                       {notif.message}
//                     </p>

//                     <p className="text-xs text-[var(--blue)] mt-1">
//                       {new Date(notif.createdAt).toLocaleString()}
//                     </p>
//                   </div>
//                  </div>

//                 </div>
//               ))
//             )}
//           </div>

//           {/* Footer */}
//           <div className="p-3 border-t text-center bg-[var(--blue)]">
//             <Link
//               href="/dashboard/customer/notifications"
//               onClick={() => setIsOpen(false)}
//               className="text-[var(--white)] text-sm font-medium"
//             >
//               View all →
//             </Link>
//           </div>

//         </div>
//       )}
//     </div>
//   )
// }

// export default CustomerNotificationBell

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { FaBell, FaCheck, FaCog, FaTimes, FaUser } from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

interface NotificationItem {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
  type: string
  jobRequestId?: string

  artisanName?: string
  artisanImage?: string | null
  adminName?: string
  adminImage?: string | null

  data?: any
}

const CustomerNotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSound, setSelectedSound] = useState('/sounds/dragon-festive-chime.mp3')
  const [isMuted, setIsMuted] = useState(false)

  const router = useRouter()
  const channelRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

   //Load sound & mute settings
  useEffect (() => {
  const savedSound = localStorage.getItem('notificationSound') || '/sound/dragon-festive-chime.mp3'
  const savedMute = localStorage.getItem('notificationMuted') === 'true'

  setSelectedSound(savedSound)
  setIsMuted(savedMute)

  audioRef.current = new Audio(savedSound)
  audioRef.current.volume = 0.65
  }, [])

  const playNotificationSound = () => {
    if (isMuted || !audioRef.current) return
    try {
      audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
    }catch (err) {
    console.error('Notification sound playback failed:', err)
  } 
  
  }

  // ================= FETCH NOTIFICATIONS =================
  const fetchNotifications = async () => {
    try {
      setLoading(true)

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data, error } = await supabase
        .from('customer_notifications')
        .select(`
          id,
          title,
          message,
          read,
          created_at,
          type,
          job_request_id,
          data
        `)
        .eq('customer_id', userData.user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      // ================= GET ARTISAN IDS =================
      const artisanIds = [...new Set(
        (data || [])
          .map((n: any) => n.data?.assigned_artisan_id)
          .filter(Boolean)
      )]

      let artisanMap: Record<string, { name: string; image?: string }> = {}

      if (artisanIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, profile_image')
          .in('id', artisanIds)

        artisanMap = (profiles || []).reduce((acc: any, p: any) => {
          acc[p.id] = {
            name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
            image: p.profile_image
          }
          return acc
        }, {})
      }

      // ================= GET ADMIN IDS (for admin_message) =================
      const adminIds = [...new Set(
        (data || [])
          .filter((n: any) => n.type === 'admin_message')
          .map((n: any) => n.data?.sender_id)
          .filter(Boolean)
      )]

      let adminMap: Record<string, { name: string; image?: string }> = {}

      if (adminIds.length > 0) {
        const { data: adminProfiles } = await supabase
          .from('admin_profiles')
          .select('id, first_name, last_name, profile_image')
          .in('id', adminIds)

        adminMap = (adminProfiles || []).reduce((acc: any, p: any) => {
          acc[p.id] = {
            name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Admin',
            image: p.profile_image
          }
          return acc
        }, {})
      }

      // ================= FORMAT NOTIFICATIONS =================
      const formatted: NotificationItem[] = (data || []).map((n: any): NotificationItem => {
        if (n.type === 'admin_message') {
          const adminId = n.data?.sender_id
          const admin = adminMap[adminId] || { name: 'Admin', image: null }

          return {
            id: n.id,
            title: n.title,
            message: n.message,
            read: n.read,
            createdAt: n.created_at,
            type: n.type,
            jobRequestId: n.job_request_id,
            adminName: admin.name,
            adminImage: admin.image,
            data: n.data
          }
        } else {
          // For job-related notifications (assigned, completed, etc.)
          const artisanId = n.data?.assigned_artisan_id
          const artisan = artisanMap[artisanId] || { name: 'Artisan', image: null }

          return {
            id: n.id,
            title: n.title,
            message: n.message,
            read: n.read,
            createdAt: n.created_at,
            type: n.type,
            jobRequestId: n.job_request_id,
            artisanName: artisan.name,
            artisanImage: artisan.image,
            data: n.data
          }
        }
      })

      setNotifications(formatted)

    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ================= REALTIME =================
  const setupRealtime = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel('customer_notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_notifications'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            playNotificationSound()
          }
          fetchNotifications()
        }
      )
      .subscribe()

    channelRef.current = channel
  }

  useEffect(() => {
    fetchNotifications()
    setupRealtime()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  // ================= CLICK NOTIFICATION =================
  const handleNotificationClick = async (notif: NotificationItem) => {
    try {
      await supabase
        .from('customer_notifications')
        .update({ read: true })
        .eq('id', notif.id)

      setNotifications(prev => prev.filter(n => n.id !== notif.id))
      setIsOpen(false)

      switch (notif.type) {
        case 'assigned':
        case 'in_progress':
        case 'completed':
        case 'cancelled':
          if (notif.jobRequestId) {
            router.push('/dashboard/customer/requests')
          }
          break

        case 'admin_message':
          if (notif.jobRequestId) {
            router.push(`/dashboard/customer/messages?job=${notif.jobRequestId}`)
          }
          break

        default:
          router.push('/dashboard/customer/notifications')
      }
    } catch (error) {
      console.error(error)
      toast.error('Something went wrong')
    }
  }

  // ================= MARK ALL AS READ =================
  const markAllAsRead = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      await supabase
        .from('customer_notifications')
        .update({ read: true })
        .eq('customer_id', userData.user.id)
        .eq('read', false)

      setNotifications([])
      setIsOpen(false)

      toast.success('All notifications marked as read')

    } catch (err) {
      toast.error('Failed to mark all as read')
    }
  }

  const goToSettings = () => {
    setIsOpen(false)
    router.push('/dashboard/customer/settings')
  }

  // ================= UI LABEL HELPER =================
  const getNotificationLabel = (type: string) => {
    switch (type) {
      case 'assigned':
        return '🧑‍🔧 Job Assigned'
      case 'in_progress':
        return '🔨 In Progress'
      case 'completed':
        return '🎉 Completed'
      case 'cancelled':
        return '❌ Cancelled'
      case 'admin_message':
        return '💬 Admin Message'
      default:
        return '🔔 Notification'
    }
  }

  // ================= UI =================
  return (
    <div className="relative">

      {/* Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 text-[var(--white)] hover:bg-[var(--orange)]/5 rounded-full"
      >
        {notifications.length > 0 && (
          <span className="absolute -top-1 right-1 bg-[var(--orange)] text-[var(--white)] text-xs font-bold 
            min-w-[20px] h-5 flex items-center justify-center rounded-full animate-pulse">
            {notifications.length > 99 ? '99+' : notifications.length}
          </span>
        )}
        <FaBell size={24} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute -right-10 sm:right-0 mt-3 w-76 sm:w-96 bg-[var(--white)] rounded-2xl shadow-2xl border border-[var(--white)] overflow-hidden z-50">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-[var(--blue)] text-[var(--white)] rounded-t-2xl">
            <h3 className="font-semibold text-lg">Notifications</h3>
            <div className="flex items-center gap-4">
              <button 
                onClick={goToSettings}
                className="text-[var(--white)] hover:text-[var(--orange)] transition-colors"
                title="Notification Settings"
              >
                <FaCog size={18} />
              </button>
              
              <button onClick={markAllAsRead} className="text-sm flex items-center gap-1 hover:underline">
                <FaCheck size={14} /> Mark all
              </button>
             
              <button onClick={() => setIsOpen(false)}>
                <FaTimes size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[420px] overflow-y-auto p-4">

            {loading ? (
              <p className="text-center py-10">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="text-center py-10 text-[var(--blue)]">No notifications</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group px-6 py-5 border-b hover:bg-[var(--blue)]/5 cursor-pointer transition-all
                    ${!notif.read ? ' border-l-4 border-l-[var(--blue)]' : ''}`}
                >

                  <div className="flex gap-4">
                    {/* Avatar - Show Admin or Artisan */}
                    <div className="flex-shrink-0">
                      {notif.type === 'admin_message' && notif.adminImage ? (
                        <Image
                          src={notif.adminImage || '/log.png'}
                          alt="admin"
                          width={48}
                          height={48}
                          className="rounded-full object-cover border border-[var(--orange)]"
                        />
                      ) : notif.artisanImage ? (
                        <Image
                          src={notif.artisanImage}
                          alt="artisan"
                          width={48}
                          height={48}
                          className="rounded-full object-cover border border-[var(--orange)]"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-[var(--orange)]/10 rounded-full flex items-center justify-center text-2xl">
                          <FaUser size={20} className="text-[var(--blue)]" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <p className="text-xl text-[var(--blue)]">
                        {notif.type === 'admin_message' 
                          ? notif.adminName || 'Admin' 
                          : notif.artisanName || 'Artisan'}
                      </p>
                      <p className="font-semibold text-sm text-[var(--blue)]">
                        {getNotificationLabel(notif.type)}
                      </p>

                      <p className="text-sm text-[var(--blue)]">
                        {notif.message}
                      </p>

                      <p className="text-xs text-[var(--blue)] mt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t text-center bg-[var(--blue)]">
            <Link
              href="/dashboard/customer/notifications"
              onClick={() => setIsOpen(false)}
              className="text-[var(--white)] text-sm font-medium"
            >
              View all →
            </Link>
          </div>

        </div>
      )}
    </div>
  )
}

export default CustomerNotificationBell