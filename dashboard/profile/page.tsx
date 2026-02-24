'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'  // ← ensures type is available

import ProfileHeader from '@/components/artisan-profile/ProfileHeader'
import ProfileEditForm from '@/components/artisan-profile/ProfileEditForm'
import BioSection from '@/components/artisan-profile/BioSection'
import RatingDisplay from '@/components/artisan-profile/RatingDisplay'
import VerificationBadge from '@/components/artisan-profile/VerificationBadge'
// import SkillsSection from '@/components/artisan-profile/SkillsSection'
// import AvailabilitySection from '@/components/artisan-profile/AvailabilitySection'
import PortfolioSection from '@/components/artisan-profile/PortfolioSection'
import ReviewSection from '@/components/artisan-profile/ReviewSection'

// Define the item structure
interface PortfolioItem {
  url: string
  name: string
  type: string
  uploaded_at: string
}

// Full profile interface with correct types
interface ArtisanProfile {
  id: string | null
  first_name: string | null
  last_name: string | null
  business_name: string | null
  primary_skill: string | null
  skills: string | null
  residential_address: string | null
  state: string | null
  lga: string | null
  profile_image: string | null
  phone: string | null
  verification_status: 'verified' | 'pending' | 'not_verified' | null
  average_rating: number | null
  rating_count: number | null
  bio: string | null
  working_days: string | null
  available_time_slots: string | null
  next_available_date: string | null
  portfolio_items: PortfolioItem[] | null
}

export default function ArtisanProfilePage() {
  const [profile, setProfile] = useState<ArtisanProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    let channel: RealtimeChannel | null = null  // ← correct type (not any or unknown)

    const setupProfile = async () => {
      setIsLoading(true)

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error('Please sign in')
          return
        }

        // Fetch profile with portfolio_items included
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id, first_name, last_name, business_name, primary_skill, skills,
            residential_address, state, lga, profile_image, phone,
            verification_status, average_rating, rating_count, bio,
            working_days, available_time_slots, next_available_date,
            portfolio_items
          `)
          .eq('id', user.id)
          .maybeSingle()

        if (error) throw error

        setProfile(data)

        if (!data) {
          setIsEditing(true)
          return
        }

        // Realtime subscription for profile updates
        channel = supabase
          .channel(`profile:${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`
            },
            (payload) => {
              setProfile(prev => {
                if (!prev) return prev
                return { ...prev, ...payload.new } as ArtisanProfile
              })
            }
          )
          .subscribe()
      } catch (err: unknown) {
        console.error('Profile load error:', err)
        toast.error('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    setupProfile()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)  // ← types correctly now
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
        <div className="text-[var(--blue)] text-lg animate-pulse">Loading profile...</div>
      </div>
    )
  }

  if (!profile && !isEditing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--white)] p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Profile not found</h2>
          <button
            onClick={() => setIsEditing(true)}
            className="bg-[var(--orange)] text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition"
          >
            Create Profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <ProfileHeader
          profile={profile}
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
        />

        {isEditing ? (
          <div className="mt-10">
            <ProfileEditForm
              initialData={profile}
              onSave={(updated) => {
                setProfile(updated as ArtisanProfile)
                setIsEditing(false)
              }}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : (
          <div className="space-y-10 mt-10">
            {/* About */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-[var(--blue)]">About</h2>
                <VerificationBadge 
                  status={profile?.verification_status ?? null}
                />
              </div>
              <BioSection bio={profile?.bio} />
            </div>

            {/* Reputation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-[var(--blue)] mb-6">Reputation</h2>
              <RatingDisplay
                average={profile?.average_rating}
                count={profile?.rating_count}
              />
            </div>

            {/* <SkillsSection skills={profile?.skills} />

            <AvailabilitySection
              workingDays={profile?.working_days}
              timeSlots={profile?.available_time_slots}
              nextAvailable={profile?.next_available_date}
            /> */}

            {/* Portfolio – safe fallback to empty array */}
            <PortfolioSection 
              items={profile?.portfolio_items ?? []} 
            />

            <ReviewSection artisanId={profile?.id ?? ''} />
          </div>
        )}
      </div>
    </div>
  )
}