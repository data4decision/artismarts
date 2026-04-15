'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaBell, FaTimes, FaCheck, FaSpinner } from 'react-icons/fa'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { RealtimeChannel } from '@supabase/supabase-js'

interface NotificationItem {
  id: string
  job_id: string
  created_at: string
  read: boolean
  customerName?: string
  customerImage?: string | null
  artisanName?: string
  artisanImage?: string | null
  customMessage: string
  jobTitle: string
  type: 'new_job_request' | 'job_accepted' | 'completed_job' | 'disputed_job' | 'verification'
}

export default function AdminNotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedSound, setSelectedSound] = useState('/sounds/notification.mp3')
  const [isMuted, setIsMuted] = useState(false)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const router = useRouter()
  const prevUnreadRef = useRef(0)   // Helps detect actual new notifications

  // Load notification preferences from localStorage
  useEffect(() => {
    const savedSound = localStorage.getItem('notificationSound')
    const savedMute = localStorage.getItem('notificationMuted') === 'true'

    if (savedSound) setSelectedSound(savedSound)
    setIsMuted(savedMute)
  }, [])

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(selectedSound)
    audioRef.current.volume = 0.65
  }, [selectedSound])

  const playNotificationSound = () => {
    if (isMuted || !audioRef.current) return
    audioRef.current.currentTime = 0
    audioRef.current.play().catch((err) => {
      console.warn('Notification sound playback failed:', err)
    })
  }

  const fetchNotifications = async () => {
    try {
      const { data: pending } = await supabase
        .from('job_requests')
        .select(`id, title, created_at, customer:customer_id(first_name, last_name, profile_image)`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10)

      const { data: inProgress } = await supabase
        .from('job_requests')
        .select(`id, title, created_at, artisan:assigned_artisan_id(first_name, last_name, profile_image)`)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(10)

      const { data: completed } = await supabase
        .from('notifications')
        .select(`id, title, message as customMessage, created_at, job_id`)
        .eq('type', 'new_completed_job')
        .order('created_at', { ascending: false })
        .limit(10)

      const { data: disputed } = await supabase
        .from('job_requests')
        .select(`id, title, created_at, artisan:assigned_artisan_id(first_name, last_name, profile_image)`)
        .eq('status', 'disputed')
        .order('created_at', { ascending: false })
        .limit(10)

      const { data: verification } = await supabase
        .from('profiles')
        .select(`id, first_name, last_name, profile_image, created_at`)
        .eq('role', 'artisan')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10)

      const pendingFormatted = (pending || []).map((item: any) => ({
        id: item.id,
        job_id: item.id,
        created_at: item.created_at,
        read: false,
        customerName: `${item.customer?.first_name || ''} ${item.customer?.last_name || ''}`.trim() || 'A Customer',
        customerImage: item.customer?.profile_image || null,
        customMessage: `${item.customer?.first_name || ''} ${item.customer?.last_name || ''} sent a new job request`.trim(),
        jobTitle: item.title || 'Untitled Job',
        type: 'new_job_request' as const
      }))

      const acceptedFormatted = (inProgress || []).map((item: any) => ({
        id: item.id,
        job_id: item.id,
        created_at: item.created_at,
        read: false,
        artisanName: `${item.artisan?.first_name || ''} ${item.artisan?.last_name || ''}`.trim() || 'An Artisan',
        artisanImage: item.artisan?.profile_image || null,
        customMessage: `Artisan ${item.artisan?.first_name || ''} ${item.artisan?.last_name || ''} accepted the job`,
        jobTitle: item.title || 'Untitled Job',
        type: 'job_accepted' as const
      }))

      const completedFormatted = (completed || []).map((item: any) => ({
        id: item.id,
        job_id: item.job_id || item.id,
        created_at: item.created_at,
        read: false,
        artisanName: 'System',
        customMessage: item.customMessage || `Job has been completed`,
        jobTitle: item.title || 'Untitled Job',
        type: 'completed_job' as const
      }))

      const disputedFormatted = (disputed || []).map((item: any) => ({
        id: item.id,
        job_id: item.id,
        created_at: item.created_at,
        read: false,
        artisanName: `${item.artisan?.first_name || ''} ${item.artisan?.last_name || ''}`.trim() || 'An Artisan',
        artisanImage: item.artisan?.profile_image || null,
        customMessage: `Job "${item.title}" has been disputed`,
        jobTitle: item.title || 'Untitled Job',
        type: 'disputed_job' as const
      }))

      const verificationFormatted = (verification || []).map((item: any) => ({
        id: item.id,
        job_id: item.id,
        created_at: item.created_at,
        read: false,
        artisanName: `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'An Artisan',
        artisanImage: item.profile_image || null,
        customMessage: `New verification request from ${item.first_name || ''} ${item.last_name || ''}`,
        jobTitle: 'Verification Request',
        type: 'verification' as const
      }))

      const allNotifications = [...pendingFormatted, ...acceptedFormatted, ...completedFormatted, ...disputedFormatted, ...verificationFormatted]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      const newUnreadCount = allNotifications.length

      // Play sound only when unread count actually increases (new notification arrived)
      if (newUnreadCount > prevUnreadRef.current) {
        playNotificationSound()
      }

      prevUnreadRef.current = newUnreadCount
      setNotifications(allNotifications)
      setUnreadCount(newUnreadCount)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtime = () => {
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel('admin_notifications_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'job_requests' },
        () => fetchNotifications()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => fetchNotifications()
      )
      .subscribe()

    channelRef.current = channel
  }

  useEffect(() => {
    fetchNotifications()
    setupRealtime()

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [])

  const handleNotificationClick = (notif: NotificationItem) => {
    setNotifications(prev => prev.filter(n => n.id !== notif.id))
    setUnreadCount(prev => Math.max(0, prev - 1))
    setIsOpen(false)

    if (notif.type === 'new_job_request') {
      router.push('/admin-dashboard/requests')
    } else if (notif.type === 'job_accepted') {
      router.push('/admin-dashboard/assigned-jobs')
    } else if (notif.type === 'completed_job') {
      router.push('/admin-dashboard/completed-job')
    } else if (notif.type === 'disputed_job') {
      router.push('/admin-dashboard/disputes')
    } else if (notif.type === 'verification') {
      router.push('/admin-dashboard/verification')
    }
  }

  const markAllAsRead = () => {
    setNotifications([])
    setUnreadCount(0)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 text-[var(--white)] hover:bg-white/10 rounded-full transition-all duration-200"
      >
        <FaBell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[var(--orange)] text-white text-xs font-bold 
                           min-w-[20px] h-5 flex items-center justify-center rounded-full shadow border-2 border-[var(--blue)]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-[var(--blue)] text-white rounded-t-2xl">
            <h3 className="font-semibold text-lg">Notifications</h3>
            <div className="flex items-center gap-3">
              {/* Removed cog icon - settings now in dedicated page */}
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-sm flex items-center gap-1 hover:underline">
                  <FaCheck size={14} /> Mark all
                </button>
              )}
              <button onClick={() => setIsOpen(false)}>
                <FaTimes size={18} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto">
            {loading ? (
              <div className="p-10 text-center">
                <FaSpinner className="animate-spin mx-auto text-3xl" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-16 text-center text-gray-400">
                <FaBell size={56} className="mx-auto mb-4 opacity-40" />
                <p>No new activity</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`px-6 py-5 border-b hover:bg-gray-50 cursor-pointer transition-all ${!notif.read ? 'bg-blue-50/70' : ''}`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      {notif.customerImage || notif.artisanImage ? (
                        <Image 
                          src={notif.customerImage || notif.artisanImage || ''} 
                          alt="" 
                          width={48} 
                          height={48} 
                          className="rounded-full object-cover border border-gray-200" 
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-2xl">👤</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--blue)]">
                        {notif.customerName || notif.artisanName}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">{notif.customMessage}</p>
                      {notif.jobTitle && <p className="text-xs text-gray-500 mt-1">Job: {notif.jobTitle}</p>}
                      <p className="text-[10px] text-gray-400 mt-2">
                        {new Date(notif.created_at).toLocaleString([], { 
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    {!notif.read && <div className="w-2.5 h-2.5 bg-[var(--orange)] rounded-full mt-2" />}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t bg-gray-50 text-center">
            <Link 
              href="/admin-dashboard/notifications" 
              onClick={() => setIsOpen(false)}
              className="text-[var(--blue)] hover:text-[var(--orange)] text-sm font-medium"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}