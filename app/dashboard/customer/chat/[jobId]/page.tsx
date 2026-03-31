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
  FaArrowDown,
  FaReply,
  FaCopy,
  FaTimes,
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
  const [otherIsTyping, setOtherIsTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const prevMessagesLengthRef = useRef(0)
  const isPageVisibleRef = useRef(true)

  // Editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  // Context menu
  const [openMessageId, setOpenMessageId] = useState<string | null>(null)

  // Helper: Check if this is the last seen message from the other side
  const isLastSeen = (msg: Message, index: number): boolean => {
    if (msg.deleted_at || !msg.seen_at) return false
    return !messages.slice(index + 1).some(m => !m.deleted_at && m.seen_at)
  }

  // Fetch initial data + setup realtime
  useEffect(() => {
    if (!jobId || typeof jobId !== 'string') {
      toast.error('Missing or invalid job ID')
      router.replace('/dashboard/artisan/assigned-jobs')
      return
    }

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      setCurrentUserId(user.id)
      await fetchJobAndMessages(user.id)
    }

    init()

    // Realtime messages
    const messageChannel = supabase
      .channel(`job_messages:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_artisan_messages',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as Message
            setMessages((prev) => [
              ...prev,
              { ...newMsg, is_admin: newMsg.sender_id !== currentUserId },
            ])
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as Message
            setMessages((prev) =>
              prev.map((m) =>
                m.id === updatedMsg.id
                  ? { ...updatedMsg, is_admin: updatedMsg.sender_id !== currentUserId }
                  : m
              )
            )
          }
        }
      )
      .subscribe()

    // Typing indicator
    const typingChannel = supabase
      .channel(`typing:${jobId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { is_typing, user_id } = payload.payload as { is_typing: boolean; user_id: string }
        if (user_id !== currentUserId) {
          setOtherIsTyping(is_typing)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
      supabase.removeChannel(typingChannel)
    }
  }, [jobId, router]) // Note: currentUserId is set inside, avoid dependency loop

  // Mark messages as seen when they become visible
  useEffect(() => {
    if (!jobId || loading || !currentUserId || messages.length === 0) return

    const markAsSeen = async () => {
      const unseen = messages.filter(
        (m) => m.seen_at === null && m.sender_id !== currentUserId && !m.deleted_at
      )

      if (unseen.length === 0) return

      const now = new Date().toISOString()

      await supabase
        .from('admin_artisan_messages')
        .update({ seen_at: now })
        .in('id', unseen.map((m) => m.id))

      setMessages((prev) =>
        prev.map((m) =>
          unseen.some((u) => u.id === m.id) ? { ...m, seen_at: now } : m
        )
      )
    }

    markAsSeen()
    window.addEventListener('focus', markAsSeen)

    return () => window.removeEventListener('focus', markAsSeen)
  }, [messages, jobId, loading, currentUserId])

  // New message notification + sound
  useEffect(() => {
    if (messages.length <= prevMessagesLengthRef.current) {
      prevMessagesLengthRef.current = messages.length
      return
    }

    const latest = messages[messages.length - 1]
    if (latest.sender_id === currentUserId || latest.deleted_at) {
      prevMessagesLengthRef.current = messages.length
      return
    }

    prevMessagesLengthRef.current = messages.length

    toast('New message from admin', {
      icon: '💬',
      duration: 4000,
      position: 'top-right',
      style: { background: '#0b0b5c', color: '#ffffff', border: '1px solid #f47b20' },
    })

    if (!isPageVisibleRef.current) {
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])

      try {
        new Audio('/notification.mp3').play().catch(() => {
          // Fallback beep
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const osc = ctx.createOscillator()
          osc.type = 'sine'
          osc.frequency.value = 800
          osc.connect(ctx.destination)
          osc.start()
          osc.stop(ctx.currentTime + 0.2)
        })
      } catch (e) {
        console.warn('Notification sound failed')
      }
    }
  }, [messages, currentUserId])

  useEffect(() => {
    const handleVisibility = () => {
      isPageVisibleRef.current = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const handleTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    supabase.channel(`typing:${jobId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { is_typing: true, user_id: currentUserId },
    })

    typingTimeoutRef.current = setTimeout(() => {
      supabase.channel(`typing:${jobId}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { is_typing: false, user_id: currentUserId },
      })
    }, 2000)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, otherIsTyping])

  const fetchJobAndMessages = async (userId: string) => {
    try {
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
        .eq('assigned_artisan_id', userId)
        .single()

      if (jobError || !rawJob) throw new Error('Job not found or not assigned to you')

      const customerData = Array.isArray(rawJob.customer) ? rawJob.customer[0] : rawJob.customer

      setJob({
        id: rawJob.id,
        title: rawJob.title || '',
        status: rawJob.status || 'unknown',
        customer_id: rawJob.customer_id,
        customer: customerData
          ? {
              first_name: customerData.first_name ?? null,
              last_name: customerData.last_name ?? null,
            }
          : null,
      })

      const { data: msgData, error: msgError } = await supabase
        .from('admin_artisan_messages')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true })

      if (msgError) throw msgError

      setMessages(
        (msgData || []).map((msg) => ({
          ...msg,
          is_admin: msg.sender_id !== userId,
        }))
      )
    } catch (err: any) {
      console.error('Chat load error:', err)
      toast.error(err.message || 'Failed to load chat')
      router.replace('/dashboard/artisan/assigned-jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !jobId || !currentUserId || !job?.customer_id) return

    const tempId = `temp-${Date.now()}`

    const optimistic: Message = {
      id: tempId,
      job_id: jobId,
      sender_id: currentUserId,
      receiver_id: job.customer_id,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      seen_at: null,
      is_edited: false,
      edited_at: null,
      deleted_at: null,
    }

    setMessages((prev) => [...prev, optimistic])
    const messageToSend = newMessage.trim()
    setNewMessage('')
    setSending(true)

    try {
      const { error } = await supabase.from('admin_artisan_messages').insert({
        job_id: jobId,
        sender_id: currentUserId,
        receiver_id: job.customer_id,
        content: messageToSend,
      })

      if (error) throw error
    } catch (err: any) {
      console.error('Send failed:', err)
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // Edit handlers
  const startEdit = (msg: Message) => {
    if (msg.sender_id !== currentUserId || msg.deleted_at) return
    setEditingMessageId(msg.id)
    setEditText(msg.content)
    setOpenMessageId(null)
  }

  const cancelEdit = () => {
    setEditingMessageId(null)
    setEditText('')
  }

  const saveEdit = async () => {
    if (!editingMessageId || !editText.trim()) {
      cancelEdit()
      return
    }

    const originalMsg = messages.find((m) => m.id === editingMessageId)
    if (!originalMsg || editText.trim() === originalMsg.content) {
      cancelEdit()
      return
    }

    const originalContent = originalMsg.content

    setMessages((prev) =>
      prev.map((m) =>
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
          edited_at: new Date().toISOString(),
        })
        .eq('id', editingMessageId)
        .eq('sender_id', currentUserId!)

      if (error) throw error

      toast.success('Message updated')
      cancelEdit()
    } catch (err: any) {
      console.error('Edit failed:', err)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editingMessageId ? { ...m, content: originalContent, is_edited: false, edited_at: null } : m
        )
      )
      toast.error('Failed to update message')
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message? This cannot be undone.')) return

    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, deleted_at: new Date().toISOString() } : m))
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
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, deleted_at: null } : m))
      )
      toast.error('Could not delete message')
    }
  }

  const showContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault()
    if (msg.sender_id !== currentUserId || msg.deleted_at) return
    setOpenMessageId(msg.id)
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard')
    setOpenMessageId(null)
  }

  // Loading / Error states
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-full p-2">
              <Image src="/log.png" width={48} height={48} alt="Loading" />
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
          <h2 className="text-2xl font-bold text-[var(--blue)] mb-4">Job not found</h2>
          <Link
            href="/dashboard/artisan/assigned-jobs"
            className="inline-flex items-center px-8 py-4 bg-[var(--blue)] text-white rounded-xl hover:bg-blue-700"
          >
            <FaArrowLeft className="mr-2" /> Back to Assigned Jobs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {/* Header */}
      <header className="bg-gradient-to-r from-[var(--blue)] to-[var(--orange)] mt-16 text-white px-6 py-4 shadow-lg fixed top-0 left-0 right-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={() => router.back()}>
            <FaArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Chat about {job.title}</h1>
            <p className="text-sm opacity-90">
              {job.customer
                ? `${job.customer.first_name || ''} ${job.customer.last_name || ''}`.trim() || 'Customer'
                : 'Customer'}
            </p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto pt-28 pb-32 px-4 md:px-6 max-w-5xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center text-gray-500">
            <FaCommentDots className="text-6xl text-[var(--orange)] mb-4" />
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm mt-2">Start the conversation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isOwn = currentUserId && msg.sender_id === currentUserId

              return (
                <div
                  key={msg.id}
                  className={`group relative flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                  onContextMenu={(e) => showContextMenu(e, msg)}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                      isOwn
                        ? 'bg-[var(--orange)] text-white rounded-br-none'
                        : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                    } ${msg.deleted_at ? 'opacity-60' : ''}`}
                  >
                    {msg.deleted_at ? (
                      <p className="text-sm italic text-gray-600">This message was deleted</p>
                    ) : editingMessageId === msg.id ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[var(--orange)]"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex gap-3 justify-end text-sm">
                          <button onClick={cancelEdit} className="text-gray-600 hover:text-gray-800">
                            Cancel
                          </button>
                          <button
                            onClick={saveEdit}
                            className="text-[var(--orange)] font-medium hover:text-orange-700"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {!msg.deleted_at && (
                      <div className="flex items-center justify-end gap-2 text-xs opacity-70 mt-1">
                        {msg.is_edited && <span className="italic">edited</span>}
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isOwn && msg.seen_at && <FaCheckDouble className="text-blue-600" />}
                      </div>
                    )}
                  </div>

                  {isOwn && !msg.deleted_at && (
                    <button
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-white shadow-sm hover:bg-gray-100"
                      onClick={() => setOpenMessageId(openMessageId === msg.id ? null : msg.id)}
                    >
                      <FaArrowDown className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>
              )
            })}

            {otherIsTyping && <div className="text-[var(--orange)] text-sm italic pl-4">Admin is typing...</div>}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 shadow-lg z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                handleTyping()
              }}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              placeholder="Type your message..."
              className="flex-1 px-5 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--orange)]"
              disabled={sending || !!editingMessageId}
            />
            <button
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim() || !!editingMessageId}
              className="p-3.5 bg-[var(--blue)] text-white rounded-full hover:bg-[var(--orange)] disabled:opacity-50 transition"
            >
              {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
            </button>
          </div>
        </div>
      </footer>

      {/* Context Menu */}
      {openMessageId && (
        <div
          className="fixed bg-white shadow-2xl rounded-xl py-2 min-w-[160px] z-50 border border-gray-200"
          style={{ bottom: '80px', right: '16px' }}
        >
          <button
            className="flex items-center gap-3 w-full px-5 py-2.5 hover:bg-gray-50 text-left"
            onClick={() => {
              const msg = messages.find((m) => m.id === openMessageId)
              if (msg) handleCopy(msg.content)
            }}
          >
            <FaCopy className="text-gray-700" /> Copy
          </button>

          <button
            className="flex items-center gap-3 w-full px-5 py-2.5 hover:bg-gray-50 text-left text-blue-600"
            onClick={() => {
              const msg = messages.find((m) => m.id === openMessageId)
              if (msg) startEdit(msg)
            }}
          >
            <FaEdit /> Edit
          </button>

          <button
            className="flex items-center gap-3 w-full px-5 py-2.5 hover:bg-gray-50 text-left text-red-600"
            onClick={() => handleDeleteMessage(openMessageId)}
          >
            <FaTrash /> Delete
          </button>
        </div>
      )}
    </div>
  )
}