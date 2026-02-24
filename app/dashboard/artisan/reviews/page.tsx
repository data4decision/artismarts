// components/review/ArtisanReviewsList.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { FaStar, FaUserCircle } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface Review {
  id: string
  artisan_id: string | null
  job_id: string | null
  customer_id: string | null
  rating: number
  review_text: string | null
  photos: string[] | null
  created_at: string
  // Optional: joined customer info (if you later add a join)
  customer?: {
    first_name?: string | null
    last_name?: string | null
    profile_image?: string | null
  } | null
}

type Props = {
  artisanId: string
}

export default function ArtisanReviewsList({ artisanId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [totalReviews, setTotalReviews] = useState(0)

  const fetchReviews = async () => {
    try {
      setLoading(true)

      const { data, error, count } = await supabase
        .from('reviews')
        .select(
          `
          id,
          artisan_id,
          job_id,
          customer_id,
          rating,
          review_text,
          photos,
          created_at
        `,
          { count: 'exact' }
        )
        .eq('artisan_id', artisanId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Supabase fetch error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      console.log(`Fetched ${count || 0} reviews for artisan ${artisanId}`)
      setReviews(data || [])

      // Calculate average rating
      if (data && data.length > 0) {
        const total = data.reduce((sum, r) => sum + Number(r.rating), 0)
        setAverageRating(total / data.length)
        setTotalReviews(data.length)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Reviews fetch error:', errorMessage)
      toast.error(`Could not load reviews: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (artisanId) {
      fetchReviews()
    }

    // Optional: Real-time subscription for new reviews
    const channel = supabase
      .channel(`reviews:artisan_${artisanId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `artisan_id=eq.${artisanId}`,
        },
        (payload: any) => {
          console.log('Review change:', payload)

          if (payload.eventType === 'INSERT' && payload.new) {
            setReviews((prev) => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setReviews((prev) =>
              prev.map((r) => (r.id === payload.new.id ? payload.new : r))
            )
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setReviews((prev) => prev.filter((r) => r.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [artisanId])

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">
        Loading reviews...
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <p className="text-xl font-medium text-gray-700 mb-2">
          No reviews yet
        </p>
        <p className="text-gray-500">
          When customers leave feedback, it will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Summary Header */}
      <div className="bg-[var(--blue)] text-[var(--white)] rounded-2xl p-6 md:p-8 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Customer Reviews
            </h2>
            <p className="text-[var(--white)]/90">
              Real feedback from real customers
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-extrabold">
                {averageRating?.toFixed(1) || '—'}
              </div>
              <div className="flex justify-center mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FaStar
                    key={i}
                    className={`text-2xl ${
                      averageRating && i < Math.round(averageRating)
                        ? 'text-[var(--orange)]'
                        : 'text-[var(--white)]/40'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="text-center">
              <div className="text-4xl md:text-5xl font-extrabold">
                {totalReviews}
              </div>
              <p className="text-sm text-[var(--white)]/80">Reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="grid gap-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {/* Avatar placeholder */}
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                  <FaUserCircle className="text-5xl text-gray-400" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <h4 className="font-semibold text-lg text-gray-900">
                    Customer Review
                  </h4>

                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`text-xl ${
                            i < review.rating ? 'text-[var(--orange)]' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {review.rating}/5
                    </span>
                  </div>
                </div>

                {/* Date */}
                <p className="text-sm text-gray-500 mb-4">
                  {new Date(review.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>

                {/* Review Text */}
                <p className="text-gray-700 leading-relaxed">
                  {review.review_text || 'No comment provided.'}
                </p>

                {/* Photos (if any) */}
                {review.photos && review.photos.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-5">
                    {review.photos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="relative w-24 h-24 rounded-lg overflow-hidden shadow-sm"
                      >
                        <Image
                          src={photo}
                          alt={`Review photo ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}