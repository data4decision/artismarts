'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { FaBell, FaCaretDown, FaCog, FaSignOutAlt, FaUser } from 'react-icons/fa'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import AdminNotificationBell from '@/components/AdminNotificationBell'

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

export default function ClientHeader() {
  const router = useRouter()
  const pathname = usePathname()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const verificationChannelRef = useRef<RealtimeChannel | null>(null)

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
    router.push('/admin-login')
  }

  // // Handle notification bell click
  const handleBellClick = () => {
    router.push('/admin-dashboard/verification')

    setTimeout(() => {
      fetchPendingCount()
    }, 800
  ) // Reset count on click
  }

  // Fetch initial pending count
  const fetchPendingCount = async () => {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending')

    if (error) {
      console.error(error)
      return
    }

    setPendingCount(count || 0)
  } catch (err) {
    console.error('Unexpected error fetching pending count:', err)
  }
}
  // Real-time subscription for pending verifications
  const setupVerificationSubscription = () => {
    if (verificationChannelRef.current) {
      supabase.removeChannel(verificationChannelRef.current)
    }

     const channel = supabase
     .channel('pending_artisan_verifications')
     .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: 'verification_status=eq.pending',
      },
    
  
  (payload) => {
    console.log ('verification change recieved:', payload)
    fetchPendingCount()
  }
).subscribe()

verificationChannelRef.current = channel
  }

  const fetchProfile = async () => {
  try {
    setIsLoading(true)

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      router.replace('/admin-login')
      return
    }

    const email = user.email || 'No email provided'

    const { data: profileRow, error } = await supabase
      .from('admin_profiles') // ✅ FIXED
      .select('first_name, last_name, role, phone, residential_address, state, lga, profile_image')
      .eq('id', user.id)
      .single() // ✅ better than maybeSingle

    if (error) {
      console.error('Profile fetch error:', error)
    }

    const fullName = profileRow
      ? `${profileRow.first_name || ''} ${profileRow.last_name || ''}`.trim()
      : 'Admin'

    setProfile({
      full_name: fullName || 'Admin',
      email,
      role: profileRow?.role ?? null,
      phone: profileRow?.phone ?? null,
      residential_address: profileRow?.residential_address ?? null,
      state: profileRow?.state ?? null,
      lga: profileRow?.lga ?? null,
      profile_image: profileRow?.profile_image ?? null,
    })

  } catch (err) {
    console.error('Unexpected error:', err)
    setProfile(null)
  } finally {
    setIsLoading(false)
  }
}

  useEffect(() => {
  fetchProfile()
  fetchPendingCount()
  setupVerificationSubscription()

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
    if (session?.user) {
      fetchProfile()
      fetchPendingCount()
    } else {
      setProfile(null)
      setIsLoading(false)
      setPendingCount(0)
    }
  })

  return () => {
    subscription.unsubscribe()
    if (verificationChannelRef.current) {
      supabase.removeChannel(verificationChannelRef.current)
    }
  }
}, [pathname])
    useEffect(() => {
  let profileChannel: RealtimeChannel | null = null

  const setupRealtime = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    profileChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin-profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setProfile(prev => prev ? { ...prev, ...payload.new } : null)
        }
      )
      .subscribe()
  }

  setupRealtime()

  const handleFocus = () => fetchProfile()
  window.addEventListener('focus', handleFocus)

  return () => {
    if (profileChannel) {
      supabase.removeChannel(profileChannel)
    }
    window.removeEventListener('focus', handleFocus)
  }
}, [pathname])
  const displayName = isLoading ? 'Loading...' : profile?.full_name || 'User'
  const displayEmail = isLoading ? 'Loading...' : profile?.email || 'No email provided'
  const avatarUrl = profile?.profile_image || '/default-avatar.png'

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 border-b border-[var(--orange)]/80 bg-[var(--blue)] text-[var(--white)] shadow-sm">
      <h1 className="text-lg font-semibold sm:ml-0 ml-10 md:ml-64">
        {/* <FaBell/> */}
      </h1>

      <div className="relative" ref={dropdownRef}>
        <div className="flex gap-2 items-center">
          <AdminNotificationBell/>
          <button onClick={handleBellClick} className="relative p-2 hover:bg-[var(--orange)]/20 rounded-md transition-colors hover:text-[var(--orange)] cursor-pointer">
            <FaBell className='text-xl'/>
            {pendingCount > 0 && (
              <span className="absolute top-1 left-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
              
          </button>
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
        </div>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-[var(--white)] text-[var(--blue)] rounded-md shadow-lg z-50">
            <div className="p-3 border-b">
              <p className="font-semibold">{displayName}</p>
              <p className="text-sm opacity-80 break-words">{displayEmail}</p>
            </div>

            <ul className="py-1">
              <li>
                <Link
                  href="/dashboard/customer/profile"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--blue)]/10 text-[var(--blue)]"
                >
                  <FaUser /> Profile
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/customer/settings"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--blue)]/10 text-[var(--blue)]"
                >
                  <FaCog /> Settings
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-[var(--blue)]/10 text-[var(--blue)]"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  )
}