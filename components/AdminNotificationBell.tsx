'use client'

import { useEffect, useState } from 'react'
import { FaBell } from 'react-icons/fa'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
}

export default function AdminNotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // 🔥 Format time like Facebook
  const timeAgo = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`
    return `${Math.floor(diff / 86400)} days ago`
  }

  // 🔥 Fetch notifications
  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15)

    if (!error && data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    }
  }

  // 🔥 Mark all as read
  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false)

    fetchNotifications()
  }

  // 🔥 Handle click
  const handleClick = async (n: Notification) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', n.id)

    // Smart routing
    if (n.type === 'completed_job') {
      router.push('/admin-dashboard/completed-job')
    } else if (n.type === 'dispute') {
      router.push('/admin-dashboard/disputes')
    } else if (n.type === 'message') {
      router.push('/admin-dashboard/messages')
    }

    setOpen(false)
  }

  // 🔥 Realtime (same style as sidebar)
  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    const handleFocus = () => fetchNotifications()
    window.addEventListener('focus', handleFocus)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return (
    <div className="relative">
      {/* 🔔 Bell */}
      <button
        onClick={() => setOpen(!open)}
        className="relative text-[var(--white)]"
      >
        <FaBell size={20} />

        {unreadCount > 0 && (
  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-[var(--orange)] text-[var(--white)] border-2 border-[var(--blue)] shadow">
    {unreadCount > 99 ? '99+' : unreadCount}
  </span>
)}
      </button>

      {/* 🔽 Dropdown */}
      {open && (
        <div className="absolute right-0 mt-3 w-96 bg-[var(--white)] rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          
          {/* Header */}
          <div className="p-4 flex justify-between items-center border-b">
            <h3 className="font-semibold text-[var(--blue)] text-lg">
              Notifications
            </h3>
            <button
              onClick={markAllAsRead}
              className="text-sm text-[var(--orange)] font-medium"
            >
              Mark all as read
            </button>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-4 text-sm text-gray-500 text-center">
                No notifications yet
              </p>
            )}

            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex gap-3 p-4 cursor-pointer transition ${
                  !n.read
                    ? 'bg-[var(--blue)]/5'
                    : 'bg-[var(--white)]'
                } hover:bg-[var(--orange)]/10`}
              >
                {/* Icon */}
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--blue)] text-white text-sm font-bold">
                  {n.type === 'completed_job' && '✔'}
                  {n.type === 'dispute' && '!'}
                  {n.type === 'message' && '💬'}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--blue)]">
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-600">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-gray-400">
                    {timeAgo(n.created_at)}
                  </span>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <div className="w-2 h-2 bg-[var(--orange)] rounded-full mt-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}