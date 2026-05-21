'use client'

import { useEffect, useState } from 'react'
import Slider from 'react-slick'

import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

import { supabase } from '@/lib/supabase'
import { FaStar } from 'react-icons/fa'
import Image from 'next/image'

export default function MobileFeaturedAppRating() {
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('app_ratings')
        .select(`
          id,
          rating,
          comment,
          created_at,
          profiles (
            first_name,
            last_name,
            profile_image
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      const formatted = (data || []).map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment || '',
        user_name: r.profiles 
          ? `${r.profiles.first_name || ''} ${r.profiles.last_name || ''}`.trim() || 'Happy Customer'
          : 'Happy Customer',
        profile_image: r.profiles?.profile_image || null,
        role: 'Customer'
      }))

      setTestimonials(formatted)
    } catch (err) {
      console.error('Failed to fetch testimonials:', err)
    } finally {
      setLoading(false)
    }
  }

  const settings = {
    dots: true,
    infinite: testimonials.length > 1,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    arrows: false,           // Better UX on mobile
    adaptiveHeight: true,
  }

  if (loading) {
    return <div className="py-20 text-center text-gray-500">Loading testimonials...</div>
  }

  if (testimonials.length === 0) return null

  return (
    <div className="lg:hidden bg-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[var(--orange)] font-medium tracking-widest text-sm mb-3">
            WHAT OUR CUSTOMERS SAY
          </p>
          <h2 className="text-4xl font-bold text-[var(--blue)]">
            Testimonials
          </h2>
        </div>

        <div className="slider-container">
          <Slider {...settings}>
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="px-3">
                <div className="bg-white border-2 border-[var(--blue)] hover:border-[var(--orange)] 
                                rounded-3xl shadow-md hover:shadow-2xl p-8 h-[340px] 
                                flex flex-col transition-all duration-300">
                  
                  {/* Profile */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gray-100 flex-shrink-0">
                      {testimonial.profile_image ? (
                        <Image
                          src={testimonial.profile_image}
                          alt={testimonial.user_name}
                          width={64}
                          height={64}
                          className="object-cover"
                          unoptimized
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-avatar.png'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-4xl">
                          👤
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--blue)] text-lg">
                        {testimonial.user_name}
                      </p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-1 mb-5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FaStar
                        key={s}
                        className={`text-2xl ${
                          s <= testimonial.rating ? 'text-[var(--orange)]' : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Comment */}
                  <p className="text-gray-700 italic leading-relaxed flex-1 text-[15.5px]">
                    “{testimonial.comment}”
                  </p>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </div>
  )
}