
'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, FaArrowLeft, FaPaperPlane, FaExclamationTriangle,
  FaCheckDouble, FaCommentDots, FaEdit, FaTrash, FaArrowDown,
  FaReply, FaCopy, FaTimes
} from 'react-icons/fa'
import Link from 'next/link'
import Image from 'next/image'

interface Message {
  id: string
  job_id?: string                 // artisan table
  job_request_id?: string         // customer table
  sender_id: string
  receiver_id: string | null
  content: string
  created_at: string
  seen_at: string | null
  is_edited?: boolean
  edited_at?: string | null
  deleted_at?: string | null
  is_admin: boolean
  reply_to_id?: string | null
  reply_to_content?: string | null
  reply_to_sender?: string | null
}

interface Job {
  id: string
  title: string
  status: string
  assigned_artisan_id?: string | null
  customer_id?: string | null
  artisan?: {
    first_name: string | null
    last_name: string | null
  } | null
  customer?: {
    first_name: string | null
    last_name: string | null
  } | null
}

export default function AdminChatPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const router = useRouter()

  const [job, setJob] = useState<Job | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [otherIsTyping, setOtherIsTyping] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  // Context menu + reply
  const [openMessageId, setOpenMessageId] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<Message | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const prevMessagesLengthRef = useRef(0)
  const isPageVisibleRef = useRef(true)

  // ──────────────────────────────────────────────
  // Initialization & Realtime
  // ──────────────────────────────────────────────

  useEffect(() => {
    if (!jobId || typeof jobId !== 'string') {
      toast.error('Invalid job ID')
      router.replace('/admin-dashboard/messages')
      return
    }

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in')
        router.replace('/login')
        return
      }
      setCurrentUserId(user.id)
      await fetchJobAndMessages()
    }
    init()
  }, [jobId, router])

  useEffect(() => {
    if (!job || !currentUserId) return

    const isArtisanChat = !!job.assigned_artisan_id
    const table = isArtisanChat ? 'admin_artisan_messages' : 'admin_customer_messages'
    const idColumn = isArtisanChat ? 'job_id' : 'job_request_id'

    // Realtime messages
    const messageChannel = supabase
      .channel(`admin-chat:${jobId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
        filter: `${idColumn}=eq.${jobId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const msg = payload.new as Message
          setMessages(prev => [...prev, {
            ...msg,
            is_admin: msg.sender_id === currentUserId
          }])
          scrollToBottom()

          if (msg.sender_id !== currentUserId) {
            toast(`New message from ${isArtisanChat ? 'artisan' : 'customer'}`, {
              icon: '💬',
              duration: 4000,
              position: 'top-right'
            })

            if (!isPageVisibleRef.current) {
              if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
              try {
                const audio = new Audio('/notification.mp3')
                audio.volume = 0.5
                audio.play().catch(() => {})
              } catch {}
            }
          }
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Message
          setMessages(prev => prev.map(m => m.id === updated.id ? updated : m))
        }
      })
      .subscribe()

    // Typing indicator
    const typingChannel = supabase
      .channel(`typing:${jobId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { is_typing, user_id } = payload.payload
        if (user_id !== currentUserId) setOtherIsTyping(is_typing)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
      supabase.removeChannel(typingChannel)
    }
  }, [job, currentUserId, jobId])

  // Mark messages as seen
  useEffect(() => {
    if (!jobId || loading || !currentUserId || !job) return

    const isArtisanChat = !!job.assigned_artisan_id
    const table = isArtisanChat ? 'admin_artisan_messages' : 'admin_customer_messages'

    const markAsSeen = async () => {
      const unseen = messages.filter(m => !m.seen_at && !m.is_admin && !m.deleted_at)

      if (unseen.length === 0) return

      const now = new Date().toISOString()

      await supabase
        .from(table)
        .update({ seen_at: now })
        .in('id', unseen.map(m => m.id))

      setMessages(prev =>
        prev.map(m => (m.seen_at || m.is_admin) ? m : { ...m, seen_at: now })
      )
      await supabase
  .from('user_job_read_status')
  .upsert({
    user_id: currentUserId,
    job_id: isArtisanChat ? jobId : null,
    job_request_id: !isArtisanChat ? jobId : null,
    last_read_at: now
  })
    }

    markAsSeen()
    window.addEventListener('focus', markAsSeen)
    return () => window.removeEventListener('focus', markAsSeen)
  }, [jobId, loading, messages, currentUserId, job])

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
      payload: { is_typing: true, user_id: currentUserId }
    })

    typingTimeoutRef.current = setTimeout(() => {
      supabase.channel(`typing:${jobId}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { is_typing: false, user_id: currentUserId }
      })
    }, 2000)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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
          assigned_artisan_id,
          customer_id,
          artisan:assigned_artisan_id (first_name, last_name),
          customer:customer_id (first_name, last_name)
        `)
        .eq('id', jobId)
        .single()

      if (jobError || !rawJob) throw jobError || new Error('Job not found')

      setJob({
        id: rawJob.id || '',
        title: rawJob.title || '',
        status: rawJob.status || 'unknown',
        assigned_artisan_id: rawJob.assigned_artisan_id,
        customer_id: rawJob.customer_id,
        artisan: rawJob.artisan ? {
          first_name: (rawJob.artisan as any)?.first_name ?? null,
          last_name: (rawJob.artisan as any)?.last_name ?? null
        } : null,
        customer: rawJob.customer ? {
          first_name: (rawJob.customer as any)?.first_name ?? null,
          last_name: (rawJob.customer as any)?.last_name ?? null
        } : null
      })

      const isArtisanChat = !!rawJob.assigned_artisan_id
      const table = isArtisanChat ? 'admin_artisan_messages' : 'admin_customer_messages'
      const idColumn = isArtisanChat ? 'job_id' : 'job_request_id'

      const { data: msgData, error: msgError } = await supabase
        .from(table)
        .select('*')
        .eq(idColumn, jobId)
        .order('created_at', { ascending: true })

      if (msgError) throw msgError

      setMessages(
        (msgData || []).map(msg => ({
          ...msg,
          is_admin: msg.sender_id === user.id
        }))
      )

      scrollToBottom()
    } catch (err: any) {
      console.error('Chat load failed:', err)
      toast.error(err.message || 'Failed to load chat')
      router.replace('/admin-dashboard/messages')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !currentUserId || !jobId || !job) return

    setSending(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const isArtisanChat = !!job.assigned_artisan_id
      const table = isArtisanChat ? 'admin_artisan_messages' : 'admin_customer_messages'
      const idColumn = isArtisanChat ? 'job_id' : 'job_request_id'
      const receiverId = isArtisanChat ? job.assigned_artisan_id : job.customer_id

      const { error } = await supabase
        .from(table)
        .insert({
          [idColumn]: jobId,
          sender_id: user.id,
          receiver_id: receiverId || null,
          content: newMessage.trim(),
          seen_at: null,
          reply_to_id: replyTo?.id || null
        })

      if (error) throw error

      setNewMessage('')
      setReplyTo(null)
      scrollToBottom()
    } catch (err: any) {
      toast.error('Failed to send message')
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  // ──────────────────────────────────────────────
  // Context Menu & Message Actions
  // ──────────────────────────────────────────────

  const showContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault()
    if (msg.sender_id !== currentUserId || msg.deleted_at) return
    setOpenMessageId(msg.id)
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied')
    setOpenMessageId(null)
  }

  const handleReply = (msg: Message) => {
    setReplyTo(msg)
    setOpenMessageId(null)
  }

  const cancelReply = () => setReplyTo(null)

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
    if (!editingMessageId || !editText.trim() || !job) return

    const original = messages.find(m => m.id === editingMessageId)?.content || ''

    setMessages(prev =>
      prev.map(m =>
        m.id === editingMessageId
          ? { ...m, content: editText.trim(), is_edited: true, edited_at: new Date().toISOString() }
          : m
      )
    )

    try {
      const isArtisanChat = !!job.assigned_artisan_id
      const table = isArtisanChat ? 'admin_artisan_messages' : 'admin_customer_messages'

      const { error } = await supabase
        .from(table)
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
    } catch (err) {
      console.error(err)
      toast.error('Update failed')
      setMessages(prev => prev.map(m => m.id === editingMessageId ? { ...m, content: original } : m))
    }
  }

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Delete this message?')) return

    setMessages(prev => prev.map(m => m.id === id ? { ...m, deleted_at: new Date().toISOString() } : m))

    try {
      const isArtisanChat = !!job?.assigned_artisan_id
      const table = isArtisanChat ? 'admin_artisan_messages' : 'admin_customer_messages'

      const { error } = await supabase
        .from(table)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('sender_id', currentUserId!)

      if (error) throw error

      toast.success('Deleted')
    } catch (err) {
      console.error(err)
      toast.error('Delete failed')
      setMessages(prev => prev.map(m => m.id === id ? { ...m, deleted_at: null } : m))
    }
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

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="text-red-500 text-7xl mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Job not found
          </h2>
          <p className="text-gray-600 mb-8">
            This job may not exist or has no assigned user.
          </p>
          <Link
            href="/admin-dashboard/messages"
            className="inline-flex items-center px-8 py-4 bg-[var(--blue)] text-white rounded-xl hover:bg-blue-700 transition shadow-md"
          >
            <FaArrowLeft className="mr-2" />
            Back to Messages
          </Link>
        </div>
      </div>
    )
  }

  const isArtisanChat = !!job.assigned_artisan_id
  const recipient = isArtisanChat ? job.artisan : job.customer
  const recipientName = recipient 
    ? `${recipient.first_name ?? ''} ${recipient.last_name ?? ''}`.trim() || (isArtisanChat ? 'Artisan' : 'Customer')
    : (isArtisanChat ? 'Artisan' : 'Customer')

  const recipientType = isArtisanChat ? 'Artisan' : 'Customer'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {/* Header */}
      <header className="bg-gradient-to-r from-[var(--blue)] to-[var(--orange)] text-white px-6 py-4 shadow-lg fixed top-15 left-0 right-0 w-full z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="hover:opacity-80">
              <FaArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">
                Chat with {recipientType} - {job.title}
              </h1>
              <p className="text-sm opacity-90 mt-1">
                {recipientName}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto pt-28 pb-32 px-4 md:px-6 max-w-5xl mx-auto w-full bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <FaCommentDots className="text-6xl text-gray-300 mb-4" />
            <p className="text-lg">No messages yet</p>
            <p className="text-sm mt-2">Start the conversation</p>
          </div>
        ) : (
          <div className="space-y-4 pb-20">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`group relative flex flex-col ${msg.is_admin ? 'items-end' : 'items-start'}`}
                onContextMenu={(e) => showContextMenu(e, msg)}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.is_admin
                      ? 'bg-[var(--orange)] text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-900 rounded-bl-none'
                  } ${msg.deleted_at ? 'opacity-60' : ''}`}
                >
                  {msg.reply_to_id && msg.reply_to_content && (
                    <div className="mb-2 pl-3 border-l-4 border-[var(--orange)] text-xs opacity-80">
                      <p className="font-medium">
                        Replying to {msg.reply_to_sender}:
                      </p>
                      <p className="line-clamp-1">{msg.reply_to_content}</p>
                    </div>
                  )}

                  {msg.deleted_at ? (
                    <p className="text-sm italic text-gray-600">Message deleted</p>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}

                  <div className="flex items-center justify-end gap-1 text-xs opacity-70 mt-1">
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.is_admin && msg.seen_at && <FaCheckDouble className="text-blue-400" />}
                  </div>
                </div>

                {msg.is_admin && !msg.deleted_at && (
                  <button
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-white shadow-sm hover:bg-gray-100"
                    onClick={() => setOpenMessageId(openMessageId === msg.id ? null : msg.id)}
                  >
                    <FaArrowDown className="w-4 h-4 text-gray-600" />
                  </button>
                )}
              </div>
            ))}
            {otherIsTyping && (
              <div className="flex items-center text-gray-500 text-sm italic pl-4">
                {recipientType} is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Message Input */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg z-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-2">
          {replyTo && (
            <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-lg text-sm">
              <FaReply className="text-[var(--orange)]" />
              <div className="flex-1 truncate">
                <span className="font-medium">Replying to:</span>{' '}
                {replyTo.content.slice(0, 80)}{replyTo.content.length > 80 ? '...' : ''}
              </div>
              <button onClick={cancelReply} className="text-gray-600 hover:text-red-600">
                <FaTimes />
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={e => {
                setNewMessage(e.target.value)
                handleTyping()
              }}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              placeholder={`Type your message to ${recipientType.toLowerCase()}...`}
              className="flex-1 px-5 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--orange)]"
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
        </div>
      </footer>

      {/* Context Menu */}
      {openMessageId && (
        <div
          className="fixed bg-white shadow-xl rounded-lg py-2 min-w-[160px] z-50 border border-gray-200"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <button
            onClick={() => {
              const msg = messages.find(m => m.id === openMessageId)
              if (msg) handleReply(msg)
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-gray-100 text-[var(--blue)]"
          >
            <FaReply size={14} />
            Reply
          </button>

          <button
            onClick={() => {
              const msg = messages.find(m => m.id === openMessageId)
              if (msg) {
                navigator.clipboard.writeText(msg.content)
                toast.success('Copied')
              }
              setOpenMessageId(null)
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-gray-100"
          >
            <FaCopy size={14} />
            Copy
          </button>

          <button
            onClick={() => {
              const msg = messages.find(m => m.id === openMessageId)
              if (msg) startEdit(msg)
              setOpenMessageId(null)
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-gray-50 text-[var(--blue)]"
          >
            <FaEdit size={14} />
            Edit
          </button>

          <button
            onClick={() => {
              handleDeleteMessage(openMessageId)
              setOpenMessageId(null)
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-gray-50 text-red-600"
          >
            <FaTrash size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}