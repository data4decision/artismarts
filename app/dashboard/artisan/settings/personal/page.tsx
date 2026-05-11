

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
import Reviews from '@/app/dashboard/artisan/profile/Reviews'
import { FaArrowLeft } from 'react-icons/fa'
import Link from 'next/link'

export default function ArtisanProfilePage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800) // ← remove this in real app - just for demo


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
       <Link href="/dashboard/artisan/settings" className="flex items-center gap-3 mb-8 px-50">
               <p><FaArrowLeft className='text-[var(--blue)]'/></p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--blue)] ">My Profile</h1>
             </Link>
      <ProfileHeader />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 md:space-y-12">
        <BioAvailability />
        <SkillsSection />
        <PortfolioSection />
        <Certification />
        <Reviews/>
      </div>
    </div>
  )
}