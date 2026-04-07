'use client'

import React, { useState, useEffect } from 'react'
import { 
  FaBell, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaTrash, 
  FaEnvelope 
} from 'react-icons/fa'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
  link?: string
}

export default function SuperAdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setNotifications(data || [])
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Realtime subscription for new notifications
    const channel = supabase
      .channel('admin_notifications')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'admin_notifications' 
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Mark as read
  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ read: true })
      .eq('id', id)

    if (!error) {
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      )
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ read: true })
      .eq('read', false)

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      toast.success('All notifications marked as read')
    }
  }

  // Delete notification
  const deleteNotification = async (id: string) => {
    if (!confirm('Delete this notification?')) return

    const { error } = await supabase
      .from('admin_notifications')
      .delete()
      .eq('id', id)

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success('Notification deleted')
    }
  }

  const filteredNotifications = notifications.filter(notif => 
    filter === 'all' || (filter === 'unread' && !notif.read)
  )

  const unreadCount = notifications.filter(n => !n.read).length

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <FaCheckCircle className="text-green-500" />
      case 'warning': return <FaExclamationTriangle className="text-orange-500" />
      case 'error': return <FaExclamationTriangle className="text-red-500" />
      default: return <FaInfoCircle className="text-blue-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--blue)] flex items-center gap-3">
              <FaBell /> Notifications
            </h1>
            <p className="text-gray-600 mt-1">Stay updated with platform activities</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
                filter === 'all' 
                  ? 'bg-[var(--blue)] text-white' 
                  : 'bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                filter === 'unread' 
                  ? 'bg-[var(--blue)] text-white' 
                  : 'bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Unread 
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-5 py-2 bg-white border border-[var(--orange)] text-[var(--orange)] rounded-xl hover:bg-orange-50 transition text-sm font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--blue)] border-t-transparent"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center">
            <FaBell className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600">No notifications</h3>
            <p className="text-gray-500 mt-2">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white rounded-3xl p-6 shadow-sm border-l-4 transition hover:shadow-md ${
                  notif.read ? 'border-gray-200' : 'border-[var(--orange)]'
                }`}
              >
                <div className="flex gap-4">
                  <div className="mt-1">{getIcon(notif.type)}</div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className={`font-semibold ${notif.read ? 'text-gray-700' : 'text-[var(--blue)]'}`}>
                        {notif.title}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(notif.created_at).toLocaleDateString()} •{' '}
                        {new Date(notif.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>

                    <p className="text-gray-600 mt-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.link && (
                      <Link 
                        href={notif.link}
                        className="text-[var(--orange)] text-sm font-medium mt-3 inline-block hover:underline"
                      >
                        View details →
                      </Link>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {!notif.read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="text-xs bg-blue-100 hover:bg-blue-200 text-[var(--blue)] px-3 py-1 rounded-full transition"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="text-gray-400 hover:text-red-500 transition p-1"
                      title="Delete notification"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}