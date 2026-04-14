
// 'use client'

// import { useState, useEffect } from 'react'
// import Link from 'next/link'
// import { supabase } from '@/lib/supabase'
// import toast from 'react-hot-toast'
// import { 
//   FaSpinner, 
//   FaExclamationTriangle, 
//   FaCommentDots, 
//   FaUserTie, 
//   FaClock,
//   FaUsers,
//   FaHardHat
// } from 'react-icons/fa'
// import Image from 'next/image'

// interface ChatPreview {
//   job_id: string
//   job_title: string
//   other_party_first_name: string | null
//   other_party_last_name: string | null
//   last_message: string | null
//   last_message_sender: 'admin' | 'other' | null
//   last_message_time: string | null
//   unread_count: number
//   status: string
// }

// type Tab = 'artisans' | 'customers'

// export default function AdminMessagesOverview() {
//   const [activeTab, setActiveTab] = useState<Tab>('artisans')
//   const [chats, setChats] = useState<ChatPreview[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   useEffect(() => {
//     fetchChatPreviews()

//     // Real-time for artisans
//     const artisanChannel = supabase
//       .channel('admin_artisan_messages_overview')
//       .on('postgres_changes', {
//         event: 'INSERT',
//         schema: 'public',
//         table: 'admin_artisan_messages'
//       }, (payload) => {
//         if (activeTab !== 'artisans') return
//         handleNewMessage(payload.new, 'admin_artisan_messages')
//       })
//       .subscribe()

//     // Real-time for customers
//     const customerChannel = supabase
//       .channel('admin_customer_messages_overview')
//       .on('postgres_changes', {
//         event: 'INSERT',
//         schema: 'public',
//         table: 'admin_customer_messages'
//       }, (payload) => {
//         if (activeTab !== 'customers') return
//         handleNewMessage(payload.new, 'admin_customer_messages')
//       })
//       .subscribe()

//     return () => {
//       supabase.removeChannel(artisanChannel)
//       supabase.removeChannel(customerChannel)
//     }
//   }, [activeTab])

//   const handleNewMessage = async (newMsg: any, table: string) => {
//     const { data: { user } } = await supabase.auth.getUser()
//     if (newMsg.sender_id === user?.id) return

//     setChats(prev => {
//       const jobIdKey = table === 'admin_artisan_messages' ? 'job_id' : 'job_request_id'
//       const jobId = newMsg[jobIdKey]

//       const index = prev.findIndex(c => c.job_id === jobId)

//       if (index === -1) {
//         fetchChatPreviews()  // new conversation → refresh
//         return prev
//       }

//       const updated = { ...prev[index] }
//       updated.last_message = newMsg.content
//       updated.last_message_sender = 'other'
//       updated.last_message_time = newMsg.created_at
//       updated.unread_count = (updated.unread_count || 0) + 1

//       const newList = [...prev]
//       const [moved] = newList.splice(index, 1)
//       newList.unshift(updated)

//       return newList
//     })
//   }

//   const fetchChatPreviews = async () => {
//     setLoading(true)
//     setError(null)

//     try {
//       const { data: { user } } = await supabase.auth.getUser()
//       if (!user) {
//         toast.error('Please sign in')
//         return
//       }

//       const isArtisanTab = activeTab === 'artisans'
//       const table = isArtisanTab ? 'admin_artisan_messages' : 'admin_customer_messages'
//       const relationField = isArtisanTab ? 'assigned_artisan_id' : 'customer_id'
//       const relationAlias = isArtisanTab ? 'artisan' : 'customer'
//       const jobIdColumn = isArtisanTab ? 'job_id' : 'job_request_id'

//       let query = supabase
//         .from('job_requests')
//         .select(`
//           id,
//           title,
//           status,
//           ${relationField},
//           ${relationAlias}:${relationField} (first_name, last_name)
//         `)
//         .order('updated_at', { ascending: false })

//       query = query.not(relationField, 'is', null)

//       const { data: jobs, error: jobsError } = await query

//       if (jobsError) throw jobsError
//       if (!jobs?.length) {
//         setChats([])
//         return
//       }

//       const jobIds = jobs.map(j => j.id)

//       const { data: readData } = await supabase
//         .from('user_job_read_status')
//         .select('job_id, last_read_at')
//         .eq('user_id', user.id)
//         .in('job_id', jobIds)

//       const readMap = new Map(readData?.map(r => [r.job_id, r.last_read_at]) || [])

//       const previews = await Promise.all(
//         jobs.map(async (job) => {
//           const otherParty = (job as Record<string, any>)[relationAlias]
//           const otherPartyObj = Array.isArray(otherParty) ? otherParty[0] : otherParty

//           const { data: lastMsg } = await supabase
//             .from(table)
//             .select('content, created_at, sender_id')
//             .eq(jobIdColumn, job.id)
//             .order('created_at', { ascending: false })
//             .limit(1)
//             .maybeSingle()

//           let unreadQuery = supabase
//             .from(table)
//             .select('*', { count: 'exact', head: true })
//             .eq(jobIdColumn, job.id)
//             .neq('sender_id', user.id)

//           const lastRead = readMap.get(job.id)
//           if (lastRead) {
//             unreadQuery = unreadQuery.gt('created_at', lastRead)
//           }

//           const { count: unreadCount } = await unreadQuery

//           return {
//             job_id: job.id,
//             job_title: job.title || 'Untitled Job',
//             other_party_first_name: otherPartyObj?.first_name ?? null,
//             other_party_last_name: otherPartyObj?.last_name ?? null,
//             last_message: lastMsg?.content ?? null,
//             last_message_sender: lastMsg
//               ? (lastMsg.sender_id === user.id ? 'admin' : 'other')
//               : null,
//             last_message_time: lastMsg?.created_at ?? null,
//             unread_count: unreadCount ?? 0,
//             status: job.status
//           } satisfies ChatPreview
//         })
//       )

//       setChats(previews)
//     } catch (err: any) {
//       console.error('Error loading messages overview:', err)
//       setError(err.message || 'Failed to load messages')
//       toast.error('Failed to load messages')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const formatTime = (ts: string | null) => {
//     if (!ts) return ''
//     const date = new Date(ts)
//     const now = new Date()
//     const diffMs = now.getTime() - date.getTime()
//     const diffMins = Math.floor(diffMs / 60000)

//     if (diffMins < 1) return 'Just now'
//     if (diffMins < 60) return `${diffMins}m ago`
//     if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
//     return date.toLocaleDateString()
//   }

//   const getMessagePreview = (chat: ChatPreview) => {
//     if (!chat.last_message) return 'No messages yet'
//     const prefix = chat.last_message_sender === 'admin' ? 'You: ' : 'Other: '
//     return prefix + chat.last_message
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50/70 flex items-center justify-center">
//         <div className="relative flex items-center justify-center">
//           <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-orange-500 border-opacity-70 shadow-lg"></div>
//           <div className="absolute inset-0 flex items-center justify-center animate-pulse">
//             <div className="bg-white rounded-full p-3 shadow-md">
//               <Image
//                 src="/log.png"
//                 width={56}
//                 height={56}
//                 priority
//                 alt="Loading..."
//                 className="object-contain"
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
//         <div className="text-center max-w-md">
//           <FaExclamationTriangle className="text-red-500 text-7xl mx-auto mb-6" />
//           <h2 className="text-2xl font-bold text-[var(--blue)] mb-4">
//             Failed to load messages
//           </h2>
//           <p className="text-[var(--blue)] mb-8">{error}</p>
//           <button
//             onClick={fetchChatPreviews}
//             className="px-8 py-4 bg-[var(--blue)] text-white rounded-xl hover:bg-[var(--blue)] transition shadow-md"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-5xl mx-auto space-y-8">
//         {/* Header + Tabs */}
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//           <div>
//             <h1 className="text-3xl font-bold text-[var(--blue)]">
//               Messages
//             </h1>
//             <p className="mt-2 text-[var(--blue)]">
//               Conversations with {activeTab === 'artisans' ? 'artisans' : 'customers'}
//             </p>
//           </div>

//           <div className="flex gap-3">
//             <button
//               onClick={() => setActiveTab('artisans')}
//               className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all shadow-sm ${
//                 activeTab === 'artisans'
//                   ? 'bg-[var(--orange)] text-white'
//                   : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
//               }`}
//             >
//               <FaHardHat />
//               Artisans
//             </button>

//             <button
//               onClick={() => setActiveTab('customers')}
//               className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all shadow-sm ${
//                 activeTab === 'customers'
//                   ? 'bg-[var(--orange)] text-white'
//                   : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
//               }`}
//             >
//               <FaUsers />
//               Customers
//             </button>
//           </div>
//         </div>

//         {chats.length === 0 ? (
//           <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
//             <FaCommentDots className="text-[var(--orange)] text-8xl mx-auto mb-8 opacity-70" />
//             <h3 className="text-3xl font-bold text-[var(--blue)] mb-4">
//               No messages yet
//             </h3>
//             <p className="text-[var(--blue)] text-xl max-w-2xl mx-auto">
//               {activeTab === 'artisans'
//                 ? 'When you or an artisan starts a conversation on an assigned job, it will appear here.'
//                 : 'When you or a customer starts a conversation on a request, it will appear here.'}
//             </p>
//           </div>
//         ) : (
//           <div className="bg-white rounded-2xl shadow-md border border-gray-200 divide-y divide-gray-100">
//             {chats.map(chat => {
//               const isArtisanTab = activeTab === 'artisans'
//               const chatPath = isArtisanTab 
//                 ? `/admin-dashboard/chat/${chat.job_id}`
//                 : `/admin-dashboard/chat/customer/${chat.job_id}`

//               return (
//                 <Link
//                   key={chat.job_id}
//                   href={chatPath}
//                   className="block p-6 hover:bg-gray-50 transition-colors group"
//                 >
//                   <div className="flex items-start justify-between gap-4">
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center gap-3 mb-1">
//                         <h3 className="text-lg font-semibold text-[var(--blue)] truncate group-hover:text-[var(--orange)] transition-colors">
//                           {chat.job_title}
//                         </h3>
//                         {chat.unread_count > 0 && (
//                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--orange)] text-white">
//                             {chat.unread_count}
//                           </span>
//                         )}
//                       </div>

//                       <p className="text-sm text-gray-600 mb-1 truncate">
//                         {chat.other_party_first_name || chat.other_party_last_name
//                           ? `${chat.other_party_first_name ?? ''} ${chat.other_party_last_name ?? ''}`
//                           : activeTab === 'artisans' ? 'Artisan' : 'Customer'}
//                       </p>

//                       <p className={`text-sm line-clamp-1 ${
//                         chat.unread_count > 0 ? 'font-medium text-gray-900' : 'text-gray-500'
//                       }`}>
//                         {getMessagePreview(chat)}
//                       </p>
//                     </div>

//                     <div className="flex flex-col items-end text-right text-xs text-gray-500 shrink-0">
//                       {chat.last_message_time && (
//                         <time dateTime={chat.last_message_time}>
//                           {formatTime(chat.last_message_time)}
//                         </time>
//                       )}
//                       {chat.status === 'in_progress' && (
//                         <span className="mt-1 px-2 py-0.5 bg-blue-100 text-[var(--blue)] rounded-full text-[10px]">
//                           Active
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </Link>
//               )
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, 
  FaExclamationTriangle, 
  FaCommentDots, 
  FaUserTie, 
  FaClock,
  FaUsers,
  FaHardHat
} from 'react-icons/fa'
import Image from 'next/image'

interface ChatPreview {
  job_id: string
  job_title: string
  other_party_first_name: string | null
  other_party_last_name: string | null
  last_message: string | null
  last_message_sender: 'admin' | 'other' | null
  last_message_time: string | null
  unread_count: number
  status: string
}

type Tab = 'artisans' | 'customers'

export default function AdminMessagesOverview() {
  const [activeTab, setActiveTab] = useState<Tab>('artisans')
  const [chats, setChats] = useState<ChatPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ====================== FIXED: markJobAsSeen (now takes only jobId) ======================
  const markJobAsSeen = async (jobId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const isArtisanTab = activeTab === 'artisans'
    const table = isArtisanTab ? 'admin_artisan_messages' : 'admin_customer_messages'
    const jobIdColumn = isArtisanTab ? 'job_id' : 'job_request_id'

    try {
      await supabase
        .from(table)
        .update({ is_seen: true })
        .eq(jobIdColumn, jobId)
        .eq('is_seen', false)
        .neq('sender_id', user.id)
        .is('deleted_at', null)
    } catch (err) {
      console.error('Failed to mark job as seen:', err)
    }
  }

  useEffect(() => {
    fetchChatPreviews()

    // Real-time for artisans
    const artisanChannel = supabase
      .channel('admin_artisan_messages_overview')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_artisan_messages'
      }, (payload) => {
        if (activeTab !== 'artisans') return
        handleNewMessage(payload.new, 'admin_artisan_messages')
      })
      .subscribe()

    // Real-time for customers
    const customerChannel = supabase
      .channel('admin_customer_messages_overview')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_customer_messages'
      }, (payload) => {
        if (activeTab !== 'customers') return
        handleNewMessage(payload.new, 'admin_customer_messages')
      })
      .subscribe()

    return () => {
      supabase.removeChannel(artisanChannel)
      supabase.removeChannel(customerChannel)
    }
  }, [activeTab])

  const handleNewMessage = async (newMsg: any, table: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (newMsg.sender_id === user?.id) return

    setChats(prev => {
      const jobIdKey = table === 'admin_artisan_messages' ? 'job_id' : 'job_request_id'
      const jobId = newMsg[jobIdKey]

      const index = prev.findIndex(c => c.job_id === jobId)

      if (index === -1) {
        fetchChatPreviews()
        return prev
      }

      const updated = { ...prev[index] }
      updated.last_message = newMsg.content
      updated.last_message_sender = 'other'
      updated.last_message_time = newMsg.created_at
      updated.unread_count = (updated.unread_count || 0) + 1

      const newList = [...prev]
      const [moved] = newList.splice(index, 1)
      newList.unshift(updated)

      return newList
    })
  }

  const fetchChatPreviews = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in')
        return
      }

      const isArtisanTab = activeTab === 'artisans'
      const table = isArtisanTab ? 'admin_artisan_messages' : 'admin_customer_messages'
      const relationField = isArtisanTab ? 'assigned_artisan_id' : 'customer_id'
      const relationAlias = isArtisanTab ? 'artisan' : 'customer'
      const jobIdColumn = isArtisanTab ? 'job_id' : 'job_request_id'

      let query = supabase
        .from('job_requests')
        .select(`
          id,
          title,
          status,
          ${relationField},
          ${relationAlias}:${relationField} (first_name, last_name)
        `)
        .order('updated_at', { ascending: false })

      query = query.not(relationField, 'is', null)

      const { data: jobs, error: jobsError } = await query

      if (jobsError) throw jobsError
      if (!jobs?.length) {
        setChats([])
        return
      }

      const jobIds = jobs.map(j => j.id)

      const { data: readData } = await supabase
        .from('user_job_read_status')
        .select('job_id, last_read_at')
        .eq('user_id', user.id)
        .in('job_id', jobIds)

      const readMap = new Map(readData?.map(r => [r.job_id, r.last_read_at]) || [])

      const previews = await Promise.all(
        jobs.map(async (job) => {
          const otherParty = (job as Record<string, any>)[relationAlias]
          const otherPartyObj = Array.isArray(otherParty) ? otherParty[0] : otherParty

          const { data: lastMsg } = await supabase
            .from(table)
            .select('content, created_at, sender_id')
            .eq(jobIdColumn, job.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          // UPDATED: Use is_seen for unread count (instead of last_read_at)
          const { count: unreadCount } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq(jobIdColumn, job.id)
            .eq('is_seen', false)                    // ← is_seen logic added
            .neq('sender_id', user.id)

          return {
            job_id: job.id,
            job_title: job.title || 'Untitled Job',
            other_party_first_name: otherPartyObj?.first_name ?? null,
            other_party_last_name: otherPartyObj?.last_name ?? null,
            last_message: lastMsg?.content ?? null,
            last_message_sender: lastMsg
              ? (lastMsg.sender_id === user.id ? 'admin' : 'other')
              : null,
            last_message_time: lastMsg?.created_at ?? null,
            unread_count: unreadCount ?? 0,
            status: job.status
          } satisfies ChatPreview
        })
      )

      setChats(previews)
    } catch (err: any) {
      console.error('Error loading messages overview:', err)
      setError(err.message || 'Failed to load messages')
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (ts: string | null) => {
    if (!ts) return ''
    const date = new Date(ts)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  const getMessagePreview = (chat: ChatPreview) => {
    if (!chat.last_message) return 'No messages yet'
    const prefix = chat.last_message_sender === 'admin' ? 'You: ' : 'Other: '
    return prefix + chat.last_message
  }

  // ====================== FIXED: handleChatClick (now calls markJobAsSeen with 1 argument) ======================
  const handleChatClick = async (chat: ChatPreview) => {
    await markJobAsSeen(chat.job_id)   // Only pass jobId
    fetchChatPreviews() // refresh unread counts
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/70 flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-orange-500 border-opacity-70 shadow-lg"></div>
          <div className="absolute inset-0 flex items-center justify-center animate-pulse">
            <div className="bg-white rounded-full p-3 shadow-md">
              <Image
                src="/log.png"
                width={56}
                height={56}
                priority
                alt="Loading..."
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="text-red-500 text-7xl mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-[var(--blue)] mb-4">
            Failed to load messages
          </h2>
          <p className="text-[var(--blue)] mb-8">{error}</p>
          <button
            onClick={fetchChatPreviews}
            className="px-8 py-4 bg-[var(--blue)] text-white rounded-xl hover:bg-[var(--blue)] transition shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header + Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--blue)]">
              Messages
            </h1>
            <p className="mt-2 text-[var(--blue)]">
              Conversations with {activeTab === 'artisans' ? 'artisans' : 'customers'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('artisans')}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all shadow-sm ${
                activeTab === 'artisans'
                  ? 'bg-[var(--orange)] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              <FaHardHat />
              Artisans
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all shadow-sm ${
                activeTab === 'customers'
                  ? 'bg-[var(--orange)] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              <FaUsers />
              Customers
            </button>
          </div>
        </div>

        {chats.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
            <FaCommentDots className="text-[var(--orange)] text-8xl mx-auto mb-8 opacity-70" />
            <h3 className="text-3xl font-bold text-[var(--blue)] mb-4">
              No messages yet
            </h3>
            <p className="text-[var(--blue)] text-xl max-w-2xl mx-auto">
              {activeTab === 'artisans'
                ? 'When you or an artisan starts a conversation on an assigned job, it will appear here.'
                : 'When you or a customer starts a conversation on a request, it will appear here.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 divide-y divide-gray-100">
            {chats.map(chat => {
              const isArtisanTab = activeTab === 'artisans'
              const chatPath = isArtisanTab 
                ? `/admin-dashboard/chat/${chat.job_id}`
                : `/admin-dashboard/chat/customer/${chat.job_id}`

              return (
                <Link
                  key={chat.job_id}
                  href={chatPath}
                  onClick={() => handleChatClick(chat)}   // Fixed: now passes chat object
                  className="block p-6 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-[var(--blue)] truncate group-hover:text-[var(--orange)] transition-colors">
                          {chat.job_title}
                        </h3>
                        {chat.unread_count > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--orange)] text-white">
                            {chat.unread_count}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-1 truncate">
                        {chat.other_party_first_name || chat.other_party_last_name
                          ? `${chat.other_party_first_name ?? ''} ${chat.other_party_last_name ?? ''}`
                          : activeTab === 'artisans' ? 'Artisan' : 'Customer'}
                      </p>

                      <p className={`text-sm line-clamp-1 ${
                        chat.unread_count > 0 ? 'font-medium text-gray-900' : 'text-gray-500'
                      }`}>
                        {getMessagePreview(chat)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end text-right text-xs text-gray-500 shrink-0">
                      {chat.last_message_time && (
                        <time dateTime={chat.last_message_time}>
                          {formatTime(chat.last_message_time)}
                        </time>
                      )}
                      {chat.status === 'in_progress' && (
                        <span className="mt-1 px-2 py-0.5 bg-blue-100 text-[var(--blue)] rounded-full text-[10px]">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}