'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FaEdit, FaUserCircle } from 'react-icons/fa'

interface ProfileData {
  first_name?: string | null
  last_name?: string | null
  business_name?: string | null
  primary_skill?: string | null
  phone?: string | null
  residential_address?: string | null
  state?: string | null
  lga?: string | null
  profile_image?: string | null
}

export default function ArtisanProfileView() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error('Please sign in')
          router.push('/login')
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, business_name, primary_skill, phone, residential_address, state, lga, profile_image')
          .eq('id', user.id)
          .single()

        if (error) throw error

        setProfile(data || {})
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Could not load profile'
        console.error(errorMessage, err)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
  <div className="relative flex items-center justify-center">
    {/* Outer spinning ring */}
    <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-md"></div>

    {/* Inner static logo with subtle pulse */}
    <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
      <div className="bg-[var(--white)] rounded-full p-2 shadow-sm">
        <Image
          src="/log.png"
          width={48}
          height={48}
          priority
          alt="Loading..."
          className="object-contain"
        />
      </div>
    </div>
  </div>
</div>
    )
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Artisan'
  const hasAnyData = Object.values(profile).some(v => !!v)

  return (
    <div className=" bg-gray-50 py-3 md:pt-4">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          {/* Taller banner with dark gradient like LinkedIn header */}
          <div className="relative h-36 md:h-44 lg:h-52 bg-gradient-to-br from-[var(--blue)]/80 via-[var(--orange)]/80 to-[var(--blue)]/80">
            <div className="absolute inset-0 bg-black/40"></div> {/* dark overlay for contrast */}

            {/* Name + business/skill positioned like LinkedIn banner text */}
            <div className="absolute bottom-4 md:bottom-5 right-0  md:right-50 z-10 text-white">
              <h1 className="text-[12px] md:text-xl lg:text-[20px] font-bold tracking-tight drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
                {fullName}
              </h1>

              {profile.business_name && (
                <p className="text-[12px] md:text-[20px] font-semibold mt-1 drop-shadow-md">
                  {profile.business_name}
                </p>
              )}

              {profile.primary_skill && (
                <p className="text-[12px] md:text-[20px] mt-1 opacity-90 drop-shadow-sm">
                  <span className="font-semibold min-w-[90px] text-right">Skills: </span>
                  {profile.primary_skill}
                </p>
              )}
              {profile.phone && (
                  <div className="text-[12px] md:text-[15px]  mt-1 drop-shadow-md">
                    <span className="font-semibold min-w-[90px] text-right">Phone:</span>
                    <span className="font-medium">{profile.phone}</span>
                  </div>
                )}
                {(profile.state || profile.lga) && (
                  <div className="text-[12px] md:text-[15px]  mt-1 drop-shadow-md">
                    <span className="font-semibold min-w-[90px] text-right">Location:</span>
                    <span>{[profile.lga, profile.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                 {profile.residential_address && (
                  <div className="text-[10px] md:text-[15px]  mt-1 drop-shadow-md break-words">
                    <span className="font-semibold min-w-[90px] text-right ">Address:</span>
                    <span className="text-[12px] md:text-[15px] text-[var(--white)] italic text-base break-words px-2">
                      (private) {profile.residential_address}
                    </span>
                  </div>
                )}
                {!hasAnyData && !profile.business_name && !profile.primary_skill && (
                  <p className="mt-8 text-gray-500 italic text-center md:text-left">
                    Profile information will appear here after you complete it.
                  </p>
                )}
              </div>
            </div>
            
          </div>

          {/* Profile picture overlapping banner bottom edge */}
          <div className="relative px-6 md:px-10 -mt-20 md:-mt-28 pb-12 ">
            <div className="flex flex-col md:flex-row md:items-start gap-8 lg:gap-12">
              <div className="flex flex-col sm:items-center md:items-start flex-shrink-0">
                <div className="relative w-23 h-23 mt-6 mr-4 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-full overflow-hidden border-[10px] border-white shadow-2xl ring-1 ring-gray-200/50 bg-white">
                  {profile.profile_image ? (
                    <Image
                      src={profile.profile_image}
                      alt={fullName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 160px, (max-width: 1024px) 192px, 224px"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/20 to-indigo-900/20 text-white/30">
                      <FaUserCircle className="text-9xl md:text-[12rem]" />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => router.push('/dashboard/artisan/profile/edit')}
                  className="absolute md:right-2  md:bottom-75 mt-6 flex items-center gap-2 px-2.5 py-2.5 bg-[var(--orange)] text-white rounded-full font-medium text-base hover:bg-opacity-90 transition shadow-md"
                >
                  <FaEdit />
                 
                </button>
              </div> 
          </div>
        </div>
      </div>
    </div>
  )
}