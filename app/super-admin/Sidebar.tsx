'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  FaTachometerAlt,
  FaUsers,
  FaUserCog,
  FaBriefcase,
  FaTasks,
  FaCheckCircle,
  FaTimesCircle,
  FaStar,
  FaComments,
  FaWallet,
  FaChartLine,
  FaCog,
  FaBell,
  FaLifeRing,
  FaShieldAlt,
  FaTimes,
  FaBars,
  FaSignOutAlt,
  FaUserCheck,
  FaExclamationTriangle,
} from 'react-icons/fa'
import { supabase } from '@/lib/supabase'

const navItems = [
  { label: 'Dashboard', href: '/super-admin', icon: FaTachometerAlt },
  { label: 'Overview', href: '/super-admin/overview', icon: FaTachometerAlt },

  // User Management
  {
    label: 'Users',
    icon: FaUsers,
    children: [
      { label: 'All Users', href: '/super-admin/users' },
      { label: 'Customers', href: '/super-admin/customers' },
      { label: 'Artisans', href: '/super-admin/artisans' },
      { label: 'Admins', href: '/super-admin/admins' },
      { label: 'Verification', href: '/super-admin/verification', icon: FaUserCheck },
    ],
  },

  // Jobs Management
  {
    label: 'Jobs',
    icon: FaBriefcase,
    children: [
      { label: 'All Job Requests', href: '/super-admin/requests' },
      { label: 'Active Jobs', href: '/super-admin/assigned-jobs', icon: FaTasks },
      { label: 'Completed Jobs', href: '/super-admin/jobs/completed', icon: FaCheckCircle },
      { label: 'Disputed Jobs', href: '/super-admin/jobs/disputes', icon: FaExclamationTriangle },
      { label: 'Cancelled Jobs', href: '/super-admin/jobs/cancelled' },
    ],
  },

  // Finance
  {
    label: 'Finance',
    icon: FaWallet,
    children: [
      { label: 'Earnings & Revenue', href: '/super-admin/earnings' },
      { label: 'Payouts', href: '/super-admin/payouts' },
      { label: 'Transactions', href: '/super-admin/transactions' },
    ],
  },

  // Communication
  {
    label: 'Communication',
    icon: FaComments,
    children: [
      { label: 'Messages', href: '/super-admin/messages' },
      { label: 'Support Tickets', href: '/super-admin/support-tickets' },
      { label: 'Notifications', href: '/super-admin/notifications', icon: FaBell },
    ],
  },

  // Quality & Feedback
  {
    label: 'Quality',
    icon: FaStar,
    children: [
      { label: 'Reviews & Ratings', href: '/super-admin/reviews' },
      { label: 'Artisan Performance', href: '/super-admin/artisan-performance' },
    ],
  },

  // System
  {
    label: 'System',
    icon: FaCog,
    children: [
      { label: 'Analytics', href: '/super-admin/analytics', icon: FaChartLine },
      { label: 'Security & Logs', href: '/super-admin/security', icon: FaShieldAlt },
      { label: 'Platform Settings', href: '/super-admin/settings' },
      { label: 'Help & Support', href: '/super-admin/help', icon: FaLifeRing },
    ],
  },
];

export default function SuperAdminSidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [loadingUnread, setLoadingUnread] = useState(true)

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Fetch unread count (your original logic)
  const fetchUnreadCount = async () => {
    setLoadingUnread(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: jobs } = await supabase
        .from('job_requests')
        .select('id')
        .not('assigned_artisan_id', 'is', null)

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
          .neq('sender_id', user.id)

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

    const channel = supabase
      .channel('admin_unread_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_artisan_messages',
      }, () => setUnreadTotal(prev => prev + 1))
      .subscribe()

    window.addEventListener('focus', fetchUnreadCount)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('focus', fetchUnreadCount)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
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
        aria-label="Super Admin sidebar"
      >
        <div className="px-4 h-16 flex items-center gap-2 font-semibold border-b border-[var(--orange)]">
          <div className="h-9 w-9 grid place-items-center rounded-full bg-[var(--white)] overflow-hidden">
            <Image src="/log.png" width={70} height={70} alt="Artismart logo" priority />
          </div>
          <span className="text-lg">Super Admin</span>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <ul className="py-2">
            {navItems.map((item, index) => (
              <li key={index} className="px-2">
                {item.children ? (
                  // Section with children
                  <div className="mb-4">
                    <div className="flex items-center gap-3 px-4 py-2 text-[var(--white)]/70 text-sm font-medium">
                      <item.icon className="shrink-0 text-lg" />
                      <span>{item.label}</span>
                    </div>
                    <ul className="space-y-1">
                      {item.children.map((child, i) => (
                        <li key={i}>
                          <Link
                            href={child.href}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                              isActive(child.href)
                                ? 'bg-[var(--orange)] text-[var(--white)] font-semibold'
                                : 'hover:bg-[var(--orange)]/80 text-[var(--white)]/90'
                            }`}
                          >
                            {child.icon && <child.icon className="shrink-0 text-lg" />}
                            <span>{child.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  // Simple item
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                      isActive(item.href)
                        ? 'bg-[var(--orange)] text-[var(--white)] font-semibold'
                        : 'hover:bg-[var(--orange)]/80 text-[var(--white)]/90'
                    }`}
                  >
                    <item.icon className="shrink-0 text-lg" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-left text-[var(--white)] hover:text-[var(--orange)] hover:bg-[var(--blue)]/90 transition-colors border-t border-[var(--orange)]"
        >
          <FaSignOutAlt className="text-lg" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}