'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {supabase} from '@/lib/supabase'

// Define the shape of the profile
interface Profile {
  full_name: string | null
}

// Quick action card props type
interface QuickActionCardProps {
  title: string
  description: string
  icon: string
  href: string
}

export default function CustomerDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)



        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          // Redirect to login if not authenticated
          window.location.href = '/login'
          return
        }

        const { data: profileRow, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle()

        let fullName = 'User'

        if (profileError) {
          console.error('Profile fetch error:', profileError.message)
        } else if (profileRow) {
          fullName = [profileRow.first_name, profileRow.last_name]
            .filter(Boolean)
            .join(' ')
            .trim() || 'User'
        }

        setProfile({ full_name: fullName })
      } catch (err) {
        console.error('Unexpected error fetching profile:', err)
        setProfile(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const displayName = isLoading
    ? 'Loading...'
    : profile?.full_name || 'Guest'

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
  <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[var(--blue)] border-solid"></div>
  <p className="text-xl text-[var(--blue)]">Loading your dashboard...</p>
</div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--blue)/20 p-4 ">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero / Welcome section */}
        <div className="bg-[var(--blue)] text-[var(--white)] p-6 sm:p-8 rounded-xl w-full">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Hello, Welcome {displayName}!
          </h1>
          <p className="mt-2 opacity-90 text-sm sm:text-base">
            Find and book trusted artisans near you with Artismart
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          <QuickActionCard
            title="Browse Artisans"
            description="Find skilled professionals"
            icon="🔍"
            href="/dashboard/customer/artisans"
          />
          <QuickActionCard
            title="My Bookings"
            description="View upcoming & past jobs"
            icon="📅"
            href="/dashboard/customer/bookings"
          />
          <QuickActionCard
            title="Messages"
            description="Make Enquiries"
            icon="💬"
            href="/dashboard/customer/messages"
          />
          <QuickActionCard
            title="Payments"
            description="Manage transactions"
            icon="💳"
            href="/dashboard/customer/payments"
          />
        </div>

        {/* You can add more sections here later */}
      </div>
    </div>
  )
}

// Quick action card component (now typed)
function QuickActionCard({
  title,
  description,
  icon,
  href,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="block bg-white p-5 sm:p-6 rounded-xl shadow hover:shadow-lg transition-all duration-200 border border-[var(--orange)] hover:border-[var(--orange)]/40 group"
    >
      <div className="text-3xl sm:text-4xl mb-3">{icon}</div>
      <h3 className="font-semibold text-base sm:text-lg group-hover:text-[var(--blue)] text-[var(--orange)] transition-colors">
        {title}
      </h3>
      <p className="text-sm text-[var(--blue)] mt-1">{description}</p>
    </Link>
  )
}