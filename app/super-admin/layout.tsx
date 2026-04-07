'use client'

import React, { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from './Sidebar'                    // Your SuperAdminSidebar component
import Image from 'next/image'
import Link from 'next/link'
import { FaCaretDown, FaCog, FaSignOutAlt, FaUser } from 'react-icons/fa'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface Profile {
  full_name: string | null
  email: string | null
  role: string | null
  phone?: string | null
  residential_address?: string | null
  state?: string | null
  lga?: string | null
  profile_image?: string | null  
} 

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function SuperAdminLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const fetchProfile = async () => {
    try {
      setIsLoading(true)

      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.warn('No authenticated user found')
        router.replace('/login')
        return
      }

      const email = user.email ?? 'No email'

      // Fetch from super_admin_profiles table
      const { data: profileRow, error: profileError } = await supabase
        .from('super_admin_profiles')
        .select('first_name, last_name, role, phone, residential_address, state, lga, profile_image')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
      }

      let fullName = 'Super Admin'
      let role: string | null = null
      let phone: string | null = null
      let residential_address: string | null = null
      let state: string | null = null
      let lga: string | null = null
      let profile_image: string | null = null

      if (profileRow) {
        fullName = [profileRow.first_name, profileRow.last_name]
          .filter(Boolean)
          .join(' ')
          .trim() || 'Super Admin'

        role = profileRow.role ?? null
        phone = profileRow.phone ?? null
        residential_address = profileRow.residential_address ?? null
        state = profileRow.state ?? null
        lga = profileRow.lga ?? null
        profile_image = profileRow.profile_image ?? null
      }

      setProfile({
        full_name: fullName,
        email,
        role,
        phone,
        residential_address,
        state,
        lga,
        profile_image,
      })
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err)
      setProfile({
        full_name: 'Super Admin',
        email: 'admin@platform.com',
        role: 'super_admin',
        phone: null,
        residential_address: null,
        state: null,
        lga: null,
        profile_image: null,
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()

    // Auth state change listener
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        fetchProfile()
      } else {
        setProfile(null)
        setIsLoading(false)
      }
    })

    // Realtime profile changes from super_admin_profiles
    let profileChannel: RealtimeChannel | null = null

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      profileChannel = supabase
        .channel('super_admin_profiles_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'super_admin_profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Realtime super admin profile update received:', payload.new)
            
            setProfile(prev => {
              if (!prev) return null
              return {
                ...prev,
                full_name: [payload.new.first_name, payload.new.last_name].filter(Boolean).join(' ') || prev.full_name,
                role: payload.new.role ?? prev.role,
                phone: payload.new.phone ?? prev.phone,
                residential_address: payload.new.residential_address ?? prev.residential_address,
                state: payload.new.state ?? prev.state,
                lga: payload.new.lga ?? prev.lga,
                profile_image: payload.new.profile_image ?? prev.profile_image,
              }
            })
          }
        )
        .subscribe()
    }

    setupRealtime()

    // Refresh on window focus
    const handleRouteChange = () => fetchProfile()
    window.addEventListener('focus', handleRouteChange)

    return () => {
      authSubscription.unsubscribe()
      if (profileChannel) supabase.removeChannel(profileChannel)
      window.removeEventListener('focus', handleRouteChange)
    }
  }, [pathname])

  const displayName = isLoading ? 'Loading...' : profile?.full_name || 'Super Admin'
  const displayEmail = isLoading ? 'Loading...' : profile?.email || 'admin@platform.com'
  const avatarUrl = profile?.profile_image || '/default-avatar.png'

  return (
    <div className="font-roboto flex flex-col h-screen">
      <header className="fixed top-0 left-0 right-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 border-b border-[var(--orange)]/80 bg-[var(--blue)] text-[var(--white)] shadow-sm">
        <h1 className="text-lg font-semibold sm:ml-0 ml-10 md:ml-64">
          Super Admin Portal
        </h1>

        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 hover:bg-[var(--orange)]/90 p-2 rounded-md transition-colors"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="User profile"
          >
            <div className="h-8 w-8 rounded-full bg-[var(--white)] overflow-hidden relative">
              <Image
                src={avatarUrl}
                alt="Profile photo"
                fill
                className="object-cover"
                sizes="32px"
                priority
              />
            </div>

            <span className="text-sm font-medium hidden sm:block">{displayName}</span>

            <FaCaretDown
              className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[var(--white)] text-[var(--blue)] rounded-md shadow-lg z-50 overflow-hidden">
              <div className="p-4 border-b">
                <p className="font-semibold">{displayName}</p>
                <p className="text-sm opacity-80 break-words">{displayEmail}</p>
                {profile?.role && (
                  <p className="text-xs text-[var(--orange)] mt-1 font-medium">Super Admin</p>
                )}
              </div>

              <ul className="py-1">
                <li>
                  <Link
                    href="/super-admin/profile"
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-100 text-[var(--blue)]"
                  >
                    <FaUser /> Profile
                  </Link>
                </li>
                <li>
                  <Link
                    href="/super-admin/settings"
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-100 text-[var(--blue)]"
                  >
                    <FaCog /> Settings
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2.5 hover:bg-gray-100 text-red-600"
                  >
                    <FaSignOutAlt /> Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 pt-16 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto bg-gray-50/70">
          <div className="min-h-full p-4 md:p-6 lg:p-8">
            <div className="md:hidden h-4" />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}