'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FaStar } from 'react-icons/fa'
import Image from 'next/image'

export default function FeaturedAppRating() {
  const [featured, setFeatured] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedRating()
  }, [])

  const fetchFeaturedRating = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'featured_app_rating')
        .single()

      if (data?.value) {
        setFeatured(data.value)
      }
    } catch (err) {
      console.log('No featured rating yet')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !featured) return null

  return (
    <div className="bg-white py-16 border-t border-b">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-[var(--orange)]/10 text-[var(--orange)] px-5 py-2 rounded-full mb-6">
          <FaStar className="text-xl" /> Featured Customer Review
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          {featured.profile_image && (
            <div className="flex-shrink-0">
              <Image
                src={featured.profile_image}
                alt={featured.user_name}
                width={120}
                height={120}
                className="rounded-3xl object-cover shadow-lg"
              />
            </div>
          )}

          <div className="max-w-lg">
            <div className="flex justify-center md:justify-start gap-1 mb-4">
              {[1,2,3,4,5].map((s) => (
                <FaStar
                  key={s}
                  className={`text-4xl ${s <= featured.rating ? 'text-[var(--orange)]' : 'text-gray-200'}`}
                />
              ))}
            </div>

            <p className="text-2xl italic text-gray-700 leading-relaxed">
              “{featured.comment}”
            </p>

            <p className="mt-8 font-semibold text-[var(--blue)]">
              — {featured.user_name}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}