'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, 
  FaExclamationTriangle, 
  FaCommentDots 
} from 'react-icons/fa'
import Image from 'next/image'

interface ChatPreview {
  job_id: string
  job_title: string
  artisan_first_name: string | null
  artisan_last_name: string | null
  last_message: string | null
  last_message_sender: 'admin' | 'customer' | null
  last_message_time: string | null
  unread_count: number
  status: string
}

export default function CustomerMessagesOverview() {
  const [chats, setChats] = useState<ChatPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mark ONLY messages for a specific job as seen
  const markJobAsSeen = async (jobId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      await supabase
        .from('admin_customer_messages')
        .update({ is_seen: true })
        .eq('job_request_id', jobId)
        .eq('is_seen', false)
        .neq('sender_id', user.id)
        .is('deleted_at', null)
    } catch (err) {
      console.error('Failed to mark job as seen:', err)
    }
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

      const { data: jobs } = await supabase
        .from('job_requests')
        .select(`
          id,
          title,
          status,
          assigned_artisan_id,
          artisan:assigned_artisan_id (first_name, last_name)
        `)
        .eq('customer_id', user.id)
        .order('updated_at', { ascending: false })

      if (!jobs || jobs.length === 0) {
        setChats([])
        return
      }

      const chatPreviews = await Promise.all(
        jobs.map(async (job) => {
          const artisanData = Array.isArray(job.artisan) ? job.artisan[0] : job.artisan

          const { data: lastMsg } = await supabase
            .from('admin_customer_messages')
            .select('content, created_at, sender_id')
            .eq('job_request_id', job.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          // Count unseen messages from admin only
          const { count: unread } = await supabase
            .from('admin_customer_messages')
            .select('*', { count: 'exact', head: true })
            .eq('job_request_id', job.id)
            .eq('is_seen', false)
            .neq('sender_id', user.id)

          return {
            job_id: job.id,
            job_title: job.title || 'Untitled Request',
            artisan_first_name: artisanData?.first_name ?? null,
            artisan_last_name: artisanData?.last_name ?? null,
            last_message: lastMsg?.content ?? 'No messages yet',
            last_message_sender: lastMsg 
              ? (lastMsg.sender_id === user.id ? 'customer' : 'admin') 
              : null,
            last_message_time: lastMsg?.created_at ?? null,
            unread_count: unread || 0,
            status: job.status
          } satisfies ChatPreview
        })
      )

      setChats(chatPreviews)
    } catch (err: any) {
      console.error('Error loading messages:', err)
      setError(err.message || 'Failed to load messages')
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChatPreviews()

    const channel = supabase
      .channel('customer_messages_overview')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_customer_messages'
        },
        async (payload) => {
          const newMsg = payload.new as any

          const { data: { user } } = await supabase.auth.getUser()
          if (newMsg.sender_id === user?.id) return

          setChats((prev) => {
            const index = prev.findIndex((c) => c.job_id === newMsg.job_request_id)

            if (index === -1) {
              fetchChatPreviews()
              return prev
            }

            const updated = { ...prev[index] }
            updated.last_message = newMsg.content
            updated.last_message_sender = 'admin'
            updated.last_message_time = newMsg.created_at
            updated.unread_count = (updated.unread_count || 0) + 1

            const newList = [...prev]
            const [moved] = newList.splice(index, 1)
            newList.unshift(updated)

            return newList
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const diffMs = Date.now() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  const getMessagePreview = (chat: ChatPreview) => {
    if (!chat.last_message) return 'No messages yet'
    const prefix = chat.last_message_sender === 'admin' ? 'Admin: ' : 'You: '
    return prefix + chat.last_message
  }

  const handleChatClick = async (jobId: string) => {
    await markJobAsSeen(jobId)
    fetchChatPreviews() // refresh counts
  }

  if (loading) {
    return (
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
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="text-red-500 text-7xl mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-[var(--blue)] mb-4">Failed to load messages</h2>
          <p className="text-[var(--blue)]/60 mb-8">{error}</p>
          <button
            onClick={fetchChatPreviews}
            className="px-8 py-4 bg-[var(--blue)] text-white rounded-xl hover:bg-[var(--blue)]/70 transition shadow-md"
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
        <div>
          <h1 className="text-3xl font-bold text-[var(--blue)]">Messages</h1>
          <p className="mt-2 text-[var(--blue)]">Conversations with admin about your requests</p>
        </div>

        {chats.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg border border-[var(--blue)]/70 p-16 text-center">
            <FaCommentDots className="text-[var(--orange)] text-8xl mx-auto mb-8 opacity-70" />
            <h3 className="text-3xl font-bold text-[var(--blue)] mb-4">No messages yet</h3>
            <p className="text-[var(--blue)] text-xl mb-10 max-w-2xl mx-auto">
              When you have active requests, chats with admin will appear here.
            </p>
            <Link
              href="/dashboard/customer/artisans"
              className="inline-flex items-center gap-3 px-10 py-5 bg-[var(--orange)] hover:bg-orange-600 text-white font-bold text-lg rounded-2xl transition shadow-xl hover:shadow-2xl"
            >
              Find an Artisan Now →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md border border-[var(--blue)]/50 divide-y divide-[var(--blue)]/10">
            {chats.map((chat) => (
              <Link
                key={chat.job_id}
                href={`/dashboard/customer/chat/${chat.job_id}`}
                onClick={() => handleChatClick(chat.job_id)}
                className="block p-6 hover:bg-[var(--blue)]/20 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-[var(--blue)] truncate group-hover:text-[var(--orange)] transition-colors">
                        {chat.job_title}
                      </h3>
                      {chat.unread_count > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--orange)] text-white">
                          {chat.unread_count} new
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-[var(--blue)] mb-1 truncate">
                      {chat.artisan_first_name || chat.artisan_last_name
                        ? `${chat.artisan_first_name ?? ''} ${chat.artisan_last_name ?? ''}`
                        : 'Artisan'}
                    </p>

                    <p className={`text-sm line-clamp-1 ${
                      chat.unread_count > 0 ? 'font-medium text-[var(--blue)]' : 'text-[var(--blue)]/80'
                    }`}>
                      {getMessagePreview(chat)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end text-right text-xs text-gray-500">
                    {chat.last_message_time && (
                      <span>{formatTime(chat.last_message_time)}</span>
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