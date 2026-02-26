'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  FaTachometerAlt,
  FaUser,
  FaSearch,
  FaBriefcase,
  FaClipboardList,
  FaComments,
  FaCreditCard,
  FaStar,
  FaBell,
  FaLifeRing,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from 'react-icons/fa'

// Logout handler
const logout = () => {
  console.log('Logging out...')
  window.location.href = '/login'
}

const nav = [
  { label: 'Dashboard', href: '/dashboard/custom', icon: FaTachometerAlt },
  { label: 'Profile', href: '/dashboard/custom/profile', icon: FaUser },
  { label: 'Browse Artisans', href: '/dashboard/custom/artisans', icon: FaSearch },
  { label: 'My Bookings', href: '/dashboard/custom/bookings', icon: FaClipboardList },
  { label: 'Booking Requests', href: '/dashboard/custom/requests', icon: FaBriefcase },
  { label: 'Messages', href: '/dashboard/custom/messages', icon: FaComments },
  { label: 'Payments', href: '/dashboard/custom/payments', icon: FaCreditCard },
  { label: 'Reviews', href: '/dashboard/customer/reviews', icon: FaStar },
  { label: 'Notifications', href: '/dashboard/custom/notifications', icon: FaBell },
  { label: 'Support', href: '/dashboard/custom/support', icon: FaLifeRing },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (href: string) => pathname === href



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

      {/* Sidebar – fixed on desktop, drawer on mobile */}
      <aside
      
       className={`fixed md:static inset-y-0 top-0 left-0 h-screen bg-[var(--blue)] text-[var(--white)] flex flex-col z-40 transition-all duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 `}
       aria-label="Customer sidebar"
     >
        <div className="px-4 h-16 flex items-center gap-2 font-semibold border-b border-[var(--orange)]">
         <div className="h-9 w-9 grid place-items-center rounded-full bg-[var(--white)] overflow-hidden">
           <Image src="/log.png" width={70} height={70} alt="Artismart logo" priority />
         </div>
        <span className="text-lg">Artismart</span>
       </div>
        <nav className="flex-1">
         <ul className="py-2">
           {nav.map(({ href, icon: Icon, label }) => (
             <li key={href}>
               <Link
                 href={href}
                 className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm sm:text-[15px] ${
                   isActive(href)
                     ? 'bg-[var(--orange)] text-[var(--white)] font-semibold shadow'
                     : 'hover:bg-[var(--orange)]/90'
                 }`}
                 aria-current={isActive(href) ? 'page' : undefined}
               >
                 <Icon className="shrink-0 text-lg" />
                 <span className="text-sm sm:text-[12px]">{label}</span>
               </Link>
             </li>
           ))}
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

      {/* Overlay when mobile menu is open */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0   z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}