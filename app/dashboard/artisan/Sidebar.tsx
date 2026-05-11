'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  FaTachometerAlt,
  FaUser,
  FaIdCard,
  FaBriefcase,
  FaTasks,
  FaComments,
  FaWallet,
  FaStar,
  FaCalendarAlt,
  FaBell,
  FaLifeRing,
  FaTimes,
  FaBars,
  FaSignOutAlt,
  FaCog,
} from 'react-icons/fa'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

// Logout handler
const logout = () => {
  window.location.href = '/login'
}

const nav = [
  { label: 'Dashboard', href: '/dashboard/artisan', icon: FaTachometerAlt },
  { label: 'Profile', href: '/dashboard/artisan/profile', icon: FaUser },
  { label: 'Verification', href: '/dashboard/artisan/verification', icon: FaIdCard },
  // { label: 'Job Requests', href: '/dashboard/artisan/requests', icon: FaBriefcase },
  { label: 'Assigned Jobs', href: '/dashboard/artisan/assigned-jobs', icon: FaBriefcase },
  { label: 'Active Jobs', href: '/dashboard/artisan/jobs', icon: FaTasks },
  { label: 'Completed Jobs', href: '/dashboard/artisan/completed-jobs', icon: FaTasks },
  { label: 'Messages', href: '/dashboard/artisan/messages', icon: FaComments },
  // { label: 'Earnings', href: '/dashboard/artisan/earnings', icon: FaWallet },
  { label: 'Reviews', href: '/dashboard/artisan/reviews', icon: FaStar },
  // { label: 'Availability', href: '/dashboard/artisan/availability', icon: FaCalendarAlt },
  { label: 'Notifications', href: '/dashboard/artisan/notifications', icon: FaBell },
  { label: 'Settings', href: '/dashboard/artisan/settings', icon: FaCog },
  // { label: 'Support', href: '/dashboard/artisan/support', icon: FaLifeRing },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [loadingUnread, setLoadingUnread] = useState(true)

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Fetch total unread messages using is_seen column
  const fetchUnreadCount = async () => {
    setLoadingUnread(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUnreadTotal(0)
        return
      }

      // Get all jobs assigned to this artisan
      const { data: jobs, error: jobsError } = await supabase
        .from('job_requests')
        .select('id')
        .eq('assigned_artisan_id', user.id)

      if (jobsError || !jobs?.length) {
        setUnreadTotal(0)
        return
      }

      const jobIds = jobs.map(j => j.id)

      let total = 0

      // Count unseen messages from admin for each job
      for (const jobId of jobIds) {
        const { count } = await supabase
          .from('admin_artisan_messages')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', jobId)
          .eq('is_seen', false)
          .neq('sender_id', user.id)   // only messages from admin

        total += count || 0
      }

      setUnreadTotal(total)
    } catch (err) {
      console.error('Unread fetch failed:', err)
      setUnreadTotal(0)
    } finally {
      setLoadingUnread(false)
    }
  }

  useEffect(() => {
    fetchUnreadCount()

    // Real-time listener for new messages
    const channel = supabase
      .channel('artisan_unread_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_artisan_messages'
      }, async (payload) => {
        const newMsg = payload.new as any

        const { data: { user } } = await supabase.auth.getUser()
        if (newMsg.sender_id === user?.id) return

        // Refresh count instead of manual increment (more accurate)
        fetchUnreadCount()

        toast('New message from admin', {
          icon: '💬',
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fbbf24',
          }
        })

        // Optional notification sound
        try {
          const audio = new Audio('/notification.mp3')
          audio.volume = 0.4
          audio.play().catch(() => {})
        } catch (e) {
          console.warn('Sound playback failed')
        }
      })
      .subscribe()

    // Refresh on focus and every 30 seconds
    window.addEventListener('focus', fetchUnreadCount)
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('focus', fetchUnreadCount)
      clearInterval(interval)
    }
  }, [])

  // When clicking Messages link - we no longer clear here (clearing happens per job in Messages page)
  const handleMessagesClick = () => {
    // Optional optimistic clear for better UX
    // setUnreadTotal(0)  // You can uncomment if you want instant feedback
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-3 left-4 z-50 bg-white p-2 text-[var(--blue)] rounded-full shadow-lg border border-[var(--orange)]"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 top-0 left-0 h-screen bg-[var(--blue)] text-[var(--white)] flex flex-col z-40 transition-all duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
        aria-label="Artisan sidebar"
      >
        <div className="px-4 h-16 flex items-center gap-2 font-semibold border-b border-[var(--orange)]">
          <div className="h-9 w-9 grid place-items-center rounded-full bg-[var(--white)] overflow-hidden">
            <Image src="/log.png" width={70} height={70} alt="Artismart logo" priority />
          </div>
          <span className="text-lg">Artismart</span>
        </div>

        <nav className="flex-1">
          <ul className="py-2">
            {nav.map(({ href, icon: Icon, label }) => {
              const isMessages = label === 'Messages'

              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={isMessages ? handleMessagesClick : undefined}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm sm:text-[15px] relative ${
                      isActive(href)
                        ? 'bg-[var(--orange)] text-[var(--white)] font-semibold shadow'
                        : 'hover:bg-[var(--orange)]/90'
                    }`}
                  >
                    <Icon className="shrink-0 text-lg" />
                    <span>{label}</span>

                    {/* Unread badge for Messages */}
                    {isMessages && unreadTotal > 0 && (
                      <span className="ml-auto bg-[var(--orange)] border border-[var(--white)] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
                        {loadingUnread ? '...' : unreadTotal > 99 ? '99+' : unreadTotal}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 text-left text-[var(--white)] hover:text-[var(--orange)] hover:bg-[var(--blue)]/90 transition-colors"
          aria-label="Logout"
        >
          <FaSignOutAlt className="text-lg" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}