// app/dashboard/admin/messages/page.tsx
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
  FaClock 
} from 'react-icons/fa'
import Image from 'next/image'

interface ChatPreview {
  job_id: string
  job_title: string
  artisan_first_name: string | null
  artisan_last_name: string | null
  last_message: string | null
  last_message_sender: 'admin' | 'artisan' | null
  last_message_time: string | null
  unread_count: number
  status: string
}

export default function AdminMessagesOverview() {
  const [chats, setChats] = useState<ChatPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchChatPreviews()

    // Real-time subscription
    const channel = supabase
      .channel('admin_messages_overview')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_artisan_messages'
      }, async (payload) => {
        const newMsg = payload.new as any

        // Ignore admin's own messages
        const { data: { user } } = await supabase.auth.getUser()
        if (newMsg.sender_id === user?.id) return

        // Update the matching chat (or refresh if new)
        setChats(prev => {
          const index = prev.findIndex(c => c.job_id === newMsg.job_id)

          if (index === -1) {
            // New job chat → refresh full list
            fetchChatPreviews()
            return prev
          }

          const updated = { ...prev[index] }
          updated.last_message = newMsg.content
          updated.last_message_sender = 'artisan'
          updated.last_message_time = newMsg.created_at
          updated.unread_count = (updated.unread_count || 0) + 1

          // Move to top
          const newList = [...prev]
          const [moved] = newList.splice(index, 1)
          newList.unshift(updated)

          return newList
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchChatPreviews = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in')
        return
      }

      const { data: jobs, error: jobsError } = await supabase
        .from('job_requests')
        .select(`
          id,
          title,
          status,
          artisan:assigned_artisan_id (first_name, last_name)
        `)
        .not('assigned_artisan_id', 'is', null)
        .order('updated_at', { ascending: false })

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
          const artisan = Array.isArray(job.artisan) ? job.artisan[0] : job.artisan

          const { data: lastMsg } = await supabase
            .from('admin_artisan_messages')
            .select('content, created_at, sender_id')
            .eq('job_id', job.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          let unreadQuery = supabase
            .from('admin_artisan_messages')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id)
            .neq('sender_id', user.id)

          const lastRead = readMap.get(job.id)
          if (lastRead) {
            unreadQuery = unreadQuery.gt('created_at', lastRead)
          }

          const { count: unreadCount } = await unreadQuery

          return {
            job_id: job.id,
            job_title: job.title || 'Untitled Job',
            artisan_first_name: artisan?.first_name ?? null,
            artisan_last_name: artisan?.last_name ?? null,
            last_message: lastMsg?.content ?? null,
            last_message_sender: lastMsg
              ? (lastMsg.sender_id === user.id ? 'admin' : 'artisan')
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
    const prefix = chat.last_message_sender === 'admin' ? 'You: ' : 'Artisan: '
    return prefix + chat.last_message
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/70 flex items-center justify-center ">
                <div className="relative flex items-center justify-center">
                  {/* Outer spinning ring */}
                  <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-orange-500 border-opacity-70 shadow-lg"></div>
        
                  {/* Inner logo with pulse */}
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
        <header>
          <h1 className="text-3xl font-bold text-[var(--blue)]">
            Messages
          </h1>
          <p className="mt-2 text-[var(--blue)]">
            Conversations with artisans about assigned jobs
          </p>
        </header>

        {chats.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
            <FaCommentDots className="text-[var(--orange)] text-8xl mx-auto mb-8 opacity-70" />
            <h3 className="text-3xl font-bold text-[var(--blue)] mb-4">
              No messages yet
            </h3>
            <p className="text-[var(--blue)] text-xl max-w-2xl mx-auto">
              When you or an artisan starts a conversation on an assigned job, it will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 divide-y divide-gray-100">
            {chats.map(chat => (
              <Link
                key={chat.job_id}
                href={`/admin-dashboard/chat/${chat.job_id}`}
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
                      {chat.artisan_first_name || chat.artisan_last_name
                        ? `${chat.artisan_first_name ?? ''} ${chat.artisan_last_name ?? ''}`
                        : 'Artisan'}
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}