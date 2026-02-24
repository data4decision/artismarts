// components/FeaturedArtisansSlider.tsx
'use client'

import React, { useEffect, useState } from 'react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import Link from 'next/link'
import { Star } from 'lucide-react' // or use react-icons FaStar
import { supabase } from '@/lib/supabase' // your client

// Type (adjust fields to match your profiles table)
interface Artisan {
  id: string
  first_name: string | null
  last_name: string | null
  business_name: string | null
  primary_skill: string | null
  profile_image: string | null
  average_rating: number | null
  rating_count: number | null
  bio: string | null
  verification_status: string | null
}

const FeaturedArtisansSlider = () => {
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArtisans = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            last_name,
            business_name,
            primary_skill,
            profile_image,
            average_rating,
            rating_count,
            bio,
            verification_status
          `)
          .eq('verification_status', 'verified') // only show verified
          .order('average_rating', { ascending: false, nullsLast: true })
          .limit(12) // enough for slider

        if (error) throw error
        setArtisans(data || [])
      } catch (err) {
        console.error('Error fetching artisans:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchArtisans()
  }, [])

  const settings = {
    dots: true,               // show dots below
    infinite: true,
    speed: 600,
    autoplay: true,
    autoplaySpeed: 3500,
    slidesToShow: 4,
    slidesToScroll: 1,
    pauseOnHover: true,
    arrows: true,             // default arrows (you can customize)
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ]
  }

  const getDisplayName = (artisan: Artisan) =>
    artisan.business_name ||
    `${artisan.first_name || ''} ${artisan.last_name || ''}`.trim() ||
    'Artisan'

  if (loading) {
    return (
      <div className="py-16 text-center text-[var(--blue)]">
        Loading featured artisans...
      </div>
    )
  }

  if (artisans.length === 0) {
    return null // or fallback message
  }

  return (
    <div className="py-16 bg-[var(--orange)]/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-[var(--blue)] mb-3">
          Featured & Top-Rated Artisans
        </h2>
        <p className="text-lg md:text-xl text-center text-gray-700 mb-10">
          Discover skilled professionals ready for your next project
        </p>

        <Slider {...settings}>
          {artisans.map((artisan) => (
            <div key={artisan.id} className="px-2">
              <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 h-full flex flex-col">
                {/* Profile Image */}
                <div className="relative h-48 bg-gradient-to-br from-[var(--blue)]/10 to-[var(--orange)]/10">
                  {artisan.profile_image ? (
                    <img
                      src={artisan.profile_image}
                      alt={getDisplayName(artisan)}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[var(--blue)]/5 text-[var(--blue)]/40 text-6xl font-bold">
                      {getDisplayName(artisan).charAt(0)}
                    </div>
                  )}
                  {artisan.verification_status === 'verified' && (
                    <div className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Verified
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-[var(--blue)] transition-colors">
                    {getDisplayName(artisan)}
                  </h3>

                  {artisan.primary_skill && (
                    <p className="text-[var(--orange)] font-medium text-sm mb-2">
                      {artisan.primary_skill}
                    </p>
                  )}

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    {artisan.average_rating ? (
                      <>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-gray-800">
                          {artisan.average_rating.toFixed(1)}
                        </span>
                        <span className="text-gray-500 text-sm">
                          ({artisan.rating_count || 0})
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500 text-sm">New Artisan</span>
                    )}
                  </div>

                  {/* Bio snippet */}
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">
                    {artisan.bio || 'Experienced artisan delivering quality work with attention to detail.'}
                  </p>

                  {/* CTA */}
                  <Link
                    href={`/artisan/${artisan.id}`}
                    className="mt-auto block text-center bg-[var(--blue)] text-white py-2.5 rounded-lg font-medium hover:bg-[var(--blue)]/90 transition"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </Slider>

        <div className="text-center mt-10">
          <Link
            href="/artisans"
            className="inline-flex items-center px-8 py-4 bg-[var(--orange)] text-white rounded-lg font-medium hover:bg-[var(--orange)]/90 transition"
          >
            See All Artisans →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default FeaturedArtisansSlider