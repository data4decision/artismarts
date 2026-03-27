'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FaStar } from 'react-icons/fa'
import Image from 'next/image'

export default function FeaturedAppRating() {
  const [featured, setFeatured] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchFeaturedRating = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'featured_app_rating')
        .single()

      // If no row exists or value is empty → clear the featured review
      if (error || !data || !data.value || Object.keys(data.value).length === 0) {
        setFeatured(null)
        return
      }

      setFeatured(data.value)
    } catch (err) {
      console.log('No featured rating found')
      setFeatured(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeaturedRating()
  }, [])

  // Real-time listener - clears when admin removes the row
  useEffect(() => {
    const channel = supabase
      .channel('featured_review_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'site_settings',
          filter: 'key=eq.featured_app_rating'
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setFeatured(null)        // Immediately clear when deleted
          } else {
            fetchFeaturedRating()    // Refresh on update/insert
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading || !featured) return null

  return (
    <div className="bg-[var(--white)] py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[var(--orange)] font-medium tracking-widest text-sm mb-3">
            WHAT OUR CUSTOMERS SAY
          </p>
          <h2 className="text-5xl font-bold text-[var(--blue)]">
            Testimonials
          </h2>
        </div>

        {/* Single Featured Card */}
        <div className="max-w-2xl mx-auto">
          <div className="group bg-white border-2 border-[var(--blue)] hover:border-[var(--orange)] 
                          rounded-3xl shadow-md hover:shadow-2xl p-10 transition-all duration-300">
            
            {/* Profile */}
            <div className="flex items-center gap-5 mb-8">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-md flex-shrink-0">
                {featured.profile_image ? (
                  <Image
                    src={featured.profile_image}
                    alt={featured.user_name || 'Customer'}
                    width={80}
                    height={80}
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-avatar.png'
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-5xl">
                    👤
                  </div>
                )}
              </div>

              <div>
                <p className="font-semibold text-2xl text-[var(--blue)] group-hover:text-[var(--orange)] transition-colors">
                  {featured.user_name || 'Happy Customer'}
                </p>
                <p className="text-gray-500">Customer</p>
              </div>
            </div>

            {/* Stars */}
            <div className="flex gap-1 mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <FaStar
                  key={s}
                  className={`text-3xl transition-colors ${
                    s <= (featured.rating || 0) ? 'text-[var(--orange)]' : 'text-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Review Text */}
            <p className="text-gray-700 italic text-[17px] leading-relaxed">
              “{featured.comment}”
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}