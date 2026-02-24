'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { FaStar, FaUserCircle } from 'react-icons/fa'
import toast from 'react-hot-toast'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  customer_name: string | null
}

type Props = {
  artisanId: string
}

export default function ReviewSection({ artisanId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const { data, error, count } = await supabase
        .from('reviews')
        .select(
          `
          id,
          rating,
          comment,
          created_at,
          customer_name
        `,
          { count: 'exact' }
        )
        .eq('artisan_id', artisanId)
        .order('created_at', { ascending: false })
        .limit(10)

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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Reviews fetch error:', errorMessage)
      toast.error(`Could not load reviews: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()

    // Realtime subscription (optional – live updates when new reviews come in)
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
        (payload: unknown) => {
          console.log('Review realtime change:', payload)

          // Type narrowing for payload
          if (!payload || typeof payload !== 'object') return

          const p = payload as { eventType?: string; new?: Review; old?: { id: string } }

          if (p.eventType === 'INSERT' && p.new) {
            setReviews((prev) => [p.new, ...prev])
          } else if (p.eventType === 'UPDATE' && p.new) {
            setReviews((prev) =>
              prev.map((r) => (r.id === p.new!.id ? p.new! : r))
            )
          } else if (p.eventType === 'DELETE' && p.old) {
            setReviews((prev) => prev.filter((r) => r.id !== p.old!.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [artisanId])

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[var(--blue)]">
          Customer Reviews {reviews.length > 0 && `(${reviews.length})`}
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={`text-xl ${
                    i < Math.round(averageRating)
                      ? 'text-amber-500'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-medium text-gray-700">
              {averageRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <FaStar className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-gray-600 text-lg">No reviews yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Be the first to leave a review!
          </p>
        </div>
      ) : (
        <div className="space-y-6 divide-y divide-gray-100">
          {reviews.map((review) => (
            <div key={review.id} className="pt-6 first:pt-0">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <FaUserCircle className="text-5xl text-gray-400" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`text-lg ${
                            i < review.rating ? 'text-amber-500' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-medium text-gray-900">
                      {review.customer_name || 'Anonymous'}
                    </span>
                    <span className="text-sm text-gray-500">
                      • {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-gray-700 leading-relaxed">
                    {review.comment || 'No comment provided.'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}