// app/dashboard/artisan/chat/[jobId]/page.tsx
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
import Image from 'next/image'

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
  customer: {
    first_name: string | null
    last_name: string | null
  } | null
}

export default function ArtisanChatPage() {
  const { jobId } = useParams()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [otherIsTyping, setOtherIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const prevMessagesLengthRef = useRef(0)
  const isPageVisibleRef = useRef(true)

  useEffect(() => {
    if (!jobId || typeof jobId !== 'string') {
      toast.error('Missing or invalid job ID')
      router.replace('/dashboard/artisan/jobs')
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
          is_admin: newMsg.sender_id !== currentUserId
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

  // Mark messages as seen
  useEffect(() => {
    if (!jobId || loading || !currentUserId) return

    const markAsSeen = async () => {
      const unseenFromAdmin = messages.filter(
        m => !m.seen_at && m.sender_id !== currentUserId
      )

      if (unseenFromAdmin.length === 0) return

      const now = new Date().toISOString()

      await supabase
        .from('admin_artisan_messages')
        .update({ seen_at: now })
        .in('id', unseenFromAdmin.map(m => m.id))

      setMessages(prev =>
        prev.map(m => m.seen_at ? m : { ...m, seen_at: now })
      )
    }

    markAsSeen()
    window.addEventListener('focus', markAsSeen)

    return () => window.removeEventListener('focus', markAsSeen)
  }, [jobId, loading, messages, currentUserId])

  // Sound + Vibration + Toast on new admin message
  useEffect(() => {
    if (messages.length <= prevMessagesLengthRef.current) {
      prevMessagesLengthRef.current = messages.length
      return
    }

    const latestMsg = messages[messages.length - 1]
    if (!latestMsg.is_admin) {
      prevMessagesLengthRef.current = messages.length
      return
    }

    prevMessagesLengthRef.current = messages.length

    // Toast notification (always show when new admin message arrives)
    toast('New message from admin', {
      icon: '💬',
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fbbf24',
      }
    })

    // Vibration + sound only when tab is not visible/focused
    if (!isPageVisibleRef.current) {
      // Vibration (mobile only - safe to call on desktop, just ignored)
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]) // short pattern: vibrate 200ms → pause 100ms → vibrate 200ms
      }

      // Sound
      try {
        const audio = new Audio('/notification.mp3') // place file in /public/notification.mp3
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
          customer:customer_id (first_name, last_name)
        `)
        .eq('id', jobId)
        .eq('assigned_artisan_id', user.id)
        .single()

      if (jobError) throw jobError
      if (!rawJob) throw new Error('Job not found or not assigned to you')

      const customerData = Array.isArray(rawJob.customer) 
        ? rawJob.customer[0] 
        : rawJob.customer

      setJob({
        id: rawJob.id || '',
        title: rawJob.title || '',
        status: rawJob.status || 'unknown',
        customer: customerData ? {
          first_name: customerData.first_name ?? null,
          last_name: customerData.last_name ?? null,
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
          is_admin: msg.sender_id !== user.id
        }))
      )
    } catch (err: any) {
      console.error('Chat load error:', err)
      toast.error(err.message || 'Failed to load chat')
      router.replace('/dashboard/artisan/jobs')
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

      const { data: adminData } = await supabase
        .from('admin_profiles')
        .select('id')
        .limit(1)
        .single()

      if (!adminData?.id) throw new Error('Admin not found')

      await supabase
        .from('admin_artisan_messages')
        .insert({
          job_id: jobId,
          sender_id: user.id,
          receiver_id: adminData.id,
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
    if (msg.is_admin || !msg.seen_at) return false
    return !messages.slice(index + 1).some(m => !m.is_admin && m.seen_at)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
        <div className="relative flex items-center justify-center">
        {/* Outer spinning ring */}
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-md"></div>
          {/* Inner static logo with subtle pulse */}
            <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
              <div className="bg-[var(--white)] rounded-full p-2 shadow-sm">
                  <Image src="/log.png" width={48} height={48}  priority alt="Loading..." className="object-contain"  />  
                </div>
              </div>
            </div>
          </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="text-red-500 text-7xl mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-[var(--blue)] mb-4">
            Job not found
          </h2>
          <p className="text-[var(--blue)] mb-8">
            This job may not exist or is not assigned to you.
          </p>
          <Link
            href="/dashboard/artisan/assigned-jobs"
            className="inline-flex items-center px-8 py-4 bg-[var(--blue)] text-white rounded-xl hover:bg-[var(--blue)] transition shadow-md"
          >
            <FaArrowLeft className="mr-2" />
            Back to My Jobs
          </Link>
        </div>
      </div>
    )
  }

  const customer = Array.isArray(job.customer) ? job.customer[0] : job.customer

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--blue)] to-[var(--orange)] text-white px-6 py-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/artisan/assigned-jobs" className="hover:opacity-80 transition">
              <FaArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">
                Chat with Admin - {job.title}
              </h1>
              <p className="text-sm opacity-90 mt-1">
                Status: {job.status} • Customer: {customer?.first_name ?? ''} {customer?.last_name ?? ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-[var(--blue)]">
            <FaCommentDots className="text-6xl text-[var(--blue)] mb-4" />
            <p className="text-lg">No messages yet</p>
            <p className="text-sm mt-2">The admin will contact you here regarding this job</p>
          </div>
        ) : (
          <div className="space-y-4 pb-20">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.is_admin ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.is_admin
                      ? 'bg-gray-200 text-[var(--blue)] rounded-bl-none'
                      : 'bg-[var(--orange)] text-white rounded-br-none'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <div className="flex items-center justify-end gap-1 text-xs opacity-70 mt-1">
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!msg.is_admin && msg.seen_at && isLastSeen(msg, index) && (
                      <FaCheckDouble className="text-blue-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {otherIsTyping && (
              <div className="flex items-center text-[var(--orange)] text-sm italic pl-4">
                Admin is typing...
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
            placeholder="Type your message to the admin..."
            className="flex-1 px-4 py-3 border border-[var(--blue)] rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--orange)]"
            disabled={sending}
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            className="p-3 bg-[var(--blue)] text-white rounded-full hover:bg-[var(--orange)] transition disabled:opacity-50"
          >
            {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
          </button>
        </div>
      </div>
    </div>
  )
}