'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { FaBell, FaCheck, FaTrash, FaUser } from 'react-icons/fa'
import { supabase } from '@/lib/supabase'

interface NotificationItem {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
  type: string
  jobTitle?: string
  adminName?: string
  adminImage?: string | null
  artisanName?: string
  artisanImage?: string | null
  customMessage?: string   // keeping for backward compatibility if needed
}

const Page = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [loading, setLoading] = useState(true)

  // ================= FETCH NOTIFICATIONS =================
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data, error } = await supabase
        .from('customer_notifications')
        .select(`
          id,
          title,
          message,
          read,
          created_at,
          type,
          job_request_id,
          data
        `)
        .eq('customer_id', userData.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get artisan and admin profiles
      const artisanIds = [...new Set(
        (data || []).map((n: any) => n.data?.assigned_artisan_id).filter(Boolean)
      )]

      const adminIds = [...new Set(
        (data || [])
          .filter((n: any) => n.type === 'admin_message')
          .map((n: any) => n.data?.sender_id)
          .filter(Boolean)
      )]

      let artisanMap: Record<string, { name: string; image?: string }> = {}
      let adminMap: Record<string, { name: string; image?: string }> = {}

      if (artisanIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, profile_image')
          .in('id', artisanIds)

        artisanMap = (profiles || []).reduce((acc: any, p: any) => {
          acc[p.id] = {
            name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Artisan',
            image: p.profile_image
          }
          return acc
        }, {})
      }

      if (adminIds.length > 0) {
        const { data: adminProfiles } = await supabase
          .from('admin_profiles')
          .select('id, first_name, last_name, profile_image')
          .in('id', adminIds)

        adminMap = (adminProfiles || []).reduce((acc: any, p: any) => {
          acc[p.id] = {
            name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Admin',
            image: p.profile_image
          }
          return acc
        }, {})
      }

      // Format notifications
      const formatted = (data || []).map((n: any): NotificationItem => {
        if (n.type === 'admin_message') {
          const admin = adminMap[n.data?.sender_id] || { name: 'Admin', image: null }
          return {
            id: n.id,
            title: n.title,
            message: n.message,
            read: n.read,
            createdAt: n.created_at,
            type: n.type,
            jobTitle: n.data?.job_title,
            adminName: admin.name,
            adminImage: admin.image,
          }
        } else {
          const artisan = artisanMap[n.data?.assigned_artisan_id] || { name: 'Artisan', image: null }
          return {
            id: n.id,
            title: n.title,
            message: n.message,
            read: n.read,
            createdAt: n.created_at,
            type: n.type,
            jobTitle: n.data?.job_title,
            artisanName: artisan.name,
            artisanImage: artisan.image,
          }
        }
      })

      setNotifications(formatted)

    } catch (err) {
      console.error('Error fetching notifications:', err)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  // Load on mount
  useEffect(() => {
    fetchNotifications()
  }, [])

  // ================= DELETE NOTIFICATION =================
  const deleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return

    try {
      const { error } = await supabase
        .from('customer_notifications')
        .delete()
        .eq('id', id)

      if (error) throw error

      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success('Notification deleted')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete notification')
    }
  }

  // ================= MARK ALL AS READ =================
  const markAllAsRead = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      await supabase
        .from('customer_notifications')
        .update({ read: true })
        .eq('customer_id', userData.user.id)
        .eq('read', false)

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      toast.success('All notifications marked as read')
    } catch (err) {
      toast.error('Failed to mark all as read')
    }
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notif.read
    if (filter === 'read') return notif.read
    return true
  })

  if (loading) {
    return <div className="min-h-screen bg-[var(--blue)]/5 flex items-center justify-center">Loading notifications...</div>
  }

  return (
    <div className='min-h-screen bg-[var(--blue)]/5 py-8 px-4'>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className='text-4xl font-bold text-[var(--blue)]'>Notifications</h1>
            <p className='text-[var(--blue)] mt-2'>All job activity and updates</p>
          </div>

          {notifications.length > 0 && (
            <button 
              onClick={markAllAsRead}
              className='px-6 py-3 bg-[var(--orange)] text-white rounded-xl flex items-center gap-2 hover:bg-orange-600 transition'
            >
              <FaCheck /> Mark all as read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-6 mb-8 border-b border-[var(--orange)]">
          {(['all', 'unread', 'read'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`pb-4 text-lg font-medium border-b-2 transition capitalize ${
                filter === f
                  ? 'border-[var(--orange)] text-[var(--orange)]'
                  : 'border-transparent text-[var(--blue)] hover:text-[var(--blue)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Notification List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-[var(--white)] rounded-3xl p-20 text-center">
            <FaBell className='text-[var(--orange)] text-8xl mx-auto mb-6 opacity-40'/>
            <h3 className='text-[var(--blue)] mt-3'>
              {filter === 'unread' ? "You're all caught up!" : 'No Notifications yet'}
            </h3>
            <p className='text-[var(--blue)] mt-3'>
              {filter === 'read' ? 'No read notifications' : 'New activity will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className='bg-[var(--white)] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border-l-4 border-l-[var(--orange)]'
              >
                <div className="flex gap-5">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {notif.adminImage || notif.artisanImage ? (
                      <Image
                        src={notif.adminImage || notif.artisanImage || ''}
                        alt="profile"
                        width={56}
                        height={56}
                        className='rounded-full object-cover border border-[var(--orange)]'
                      />
                    ) : (
                      <div className="w-14 h-14 bg-[var(--blue)] rounded-full flex items-center justify-center text-3xl">
                        <FaUser className='text-[var(--white)]'/>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className='font-semibold text-[var(--blue)] text-lg'>
                          {notif.adminName || notif.artisanName || 'System'}
                        </p>
                        <p className='text-[var(--blue)] mt-1 text-[15px]'>
                          {notif.message}
                        </p>
                        {notif.jobTitle && (
                          <p className='text-sm text-[var(--orange)] mt-1'>
                            Job ID: {notif.jobTitle}
                          </p>
                        )}
                      </div>

                      {/* Delete Button - FIXED */}
                      <button 
                        onClick={() => deleteNotification(notif.id)}
                        className="text-[var(--orange)] hover:text-red-500 transition p-1"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                      {new Date(notif.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
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

export default Page