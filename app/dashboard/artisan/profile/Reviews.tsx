'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaStar, FaSpinner, FaUserTie } from 'react-icons/fa'
import Image from 'next/image'

export default function ArtisanReviewsSection() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState(0)

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in')
        return
      }

      // Fetch only final reviews for jobs assigned to this artisan
      const { data, error } = await supabase
        .from('job_reviews')
        .select(`
          id,
          rating,
          review_text,
          created_at,
          job:job_id (
            title,
            customer:customer_id (first_name, last_name, profile_image)
          )
        `)
        .eq('job.assigned_artisan_id', user.id)
        .eq('is_draft', false)           // only published reviews
        .order('created_at', { ascending: false })

      if (error) throw error

      const reviewList = data || []
      setReviews(reviewList)

      // Calculate average
      if (reviewList.length > 0) {
        const total = reviewList.reduce((sum, r) => sum + r.rating, 0)
        setAverageRating(Number((total / reviewList.length).toFixed(1)))
        setReviewCount(reviewList.length)
      }
    } catch (err: any) {
      console.error('Failed to load reviews:', err)
      toast.error('Could not load reviews')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <FaSpinner className="animate-spin text-5xl text-[var(--orange)]" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 md:p-8">

      {/* Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--blue)]">
          Customer Reviews
        </h2>

        {reviewCount > 0 ? (
          <div className="flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-xl">
            <div className="flex items-center gap-1">
              <FaStar className="text-[var(--orange)] text-3xl" />
              <span className="text-2xl font-bold text-[var(--blue)]">
                {averageRating}
              </span>
            </div>
            <span className="text-gray-600">
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        ) : (
          <span className="text-gray-500 italic">
            No reviews yet
          </span>
        )}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-16 text-gray-500 border border-dashed border-gray-300 rounded-xl">
          <FaStar className="text-[var(--orange)] text-6xl mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">You don't have any customer reviews yet.</p>
          <p className="mt-2">Complete more jobs — feedback will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-8 divide-y divide-gray-200">
          {reviews.map((review) => (
            <div key={review.id} className="pt-6 first:pt-0">
              <div className="flex items-start gap-4">
                {/* Customer avatar */}
                {review.job?.customer?.profile_image ? (
                  <Image
                    src={review.job.customer.profile_image}
                    alt="Customer"
                    width={56}
                    height={56}
                    className="rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                    <FaUserTie size={24} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {/* Job & Customer */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-[var(--blue)] text-lg">
                        {review.job?.title || 'Job'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        by {review.job?.customer?.first_name || 'Customer'}{' '}
                        {review.job?.customer?.last_name || ''}
                      </p>
                    </div>

                    {/* Rating stars */}
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map((s) => (
                        <FaStar
                          key={s}
                          size={20}
                          className={s <= review.rating ? 'text-[var(--orange)]' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="text-gray-700 mt-2">
                    {review.review_text ? (
                      `"${review.review_text}"`
                    ) : (
                      <em className="text-gray-500">No written comment</em>
                    )}
                  </p>

                  {/* Date */}
                  <p className="text-sm text-gray-500 mt-3">
                    {new Date(review.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
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