'use client'
import React, {useState, useRef, useEffect} from 'react'
import Sidebar from './Sidebar'
import Image from 'next/image'
import Link from 'next/link'
import {FaCaretDown, FaCog, FaSignOutAlt, FaUser} from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

export default function DashboardLayout({ children }: DashboardLayoutProps) {

    const router = useRouter()
   const [profile, setProfile] = useState<Profile | null>(null)
   const [isLoading, setIsLoading] = useState(true)
   const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown on outside click
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

      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, role, phone, residential_address, state, lga, profile_image')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
      }

      let fullName = 'User'
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
          .trim() || 'User'

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
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()

    // Listen for auth changes + profile updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile()
      } else {
        setProfile(null)
        setIsLoading(false)
      }
    })

    // Optional: Realtime subscription to profiles table (updates avatar instantly when changed)
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${supabase.auth.getUser().then(r => r.data.user?.id)}`,
        },
        (payload) => {
          if (payload.new.profile_image) {
            setProfile(prev => prev ? { ...prev, profile_image: payload.new.profile_image } : null)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [router])

    const displayName = isLoading ? 'Loading...' : profile?.full_name || 'User'
  const displayEmail = isLoading ? 'Loading...' : profile?.email || 'No email provided'
  const avatarUrl = profile?.profile_image || '/default-avatar.png'
  return (
    <div className="font-roboto">
        <div className="flex min-h-screen">
      
        <Sidebar />
        <div
        className='flex-1 flex flex-col  overflow-x-hidden'>
            <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--orange)]/80 bg-[var(--blue)] text-[var(--white)] shadow-sm w-full">
           <h1 className="text-lg font-semibold sm:ml-0 ml-10">
             {/* {displayName} */}
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

               <span className="text-sm font-medium">{displayName}</span>

              <FaCaretDown
                className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

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
        <main className="flex-1 p-4 md:p-6 lg:p-8 ">
          {/* Spacer for mobile header area */}
          <div className="md:hidden h-16" />
          {children}
        </main>
        </div>
      </div>
    </div>
  )
}