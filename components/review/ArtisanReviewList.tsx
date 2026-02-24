'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Star, User, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

// Strict Review interface
interface Review {
  id: string
  rating: number
  review_text: string
  photos?: string[] | null
  created_at: string
  customer?: {
    first_name?: string | null
    last_name?: string | null
    profile_image?: string | null
  } | null
}

interface ArtisanReviewsListProps {
  artisanId: string
}

// Helper to safely map Supabase data → Review[]
const mapToReview = (item: any): Review => ({
  id: item.id ?? '',
  rating: Number(item.rating) || 0,
  review_text: item.review_text ?? '',
  photos: Array.isArray(item.photos) ? item.photos : null,
  created_at: item.created_at ?? new Date().toISOString(),
  customer: item.customer
    ? {
        first_name: item.customer.first_name ?? null,
        last_name: item.customer.last_name ?? null,
        profile_image: item.customer.profile_image ?? null,
      }
    : null,
})

export default function ArtisanReviewsList({ artisanId }: ArtisanReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [totalReviews, setTotalReviews] = useState(0)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true)

        const { data, error } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            review_text,
            photos,
            created_at,
            customer:customer_id (
              first_name,
              last_name,
              profile_image
            )
          `)
          .eq('artisan_id', artisanId)
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) throw error

        // Safely map raw data → typed Review[]
        const typedReviews = (data || []).map(mapToReview)
        setReviews(typedReviews)

        // Calculate average rating
        if (typedReviews.length > 0) {
          const total = typedReviews.reduce((sum, r) => sum + r.rating, 0)
          setAverageRating(total / typedReviews.length)
          setTotalReviews(typedReviews.length)
        }
      } catch (err: any) {
        console.error('Failed to load reviews:', err)
        toast.error('Could not load reviews')
      } finally {
        setLoading(false)
      }
    }

    if (artisanId) {
      fetchReviews()
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
          Be the first to share your experience!
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
              What our customers are saying
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-extrabold">
                {averageRating?.toFixed(1) || '—'}
              </div>
              <div className="flex justify-center mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={`${
                      averageRating && i < Math.round(averageRating)
                        ? 'fill-[var(--orange)] text-[var(--orange)]'
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
      <div className="grid gap-6 md:gap-8">
        {reviews.map((review) => {
          const customerName =
            [review.customer?.first_name, review.customer?.last_name]
              .filter(Boolean)
              .join(' ') || 'Anonymous Customer'

          const avatarUrl = review.customer?.profile_image || '/default-avatar.png'

          const formattedDate = new Date(review.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })

          return (
            <div
              key={review.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6 md:p-8">
                {/* Header */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-100">
                    <Image
                      src={avatarUrl}
                      alt={customerName}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h4 className="font-semibold text-lg text-gray-900">
                        {customerName}
                      </h4>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={18}
                            className={`${
                              i < review.rating
                                ? 'fill-[var(--orange)] text-[var(--orange)]'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Calendar size={14} />
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-gray-700 leading-relaxed mb-6">
                  {review.review_text}
                </p>

                {/* Photos Grid */}
                {review.photos && review.photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                    {review.photos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <Image
                          src={photo}
                          alt={`Review photo ${idx + 1}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}