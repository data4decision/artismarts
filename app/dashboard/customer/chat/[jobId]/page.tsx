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
  receiver_id: string
  content: string
  created_at: string
  seen_at: string | null
  is_edited?: boolean
  edited_at?: string | null
  deleted_at?: string | null
  is_admin: boolean
  reply_to_id?: string | null
  reply_to_content?: string | null
}

interface Job {
  id: string
  title: string
  status: string
  assigned_artisan_id?: string | null
  artisan?: {
    first_name: string | null
    last_name: string | null
  } | null
}

export default function CustomerJobChatPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const router = useRouter()

  const [job, setJob] = useState<Job | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [otherIsTyping, setOtherIsTyping] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Editing
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  // Context menu + Reply
  const [openMessageId, setOpenMessageId] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<Message | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const prevMessagesLengthRef = useRef(0)
  const isPageVisibleRef = useRef(true)

  // Initialize + Realtime
  useEffect(() => {
    if (!jobId || typeof jobId !== 'string') {
      toast.error('Invalid job ID')
      router.replace('/dashboard/customer/requests')
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
      await fetchJobAndMessages(user.id)
    }

    init()

    // Realtime Messages
    const messageChannel = supabase
      .channel(`customer-job-messages:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_customer_messages',
          filter: `job_request_id=eq.${jobId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as any
            setMessages(prev => [...prev, {
              ...newMsg,
              is_admin: newMsg.sender_id !== currentUserId
            }])
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any
            setMessages(prev =>
              prev.map(m => m.id === updated.id ? { ...updated, is_admin: updated.sender_id !== currentUserId } : m)
            )
          }
        }
      )
      .subscribe()

    // Typing Indicator
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
  }, [jobId, router])

  // Mark messages as seen
  useEffect(() => {
    if (!jobId || loading || !currentUserId) return

    const markAsSeen = async () => {
      const unseen = messages.filter(m => !m.seen_at && m.is_admin && !m.deleted_at)
      if (unseen.length === 0) return

      const now = new Date().toISOString()

      await supabase
        .from('admin_customer_messages')
        .update({ seen_at: now })
        .in('id', unseen.map(m => m.id))

      setMessages(prev =>
        prev.map(m => unseen.some(u => u.id === m.id) ? { ...m, seen_at: now } : m)
      )
    }

    markAsSeen()
    window.addEventListener('focus', markAsSeen)
    return () => window.removeEventListener('focus', markAsSeen)
  }, [messages, jobId, loading, currentUserId])

  // New message notification
  useEffect(() => {
    if (messages.length <= prevMessagesLengthRef.current) {
      prevMessagesLengthRef.current = messages.length
      return
    }

    const latest = messages[messages.length - 1]
    if (!latest.is_admin || latest.deleted_at) {
      prevMessagesLengthRef.current = messages.length
      return
    }

    prevMessagesLengthRef.current = messages.length

    toast('New message from admin', {
      icon: '💬',
      duration: 4000,
      position: 'top-right',
      style: { background: '#0b0b5c', color: '#ffffff', border: '1px solid #f47b20' }
    })

    if (!isPageVisibleRef.current) {
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
      try {
        new Audio('/notification.mp3').play().catch(() => {})
      } catch {}
    }
  }, [messages])

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
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const fetchJobAndMessages = async (userId: string) => {
    try {
      const { data: rawJob, error: jobError } = await supabase
        .from('job_requests')
        .select(`
          id,
          title,
          status,
          assigned_artisan_id,
          artisan:assigned_artisan_id (first_name, last_name)
        `)
        .eq('id', jobId)
        .eq('customer_id', userId)
        .single()

      if (jobError || !rawJob) throw new Error('Job not found or access denied')

      setJob({
        id: rawJob.id,
        title: rawJob.title || '',
        status: rawJob.status || '',
        assigned_artisan_id: rawJob.assigned_artisan_id,
        artisan: rawJob.artisan ? {
          first_name: (rawJob.artisan as any)?.first_name ?? null,
          last_name: (rawJob.artisan as any)?.last_name ?? null,
        } : null
      })

      const { data: msgData } = await supabase
        .from('admin_customer_messages')
        .select('*')
        .eq('job_request_id', jobId)
        .order('created_at', { ascending: true })

      setMessages(
        (msgData || []).map(msg => ({
          ...msg,
          is_admin: msg.sender_id !== userId
        }))
      )

      scrollToBottom()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to load chat')
      router.replace('/dashboard/customer/requests')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    const trimmed = newMessage.trim()
    if (!trimmed || sending || !currentUserId || !jobId) return

    const tempId = `temp-${Date.now()}`

    const optimisticMsg: Message = {
      id: tempId,
      job_request_id: jobId,
      sender_id: currentUserId,
      receiver_id: '', // Will be filled by database trigger or RLS
      content: trimmed,
      created_at: new Date().toISOString(),
      seen_at: null,
      is_edited: false,
      edited_at: null,
      deleted_at: null,
      is_admin: false,
      reply_to_id: replyTo?.id || null,
      reply_to_content: replyTo?.content || null,
    }

    setMessages(prev => [...prev, optimisticMsg])
    setNewMessage('')
    setSending(true)
    scrollToBottom()

    try {
      const { error } = await supabase
        .from('admin_customer_messages')
        .insert({
          job_request_id: jobId,
          sender_id: currentUserId,
          content: trimmed,
          reply_to_id: replyTo?.id || null,
          // receiver_id can be handled by a database trigger or left null if your RLS allows it
        })

      if (error) throw error

      setReplyTo(null)
    } catch (err: any) {
      console.error('Send failed:', err)
      setMessages(prev => prev.filter(m => m.id !== tempId))
      toast.error(err.message?.includes('42501') ? 'Permission denied - check RLS' : 'Failed to send message')
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
      setMessages(prev =>
        prev.map(m => m.id === editingMessageId ? { ...m, content: originalContent } : m)
      )
      toast.error('Failed to update message')
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message? This cannot be undone.')) return

    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, deleted_at: new Date().toISOString() } : m)
    )

    try {
      const { error } = await supabase
        .from('admin_customer_messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('sender_id', currentUserId!)

      if (error) throw error
      toast.success('Message deleted')
    } catch (err) {
      console.error(err)
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, deleted_at: null } : m)
      )
      toast.error('Failed to delete message')
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

  // Loading States
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Image src="/log.png" width={48} height={48} alt="Loading" className="object-contain" />
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
          <Link href="/dashboard/customer/requests" className="inline-flex items-center px-8 py-4 bg-[var(--blue)] text-white rounded-xl hover:bg-blue-700">
            <FaArrowLeft className="mr-2" /> Back to My Requests
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
              {job.artisan 
                ? `${job.artisan.first_name || ''} ${job.artisan.last_name || ''}`.trim() || 'Artisan'
                : 'Artisan'}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto pt-28 pb-32 px-4 md:px-6 max-w-5xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center text-gray-500">
            <FaCommentDots className="text-6xl text-[var(--orange)] mb-4" />
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm mt-2">Start the conversation with the admin</p>
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
                    className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                      isOwn
                        ? 'bg-[var(--orange)] text-white rounded-br-none'
                        : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                    } ${msg.deleted_at ? 'opacity-60' : ''}`}
                  >
                    {msg.reply_to_content && (
                      <div className="mb-2 pl-3 border-l-4 border-[var(--orange)] text-xs opacity-80">
                        <p className="font-medium">Replying to:</p>
                        <p className="line-clamp-1">{msg.reply_to_content}</p>
                      </div>
                    )}

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
                          <button onClick={cancelEdit} className="text-gray-600 hover:text-gray-800">Cancel</button>
                          <button onClick={saveEdit} className="text-[var(--orange)] font-medium">Save</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {!msg.deleted_at && (
                      <div className="flex items-center justify-end gap-2 text-xs opacity-70 mt-1">
                        {msg.is_edited && <span className="italic">edited</span>}
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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

            {otherIsTyping && <div className="pl-4 text-[var(--orange)] text-sm italic">Admin is typing...</div>}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 shadow-lg z-10">
        <div className="max-w-5xl mx-auto">
          {replyTo && (
            <div className="mb-3 bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-3 text-sm">
              <FaReply className="text-[var(--orange)]" />
              <div className="flex-1 truncate">
                Replying to: {replyTo.content.slice(0, 60)}{replyTo.content.length > 60 ? '...' : ''}
              </div>
              <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-red-600">
                <FaTimes />
              </button>
            </div>
          )}

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
          style={{ bottom: '100px', right: '16px' }}
        >
          <button
            className="flex items-center gap-3 w-full px-5 py-2.5 hover:bg-gray-50 text-left"
            onClick={() => {
              const msg = messages.find(m => m.id === openMessageId)
              if (msg) {
                setReplyTo(msg)
                setOpenMessageId(null)
              }
            }}
          >
            <FaReply className="text-blue-600" /> Reply
          </button>

          <button
            className="flex items-center gap-3 w-full px-5 py-2.5 hover:bg-gray-50 text-left"
            onClick={() => {
              const msg = messages.find(m => m.id === openMessageId)
              if (msg) handleCopy(msg.content)
            }}
          >
            <FaCopy className="text-gray-700" /> Copy
          </button>

          <button
            className="flex items-center gap-3 w-full px-5 py-2.5 hover:bg-gray-50 text-left text-blue-600"
            onClick={() => {
              const msg = messages.find(m => m.id === openMessageId)
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