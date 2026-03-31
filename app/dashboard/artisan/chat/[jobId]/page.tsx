'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, 
  FaArrowLeft, 
  FaPaperPlane, 
  FaExclamationTriangle, 
  FaCheckDouble, 
  FaCommentDots,
  FaEdit,
  FaTrash,
  FaArrowDown
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
  is_edited?: boolean
  edited_at?: string | null
  deleted_at?: string | null
  is_admin: boolean
}

interface Job {
  id: string
  title: string
  status: string
  customer_id: string | null
  customer: {
    first_name: string | null
    last_name: string | null
  } | null
}

export default function ArtisanChatPage() {
  const { jobId } = useParams<{ jobId: string }>()
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

  // Editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  // Context menu state
  const [openMessageId, setOpenMessageId] = useState<string | null>(null)

  // Helper: last seen check
  const isLastSeen = (msg: Message, index: number): boolean => {
    if (msg.is_admin || !msg.seen_at || msg.deleted_at) return false
    return !messages.slice(index + 1).some(m => !m.is_admin && m.seen_at && !m.deleted_at)
  }

  useEffect(() => {
    if (!jobId || typeof jobId !== 'string') {
      toast.error('Missing or invalid job ID')
      router.replace('/dashboard/artisan/assigned-jobs')
      return
    }

    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null)
    })

    fetchJobAndMessages()

    const messageChannel = supabase
      .channel(`job_messages:${jobId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'admin_artisan_messages',
        filter: `job_id=eq.${jobId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new as Message
          setMessages(prev => [...prev, {
            ...newMsg,
            is_admin: newMsg.sender_id !== currentUserId
          }])
        } else if (payload.eventType === 'UPDATE') {
          const updatedMsg = payload.new as Message
          setMessages(prev =>
            prev.map(m =>
              m.id === updatedMsg.id
                ? { ...updatedMsg, is_admin: updatedMsg.sender_id !== currentUserId }
                : m
            )
          )
        }
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
        m => !m.seen_at && m.is_admin && !m.deleted_at
      )

      if (unseenFromAdmin.length === 0) return

      const now = new Date().toISOString()

      await supabase
        .from('admin_artisan_messages')
        .update({ seen_at: now })
        .in('id', unseenFromAdmin.map(m => m.id))

      setMessages(prev =>
        prev.map(m => (m.seen_at || !m.is_admin) ? m : { ...m, seen_at: now })
      )
    }

    markAsSeen()
    window.addEventListener('focus', markAsSeen)

    return () => window.removeEventListener('focus', markAsSeen)
  }, [jobId, loading, messages, currentUserId])

  // Notification for new admin message
  useEffect(() => {
    if (messages.length <= prevMessagesLengthRef.current) {
      prevMessagesLengthRef.current = messages.length
      return
    }

    const latestMsg = messages[messages.length - 1]
    if (!latestMsg.is_admin || latestMsg.deleted_at) {
      prevMessagesLengthRef.current = messages.length
      return
    }

    prevMessagesLengthRef.current = messages.length

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

    if (!isPageVisibleRef.current) {
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])

      try {
        const audio = new Audio('/notification.mp3')
        audio.volume = 0.5
        audio.play().catch(() => {
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
          customer_id,
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
        customer_id: rawJob.customer_id,
        customer: customerData ? {
          first_name: customerData.first_name ?? null,
          last_name: customerData.last_name ?? null,
        } : null
      })

      const { data: msgData, error: msgError } = await supabase
        .from('admin_artisan_messages')
        .select('*')
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
    if (!newMessage.trim() || sending || !jobId || !currentUserId || !job?.customer_id) return

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`

    const optimisticMessage: Message = {
      id: tempId,
      job_id: jobId as string,
      sender_id: currentUserId,
      receiver_id: job.customer_id,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      seen_at: null,
      is_edited: false,
      edited_at: null,
      deleted_at: null,
      is_admin: false
    }

    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage('')
    setSending(true)

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase
        .from('admin_artisan_messages')
        .insert({
          job_id: jobId,
          sender_id: currentUserId,
          receiver_id: job.customer_id,
          content: newMessage.trim(),
          seen_at: null,
        })

      if (insertError) throw insertError

    } catch (err: any) {
      console.error('Send failed:', err)
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const startEdit = (msg: Message) => {
    if (msg.sender_id !== currentUserId || msg.deleted_at) return
    setEditingMessageId(msg.id)
    setEditText(msg.content)
  }

  const cancelEdit = () => {
    setEditingMessageId(null)
    setEditText('')
  }

  const saveEdit = async () => {
    if (!editingMessageId || !editText.trim() || editText === messages.find(m => m.id === editingMessageId)?.content) {
      cancelEdit()
      return
    }

    const originalContent = messages.find(m => m.id === editingMessageId)?.content || ''

    setMessages(prev =>
      prev.map(m =>
        m.id === editingMessageId
          ? { ...m, content: editText.trim(), is_edited: true, edited_at: new Date().toISOString() }
          : m
      )
    )

    try {
      const { error } = await supabase
        .from('admin_artisan_messages')
        .update({
          content: editText.trim(),
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', editingMessageId)
        .eq('sender_id', currentUserId!)

      if (error) throw error

      toast.success('Message updated')
      cancelEdit()
    } catch (err: any) {
      console.error('Edit failed:', err)
      setMessages(prev =>
        prev.map(m =>
          m.id === editingMessageId ? { ...m, content: originalContent, is_edited: false, edited_at: null } : m
        )
      )
      toast.error('Could not update message')
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message? This cannot be undone.')) return

    setMessages(prev =>
      prev.map(m =>
        m.id === messageId ? { ...m, deleted_at: new Date().toISOString() } : m
      )
    )

    try {
      const { error } = await supabase
        .from('admin_artisan_messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('sender_id', currentUserId!)

      if (error) throw error

      toast.success('Message deleted')
    } catch (err: any) {
      console.error('Delete failed:', err)
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, deleted_at: null } : m
        )
      )
      toast.error('Could not delete message')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-md"></div>
          <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
            <div className="bg-[var(--white)] rounded-full p-2 shadow-sm">
              <Image 
                src="/log.png" 
                width={48} 
                height={48} 
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
            className="inline-flex items-center px-8 py-4 bg-[var(--blue)] text-white rounded-xl hover:bg-[var(--blue)]/90 transition shadow-md"
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
      {/* Fixed Header */}
      <header className="bg-gradient-to-r from-[var(--blue)] to-[var(--orange)]/50 text-white px-6 py-4 shadow-lg mt-15 fixed top-0 left-0 right-0 z-20">
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
      </header>

      {/* Messages – padded for fixed header & footer */}
      <div className="flex-1 overflow-y-auto pt-28 pb-24 px-4 md:px-6 max-w-5xl mx-auto w-full bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-[var(--blue)]">
            <FaCommentDots className="text-6xl text-[var(--blue)] mb-4" />
            <p className="text-lg">No messages yet</p>
            <p className="text-sm mt-2">The admin will contact you here regarding this job</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`group flex flex-col relative ${msg.is_admin ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.is_admin
                      ? 'bg-gray-200 text-[var(--blue)] rounded-bl-none'
                      : 'bg-[var(--orange)] text-white rounded-br-none'
                  } ${msg.deleted_at ? 'opacity-70' : ''}`}
                >
                  {editingMessageId === msg.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-[var(--blue)] focus:outline-none focus:ring-2 focus:ring-[var(--orange)]"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex gap-3 justify-end">
                        <button 
                          onClick={cancelEdit}
                          className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 rounded hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={saveEdit}
                          className="px-4 py-1.5 text-sm font-medium bg-[var(--orange)] text-white rounded hover:bg-orange-600 disabled:opacity-50"
                          disabled={!editText.trim()}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : msg.deleted_at ? (
                    <p className="text-sm italic text-gray-600">
                      This message was deleted
                    </p>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div className="flex items-center justify-end gap-2 text-xs opacity-70 mt-1">
                        {msg.is_edited && (
                          <span className="italic">
                            edited • {new Date(msg.edited_at || msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {!msg.is_admin && msg.seen_at && isLastSeen(msg, index) && !msg.deleted_at && (
                          <FaCheckDouble className="text-blue-600" />
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Context menu trigger – arrow down on hover */}
                {!msg.is_admin && !msg.deleted_at && editingMessageId !== msg.id && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenMessageId(openMessageId === msg.id ? null : msg.id)}
                      className="
                        absolute bottom-6 right-1 
                        opacity-0 group-hover:opacity-100 
                        transition-opacity 
                        p-1 rounded-full 
                         shadow-sm 
                        
                      "
                      title="More options"
                    >
                      <FaArrowDown className="w-4 h-4 text-[var(--white)]" />
                    </button>

                    {openMessageId === msg.id && (
                      <div
                        className="
                          absolute top-full right-0 mt-1 
                          bg-white rounded-lg 
                          shadow-xl border border-gray-200 
                          py-1 min-w-[140px] z-50
                        "
                      >
                        <button
                          onClick={() => {
                            startEdit(msg)
                            setOpenMessageId(null)
                          }}
                          className="
                            flex items-center gap-3 w-full 
                            px-4 py-2.5 text-left 
                            hover:bg-gray-50 text-[var(--blue)]
                          "
                        >
                          <FaEdit size={14} />
                          Edit
                        </button>

                        <button
                          onClick={() => {
                            handleDeleteMessage(msg.id)
                            setOpenMessageId(null)
                          }}
                          className="
                            flex items-center gap-3 w-full 
                            px-4 py-2.5 text-left 
                            hover:bg-gray-50 text-red-600
                          "
                        >
                          <FaTrash size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
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

      {/* Fixed Input Bar at Bottom */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg z-10">
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
            className="flex-1 px-5 py-3 border border-[var(--blue)] rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--orange)]"
            disabled={sending || !!editingMessageId}
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim() || !!editingMessageId}
            className="p-3.5 bg-[var(--blue)] text-white rounded-full hover:bg-[var(--orange)] transition disabled:opacity-50"
          >
            {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
          </button>
        </div>
      </footer>
    </div>
  )
}