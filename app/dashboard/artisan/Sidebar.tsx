// app/dashboard/artisan/Sidebar.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
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
} from 'react-icons/fa'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

// Logout handler
const logout = () => {
  console.log('Logging out...')
  window.location.href = '/login'
}

const nav = [
  { label: 'Dashboard', href: '/dashboard/artisan', icon: FaTachometerAlt },
  { label: 'Profile', href: '/dashboard/artisan/profile', icon: FaUser },
  { label: 'Verification', href: '/dashboard/artisan/verification', icon: FaIdCard },
  { label: 'Job Requests', href: '/dashboard/artisan/requests', icon: FaBriefcase },
  { label: 'Assigned Jobs', href: '/dashboard/artisan/assigned-jobs', icon: FaBriefcase },
  { label: 'Active Jobs', href: '/dashboard/artisan/jobs', icon: FaTasks },
  { label: 'Messages', href: '/dashboard/artisan/messages', icon: FaComments },
  { label: 'Earnings', href: '/dashboard/artisan/earnings', icon: FaWallet },
  { label: 'Reviews', href: '/dashboard/artisan/reviews', icon: FaStar },
  { label: 'Availability', href: '/dashboard/artisan/availability', icon: FaCalendarAlt },
  { label: 'Notifications', href: '/dashboard/artisan/notifications', icon: FaBell },
  { label: 'Support', href: '/dashboard/artisan/support', icon: FaLifeRing },
];

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [loadingUnread, setLoadingUnread] = useState(true)
  const prevUnreadRef = useRef(0) // to detect increases

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Fetch initial unread count
  const fetchUnreadCount = async () => {
    setLoadingUnread(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: jobs } = await supabase
        .from('job_requests')
        .select('id')
        .eq('assigned_artisan_id', user.id)
        .in('status', ['assigned', 'in_progress', 'completed'])

      if (!jobs?.length) {
        setUnreadTotal(0)
        return
      }

      const jobIds = jobs.map(j => j.id)

      const { data: readStatuses } = await supabase
        .from('user_job_read_status')
        .select('job_id, last_read_at')
        .eq('user_id', user.id)
        .in('job_id', jobIds)

      const readMap = new Map(readStatuses?.map(r => [r.job_id, r.last_read_at]) || [])

      let total = 0

      for (const jobId of jobIds) {
        const lastRead = readMap.get(jobId)
        let query = supabase
          .from('admin_artisan_messages')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', jobId)
          .neq('sender_id', user.id) // from admin

        if (lastRead) {
          query = query.gt('created_at', lastRead)
        }

        const { count } = await query
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

    // Real-time: new message from admin → increment badge + toast + sound
    const channel = supabase
      .channel('artisan_unread_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_artisan_messages'
      }, async (payload) => {
        const newMsg = payload.new as any

        const { data: { user } } = await supabase.auth.getUser()
        // Only react if message is from admin (not self)
        if (newMsg.sender_id !== user?.id) {
          setUnreadTotal(prev => {
            const newTotal = prev + 1

            // Show toast
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

            // Play subtle notification sound (browser beep fallback)
            try {
              const audio = new Audio('/notification.mp3') // ← place a short .mp3 file in /public
              audio.volume = 0.4
              audio.play().catch(() => {
                // Fallback to simple beep if audio fails
                const beep = new AudioContext()
                const osc = beep.createOscillator()
                osc.type = 'sine'
                osc.frequency.setValueAtTime(800, beep.currentTime)
                osc.connect(beep.destination)
                osc.start()
                osc.stop(beep.currentTime + 0.15)
              })
            } catch (e) {
              console.warn('Sound playback failed:', e)
            }

            return newTotal
          })
        }
      })
      .subscribe()

    // Periodic + focus refresh
    window.addEventListener('focus', fetchUnreadCount)
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('focus', fetchUnreadCount)
      clearInterval(interval)
    }
  }, [])

  // Optimistic badge clear on Messages click
  const handleMessagesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname.startsWith('/dashboard/artisan/messages')) return
    setUnreadTotal(0) // optimistic UI
  }

  return (
    <>
      {/* Mobile hamburger */}
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
                <li key={href} className="relative">
                  <Link
                    href={href}
                    onClick={isMessages ? handleMessagesClick : undefined}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm sm:text-[15px] ${
                      isActive(href)
                        ? 'bg-[var(--orange)] text-[var(--white)] font-semibold shadow'
                        : 'hover:bg-[var(--orange)]/90'
                    }`}
                    aria-current={isActive(href) ? 'page' : undefined}
                  >
                    <Icon className="shrink-0 text-lg" />
                    <span className="text-sm sm:text-[12px]">{label}</span>

                    {/* Unread badge */}
                    {isMessages && unreadTotal > 0 && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
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
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}