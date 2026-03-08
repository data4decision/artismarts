// app/dashboard/admin/chat/[jobId]/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, 
  FaArrowLeft, 
  FaPaperPlane, 
  FaUserTie, 
  FaExclamationTriangle, 
  FaCheckDouble, 
  FaCommentDots
} from 'react-icons/fa'
import Link from 'next/link'

interface Message {
  id: string
  job_id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  seen_at: string | null
  is_admin: boolean
}

interface Job {
  id: string
  title: string
  status: string
  artisan: {
    first_name: string | null
    last_name: string | null
  } | null
}

export default function AdminChatPage() {
  const { jobId } = useParams()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)           // admin is typing
  const [otherIsTyping, setOtherIsTyping] = useState(false) // artisan is typing
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const prevMessagesLengthRef = useRef(0)
  const isPageVisibleRef = useRef(true)

  useEffect(() => {
    if (!jobId || typeof jobId !== 'string') {
      toast.error('Missing or invalid job ID')
      router.replace('/dashboard/admin/assigned-jobs')
      return
    }

    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null)
    })

    fetchJobAndMessages()

    const messageChannel = supabase
      .channel(`job_messages:${jobId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_artisan_messages',
        filter: `job_id=eq.${jobId}`
      }, (payload) => {
        const newMsg = payload.new as Message
        setMessages(prev => [...prev, {
          ...newMsg,
          is_admin: newMsg.sender_id === currentUserId
        }])
      })
      .subscribe()

    const typingChannel = supabase
      .channel(`typing:${jobId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { is_typing, user_id } = payload.payload
        if (user_id !== currentUserId) {
          setOtherIsTyping(is_typing)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
      supabase.removeChannel(typingChannel)
    }
  }, [jobId, router, currentUserId])

  // Mark messages as seen by admin (artisan's messages)
  useEffect(() => {
    if (!jobId || loading || !currentUserId) return

    const markAsSeen = async () => {
      const unseenFromArtisan = messages.filter(
        m => !m.seen_at && !m.is_admin
      )

      if (unseenFromArtisan.length === 0) return

      const now = new Date().toISOString()

      const { error } = await supabase
        .from('admin_artisan_messages')
        .update({ seen_at: now })
        .in('id', unseenFromArtisan.map(m => m.id))

      if (!error) {
        setMessages(prev =>
          prev.map(m => m.seen_at ? m : { ...m, seen_at: now })
        )
      }
    }

    markAsSeen()
    window.addEventListener('focus', markAsSeen)

    return () => window.removeEventListener('focus', markAsSeen)
  }, [jobId, loading, messages, currentUserId])

  // Sound + Vibration + Toast on new artisan message
  useEffect(() => {
    if (messages.length <= prevMessagesLengthRef.current) {
      prevMessagesLengthRef.current = messages.length
      return
    }

    const latestMsg = messages[messages.length - 1]
    if (latestMsg.is_admin) {
      prevMessagesLengthRef.current = messages.length
      return // ignore own messages
    }

    prevMessagesLengthRef.current = messages.length

    // Toast (always show)
    toast('New message from artisan', {
      icon: '💬',
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fbbf24',
      }
    })

    // Vibration + sound only when tab is not visible
    if (!isPageVisibleRef.current) {
      // Vibration (mobile only)
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]) // vibrate → pause → vibrate
      }

      // Sound
      try {
        const audio = new Audio('/notification.mp3') // place in /public/notification.mp3
        audio.volume = 0.5
        audio.play().catch(() => {
          // Fallback beep
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const osc = ctx.createOscillator()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(800, ctx.currentTime)
          osc.connect(ctx.destination)
          osc.start()
          osc.stop(ctx.currentTime + 0.15)
        })
      } catch (e) {
        console.warn('Notification failed:', e)
      }
    }
  }, [messages])

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = document.visibilityState === 'visible'
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handleTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    setIsTyping(true)

    supabase.channel(`typing:${jobId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { is_typing: true, user_id: currentUserId }
    })

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      supabase.channel(`typing:${jobId}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { is_typing: false, user_id: currentUserId }
      })
    }, 2000)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchJobAndMessages = async () => {
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: rawJob, error: jobError } = await supabase
        .from('job_requests')
        .select(`
          id,
          title,
          status,
          artisan:assigned_artisan_id (first_name, last_name)
        `)
        .eq('id', jobId)
        .single()

      if (jobError) throw jobError
      if (!rawJob) throw new Error('Job not found')

      const artisanData = Array.isArray(rawJob.artisan) 
        ? rawJob.artisan[0] 
        : rawJob.artisan

      setJob({
        id: rawJob.id || '',
        title: rawJob.title || '',
        status: rawJob.status || 'unknown',
        artisan: artisanData ? {
          first_name: artisanData.first_name ?? null,
          last_name: artisanData.last_name ?? null,
        } : null
      })

      const { data: msgData, error: msgError } = await supabase
        .from('admin_artisan_messages')
        .select('*, seen_at')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true })

      if (msgError) throw msgError

      setMessages(
        (msgData || []).map(msg => ({
          ...msg,
          is_admin: msg.sender_id === user.id
        }))
      )
    } catch (err: any) {
      console.error('Chat load error:', err)
      toast.error(err.message || 'Failed to load chat')
      router.replace('/dashboard/admin/assigned-jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !jobId) return

    setSending(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: jobData } = await supabase
        .from('job_requests')
        .select('assigned_artisan_id')
        .eq('id', jobId)
        .single()

      if (!jobData?.assigned_artisan_id) throw new Error('No artisan assigned')

      await supabase
        .from('admin_artisan_messages')
        .insert({
          job_id: jobId,
          sender_id: user.id,
          receiver_id: jobData.assigned_artisan_id,
          content: newMessage.trim(),
          seen_at: null
        })

      setNewMessage('')
    } catch (err: any) {
      toast.error('Failed to send message')
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const isLastSeen = (msg: Message, index: number) => {
    if (!msg.is_admin || !msg.seen_at) return false
    return !messages.slice(index + 1).some(m => m.is_admin && m.seen_at)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FaSpinner className="animate-spin text-[var(--orange)] text-6xl" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="text-red-500 text-7xl mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Job not found
          </h2>
          <p className="text-gray-600 mb-8">
            This job may not exist or has no assigned artisan.
          </p>
          <Link
            href="/dashboard/admin/assigned-jobs"
            className="inline-flex items-center px-8 py-4 bg-[var(--blue)] text-white rounded-xl hover:bg-blue-700 transition shadow-md"
          >
            <FaArrowLeft className="mr-2" />
            Back to Assigned Jobs
          </Link>
        </div>
      </div>
    )
  }

  const artisan = Array.isArray(job.artisan) ? job.artisan[0] : job.artisan

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--blue)] to-blue-900 text-white px-6 py-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/assigned-jobs" className="hover:opacity-80 transition">
              <FaArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">
                Chat with Artisan - {job.title}
              </h1>
              <p className="text-sm opacity-90 mt-1">
                Status: {job.status} • Artisan: {artisan?.first_name ?? ''} {artisan?.last_name ?? ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <FaCommentDots className="text-6xl text-gray-300 mb-4" />
            <p className="text-lg">No messages yet</p>
            <p className="text-sm mt-2">Start the conversation about this job</p>
          </div>
        ) : (
          <div className="space-y-4 pb-20">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.is_admin ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.is_admin
                      ? 'bg-[var(--orange)] text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <div className="flex items-center justify-end gap-1 text-xs opacity-70 mt-1">
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.is_admin && msg.seen_at && isLastSeen(msg, index) && (
                      <FaCheckDouble className="text-blue-400" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {otherIsTyping && (
              <div className="flex items-center text-gray-500 text-sm italic pl-4">
                Artisan is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t bg-white p-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={e => {
              setNewMessage(e.target.value)
              handleTyping()
            }}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
            placeholder="Type your message to the artisan..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--orange)]"
            disabled={sending}
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            className="p-3 bg-[var(--orange)] text-white rounded-full hover:bg-orange-600 transition disabled:opacity-50"
          >
            {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
          </button>
        </div>
      </div>
    </div>
  )
}