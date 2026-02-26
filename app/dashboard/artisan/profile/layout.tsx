'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const fetchProfileAndCalculateProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('profiles')
          .select(`
            first_name, last_name, phone,
            business_name, business_id_type, business_id_number,
            residential_address, shop_address, state, lga,
            profile_image,
            skills_categories, primary_skill, skills,
            bio, years_of_experience,
            certifications,
            verification_status,
            average_rating,
            association_name, association_address,
            work_location
          `)
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Profile fetch error:', error)
          return
        }

        if (data) {
          let score = 0

          // ─── Personal / Basic (20 points) ───
          if (data.first_name?.trim() && data.last_name?.trim()) score += 8
          if (data.phone?.trim().length >= 10) score += 6
          if (data.profile_image?.trim()) score += 6

          // ─── Business & Identification (25 points) ───
          if (data.business_name?.trim()) score += 8
          if (data.business_id_type && data.business_id_number?.trim()) score += 10
          if (data.association_name?.trim()) score += 7

          // ─── Addresses & Work Location (20 points) ───
          if (data.residential_address?.trim() && data.state?.trim() && data.lga?.trim()) score += 8
          if (data.shop_address?.trim()) score += 7
          if (data.work_location?.trim()) score += 5

          // ─── Skills & Professional Experience (20 points) ───
          const hasSkills =
            (Array.isArray(data.skills_categories) && data.skills_categories.length > 0) ||
            data.primary_skill?.trim() ||
            (typeof data.skills === 'string' && data.skills.trim().length > 0)

          if (hasSkills) score += 12
          if (typeof data.years_of_experience === 'number' && data.years_of_experience >= 0) score += 8

          // ─── Bio, Certifications, Verification & Rating (15 points) ───
          if (data.bio?.trim().length >= 30) score += 5
          if (data.certifications?.trim()) score += 5
          if (data.verification_status === 'approved') score += 10
          if (typeof data.average_rating === 'number' && data.average_rating > 0) score += 5

          // Final progress — round and cap at 100
          const calculated = Math.min(Math.round(score), 100)
          setProgress(calculated)
        } else {
          setProgress(0)
        }
      } catch (err) {
        console.error('Progress calculation error:', err)
        setProgress(0)
      }
    }

    fetchProfileAndCalculateProgress()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        fetchProfileAndCalculateProgress()
      } else {
        setProgress(0)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const circleCircumference = 2 * Math.PI * 40
  const offset = circleCircumference - (circleCircumference * progress) / 100

  return (
    <div className="font-roboto  flex flex-col bg-[var(--blue)]/20 ">
      <div className="flex flex-col sm:flex-1 ">
        {/* MAIN CONTENT – takes 4fr on sm+, scrollable */}
        <main className="flex-1 ">
          <div className=" p-2 md:p-3 lg:p-3 ">
            {children}
          </div>
        </main>

        {/* RIGHT SIDEBAR – takes 1fr on sm+, full height */}
        <aside
          className="
             sm:flex flex-col
            bg-[var(--white)]
            border-l border-[var(--orange)]/30
            w-full max-w-[340px] 
            
          "
        >
          <div className="flex-1 p-3 lg:p-3 flex flex-col">
            <div className="bg-[var(--blue)] rounded-2xl shadow-lg border border-[var(--orange)]/20 p-1 lg:p-8 flex flex-col items-center text-center ">
              {/* Progress Circle */}
              <div className="relative w-40 h-40 lg:w-44 lg:h-44 mb-6 lg:mb-8">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-[var(--orange)]"
                    strokeWidth="12"
                    stroke="currentColor"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-[var(--orange)] transition-all duration-1000 ease-out"
                    strokeWidth="12"
                    strokeDasharray={circleCircumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl lg:text-4xl font-bold text-[var(--orange)]">
                    {progress}%
                  </span>
                </div>
              </div>

              <h3 className="text-lg lg:text-xl font-semibold text-[var(--white)] mb-2 lg:mb-2">
                Profile Completion
              </h3>

              <p className="text-sm text-[var(--white)] mb-6 lg:mb-8 px-2">
                {progress === 100
                  ? 'Great job! Your profile is complete.'
                  : 'Keep going! Add more details to attract more clients.'}
              </p>

              <ul className="w-full text-left space-y-3 lg:space-y-4 text-xs lg:text-sm">
                <li className={`flex items-center gap-3 ${progress >= 20 ? 'text-green-600' : 'text-[var(--white)]'}`}>
                  <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold shrink-0">
                    {progress >= 20 ? '✓' : '1'}
                  </span>
                  Basic Info & Photo
                </li>
                <li className={`flex items-center gap-3 ${progress >= 50 ? 'text-green-600' : 'text-[var(--white)]'}`}>
                  <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold shrink-0">
                    {progress >= 50 ? '✓' : '2'}
                  </span>
                  Business & Skills
                </li>
                <li className={`flex items-center gap-3 ${progress >= 80 ? 'text-green-600' : 'text-[var(--white)]'}`}>
                  <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold shrink-0">
                    {progress >= 80 ? '✓' : '3'}
                  </span>
                  Location & Bio
                </li>
                <li className={`flex items-center gap-3 ${progress === 100 ? 'text-green-600' : 'text-[var(--white)]'}`}>
                  <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold shrink-0">
                    {progress === 100 ? '✓' : '4'}
                  </span>
                  Verification & Rating
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default DashboardLayout