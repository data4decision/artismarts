'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  
  
  FaBars,
  FaTimes,
} from 'react-icons/fa'

const navItems = [
  { label: 'Profile Information', href: '/dashboard/custom/profile' },
  { label: 'Account Login Details', href: '/dashboard/custom/profile/account-login' },
  { label: 'Account Preferences', href: '/profile/custom/artisans' },
  { label: 'Security & Privacy', href: '/profile/custom/bookings' },
  { label: 'Saved Artisans / Favorites', href: '/profile/custom/requests' },
  { label: 'Payment Information', href: '/profile/custom/messages' },
  { label: 'Account Status', href: '/profile/custom/payments' },
  { label: 'Account Actions', href: '/profile/custom/reviews' },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (href: string) => pathname === href

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile hamburger button */}
      <button
        className="md:hidden  top-8 right-12 z-50 bg-white p-2 rounded-lg shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-screen">
        {/* Sidebar – fixed on desktop, drawer on mobile */}
        <aside
          className={`
            fixed md:static inset-y-0 left-0 z-40 w-52 bg-[var(--white)] border-[var(--blue)] hover:border-[var(--blue)] text-[var(--blue)]
            transform transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
          `}
        >
          {/* <div className="p-6 border-b border-orange-600">
            <h2 className="text-xl font-bold">Menu</h2>
          </div> */}

          <nav className="mt-4 px-3">
            <ul className="space-y-1">
              {navItems.map(({ href,  label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm
                      ${isActive(href)
                        ? 'bg-[var(--orange)]/20 font-semibold border border-[var(--orange)]'
                        : 'hover:bg-[var(--blue)]/10 border border-[var(--blue)]'}
                    `}
                  >
                    {/* <Icon className="text-lg shrink-0" /> */}
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {/* Optional top padding for mobile when menu is closed */}
          <div className="md:hidden h-16" />
          {children}
        </main>
      </div>

      {/* Overlay when mobile menu is open */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}