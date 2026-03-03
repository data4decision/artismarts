

// import React from 'react'
// import ProfileHeader from '@/components/artisan-profile/ProfileHeader'
// import BioAvailability from '@/components/artisan-profile/BioAvailability'
// import SkillsSection from '@/components/artisan-profile/SkillsSection'
// import PortfolioSection from '@/components/artisan-profile/PortfolioSection'
// import Certification from '@/components/artisan-profile/Certification'

// const page = () => {
//   return (
//     <div>
//       <ProfileHeader/>
//       <BioAvailability/>
//       <SkillsSection/>
//       <PortfolioSection/>
//       <Certification/>
//     </div>
//   )
// }

// export default page

'use client'

import { useEffect, useState } from 'react'
import ProfileHeader from '@/components/artisan-profile/ProfileHeader'
import BioAvailability from '@/components/artisan-profile/BioAvailability'
import SkillsSection from '@/components/artisan-profile/SkillsSection'
import PortfolioSection from '@/components/artisan-profile/PortfolioSection'
import Certification from '@/components/artisan-profile/Certification'
import Image from 'next/image'

export default function ArtisanProfilePage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800) // ← remove this in real app - just for demo

    // Option B: Wait for actual data (preferred)
    // Promise.all([
    //   fetchProfileData(),
    //   fetchSkills(),
    //   // ... etc
    // ]).then(() => setIsLoading(false)).catch(() => setIsLoading(false))

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-50/70 flex items-center justify-center ">
          <div className="relative flex items-center justify-center">
            {/* Outer spinning ring */}
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-orange-500 border-opacity-70 shadow-lg"></div>
  
            {/* Inner logo with pulse */}
            <div className="absolute inset-0 flex items-center justify-center animate-pulse">
              <div className="bg-white rounded-full p-3 shadow-md">
                <Image
                  src="/log.png"
                  width={56}
                  height={56}
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
  
  return (
    <div className="min-h-screen bg-gray-50 pb-12 ">
      <ProfileHeader />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 md:space-y-12">
        <BioAvailability />
        <SkillsSection />
        <PortfolioSection />
        <Certification />
      </div>
    </div>
  )
}