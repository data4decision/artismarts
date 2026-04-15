'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaBell, FaTrash, FaCheck, FaSpinner } from 'react-icons/fa'
import Image from 'next/image'

interface NotificationItem {
  id: string
  created_at: string
  read: boolean
  customerName?: string
  customerImage?: string | null
  artisanName?: string
  artisanImage?: string | null
  customMessage: string
  jobTitle: string
  type: 'new_job_request' | 'job_accepted'
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  const fetchNotifications = async () => {
    try {
      const { data: pendingJobs } = await supabase
        .from('job_requests')
        .select(`
          id, title, created_at,
          customer:customer_id (first_name, last_name, profile_image)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      const { data: acceptedJobs } = await supabase
        .from('job_requests')
        .select(`
          id, title, created_at,
          artisan:assigned_artisan_id (first_name, last_name, profile_image)
        `)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })

      const pendingFormatted = (pendingJobs || []).map((item: any) => {
        const customer = Array.isArray(item.customer) ? item.customer[0] : item.customer
        const customerName = `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || 'A Customer'

        return {
          id: item.id,
          created_at: item.created_at,
          read: false,
          customerName,
          customerImage: customer?.profile_image || null,
          customMessage: `${customerName} sent a new job request`,
          jobTitle: item.title || 'Untitled Job',
          type: 'new_job_request' as const
        }
      })

      const acceptedFormatted = (acceptedJobs || []).map((item: any) => {
        const artisan = Array.isArray(item.artisan) ? item.artisan[0] : item.artisan
        const artisanName = `${artisan?.first_name || ''} ${artisan?.last_name || ''}`.trim() || 'An Artisan'

        return {
          id: item.id,
          created_at: item.created_at,
          read: false,
          artisanName,
          artisanImage: artisan?.profile_image || null,
          customMessage: `Artisan ${artisanName} accepted the job`,
          jobTitle: item.title || 'Untitled Job',
          type: 'job_accepted' as const
        }
      })

      const allNotifications = [...pendingFormatted, ...acceptedFormatted]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setNotifications(allNotifications)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const deleteNotification = async (id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success('Notification deleted')
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }

  // Filter logic
  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notif.read
    if (filter === 'read') return notif.read
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[var(--blue)]">Notifications</h1>
            <p className="text-[var(--blue)] mt-2">All job activity and updates</p>
          </div>

          {notifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-6 py-3 bg-[var(--orange)] text-white rounded-xl hover:bg-orange-600 flex items-center gap-2 transition"
            >
              <FaCheck /> Mark all as read
            </button>
          )}
        </div>

        {/* Filters: All | Unread | Read */}
        <div className="flex gap-6 mb-8 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`pb-4 text-lg font-medium border-b-2 transition ${
              filter === 'all' 
                ? 'border-[var(--orange)] text-[var(--orange)]' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All
          </button>

          <button
            onClick={() => setFilter('unread')}
            className={`pb-4 text-lg font-medium border-b-2 transition flex items-center gap-2 ${
              filter === 'unread' 
                ? 'border-[var(--orange)] text-[var(--orange)]' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Unread 
            <span className="bg-[var(--orange)] text-white text-xs px-2 py-0.5 rounded-full">
              {notifications.filter(n => !n.read).length}
            </span>
          </button>

          <button
            onClick={() => setFilter('read')}
            className={`pb-4 text-lg font-medium border-b-2 transition ${
              filter === 'read' 
                ? 'border-[var(--orange)] text-[var(--orange)]' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Read
          </button>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center">
            <FaBell className="text-[var(--orange)] text-8xl mx-auto mb-6 opacity-40" />
            <h3 className="text-3xl font-semibold text-[var(--blue)]">
              {filter === 'unread' ? "You're all caught up!" : "No notifications yet"}
            </h3>
            <p className="text-gray-500 mt-3">
              {filter === 'read' ? "No read notifications" : "New activity will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border-l-4 border-l-[var(--orange)]"
              >
                <div className="flex gap-5">
                  {/* Profile Image */}
                  <div className="flex-shrink-0">
                    {(notif.customerImage || notif.artisanImage) ? (
                      <Image
                        src={notif.customerImage || notif.artisanImage || ''}
                        alt=""
                        width={56}
                        height={56}
                        className="rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-3xl">
                        👤
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-[var(--blue)] text-lg">
                          {notif.customerName || notif.artisanName}
                        </p>
                        <p className="text-gray-700 mt-1 text-[15px]">
                          {notif.customMessage}
                        </p>
                        {notif.jobTitle && (
                          <p className="text-sm text-gray-500 mt-1">Job: {notif.jobTitle}</p>
                        )}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          if (confirm('Delete this notification?')) {
                            // Remove from UI (you can add real DB delete later)
                            setNotifications(prev => prev.filter(n => n.id !== notif.id))
                            toast.success('Notification deleted')
                          }
                        }}
                        className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>

                    <p className="text-xs text-gray-400 mt-4">
                      {new Date(notif.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
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