
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
  job_request_id: string
  sender_id: string
  receiver_id: string | null
  content: string
  created_at: string
  seen_at: string | null
  is_edited?: boolean
  edited_at?: string | null
  deleted_at?: string | null
  reply_to_id?: string | null
  reply_to_content?: string | null
  reply_to_sender?: string | null
  is_admin: boolean         
}

interface Customer {
  first_name: string | null
  last_name: string | null
}

interface JobRequest {
  id: string
  title: string
  status: string
  customer_id: string | null
  customer?: Customer | null
}

export default function AdminCustomerChatPage() {
  const { jobRequestId } = useParams<{ jobRequestId: string }>()
  const router = useRouter()

  const [job, setJob] = useState<JobRequest | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [otherIsTyping, setOtherIsTyping] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Editing
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
  // Init + Realtime
  // ──────────────────────────────────────────────

  useEffect(() => {
    if (!jobRequestId || typeof jobRequestId !== 'string') {
      toast.error('Invalid job request ID')
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
  }, [jobRequestId, router])

  useEffect(() => {
    if (!job || !currentUserId) return

    // Realtime messages — only admin_customer_messages
    const messageChannel = supabase
      .channel(`admin-customer-chat:${jobRequestId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'admin_customer_messages',
        filter: `job_request_id=eq.${jobRequestId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const msg = payload.new as Message
          setMessages(prev => [...prev, {
            ...msg,
            is_admin: msg.sender_id === currentUserId
          }])
          scrollToBottom()

          if (msg.sender_id !== currentUserId) {
            toast('New message from customer', {
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

    // Typing from customer
    const typingChannel = supabase
      .channel(`typing:${jobRequestId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { is_typing, user_id } = payload.payload
        if (user_id !== currentUserId) setOtherIsTyping(is_typing)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
      supabase.removeChannel(typingChannel)
    }
  }, [job, currentUserId, jobRequestId])

  // Mark customer messages as seen by admin
  useEffect(() => {
    if (!jobRequestId || loading || !currentUserId) return

    const markAsSeen = async () => {
      const unseenFromCustomer = messages.filter(
        m => !m.seen_at && !m.is_admin && !m.deleted_at
      )

      if (unseenFromCustomer.length === 0) return

      const now = new Date().toISOString()

      await supabase
        .from('admin_customer_messages')
        .update({ seen_at: now })
        .in('id', unseenFromCustomer.map(m => m.id))

      setMessages(prev =>
        prev.map(m => (m.seen_at || m.is_admin) ? m : { ...m, seen_at: now })
      )
     await supabase
  .from('user_job_read_status')
  .upsert({
    user_id: currentUserId,
    job_request_id: jobRequestId,
    last_read_at: now
  })
    }

    markAsSeen()
    window.addEventListener('focus', markAsSeen)
    return () => window.removeEventListener('focus', markAsSeen)
  }, [jobRequestId, loading, messages, currentUserId])

  useEffect(() => {
    const handleVisibility = () => {
      isPageVisibleRef.current = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const handleTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    supabase.channel(`typing:${jobRequestId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { is_typing: true, user_id: currentUserId }
    })

    typingTimeoutRef.current = setTimeout(() => {
      supabase.channel(`typing:${jobRequestId}`).send({
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
          customer_id,
          customer:customer_id (first_name, last_name)
        `)
        .eq('id', jobRequestId)
        .single()

      if (jobError || !rawJob) throw jobError || new Error('Job request not found')

      setJob({
        id: rawJob.id || '',
        title: rawJob.title || '',
        status: rawJob.status || 'unknown',
        customer_id: rawJob.customer_id,
        customer: rawJob.customer ? {
          first_name: (rawJob.customer as any)?.first_name ?? null,
          last_name: (rawJob.customer as any)?.last_name ?? null
        } : null
      })

      const { data: msgData, error: msgError } = await supabase
        .from('admin_customer_messages')
        .select('*')
        .eq('job_request_id', jobRequestId)
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
      toast.error(err.message || 'Failed to load customer chat')
      router.replace('/admin-dashboard/messages')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !currentUserId || !jobRequestId || !job) return

    setSending(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('admin_customer_messages')
        .insert({
          job_request_id: jobRequestId,
          sender_id: user.id,
          receiver_id: job.customer_id || null,
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
    if (!editingMessageId || !editText.trim()) {
      cancelEdit()
      return
    }

    const original = messages.find(m => m.id === editingMessageId)?.content || ''

    setMessages(prev =>
      prev.map(m =>
        m.id === editingMessageId
          ? { ...m, content: editText.trim(), is_edited: true, edited_at: new Date().toISOString() }
          : m
      )
    )

    try {
      const { error } = await supabase
        .from('admin_customer_messages')
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
      const { error } = await supabase
        .from('admin_customer_messages')
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
            Job request not found
          </h2>
          <p className="text-[var(--blue)] mb-8">
            This request may not exist or has no customer associated.
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

  const customerName = job.customer 
    ? `${job.customer.first_name ?? ''} ${job.customer.last_name ?? ''}`.trim() || 'Customer'
    : 'Customer'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {/* Header */}
      <header className="bg-gradient-to-r from-[var(--orange)] to-[var(--blue)] mt-15 text-white px-6 py-4 shadow-lg fixed top-0 left-0 right-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 sm:ml-15">
            <button onClick={() => router.back()} className="hover:opacity-80">
              <FaArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">
                Chat with Customer - {job.title}
              </h1>
              <p className="text-sm opacity-90 mt-1">
                {customerName}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto pt-28 pb-32 px-4 md:px-6 max-w-5xl mx-auto w-full bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <FaCommentDots className="text-6xl text-[var(--orange)] mb-4" />
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm mt-2">Start the conversation with the customer</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isOwn = currentUserId && msg.sender_id === currentUserId
              return (
                <div
                  key={msg.id}
                  className={`group relative flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                  onContextMenu={(e) => showContextMenu(e, msg)}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      isOwn
                        ? 'bg-[var(--orange)] text-white rounded-br-none'
                        : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
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

                    <div className="flex items-center justify-end gap-2 text-xs opacity-70 mt-1">
                      {msg.is_edited && <span className="italic">edited</span>}
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isOwn && msg.seen_at && <FaCheckDouble className="text-blue-600" />}
                    </div>
                  </div>

                  {isOwn && !msg.deleted_at && (
                    <button
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-white shadow-sm hover:bg-gray-100"
                      onClick={() => setOpenMessageId(openMessageId === msg.id ? null : msg.id)}
                    >
                      <FaArrowDown className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>
              )
            })}
            {otherIsTyping && (
              <div className="flex items-center text-[var(--orange)] text-sm italic pl-4">
                Customer is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Bar */}
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
              placeholder="Type your message to the customer..."
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