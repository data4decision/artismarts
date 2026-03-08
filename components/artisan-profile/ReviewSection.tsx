'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaStar, FaSpinner, FaUserTie, FaRegStar } from 'react-icons/fa'
import Image from 'next/image'

export default function ArtisanProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState(0)

  useEffect(() => {
    loadProfileAndReviews()
  }, [])

  const loadProfileAndReviews = async () => {
    setLoading(true)

    try {
      // 1. Get current artisan
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      // 2. Get artisan profile
      const { data: artisan, error: profileErr } = await supabase
        .from('profiles')
        .select('first_name, last_name, profile_image, bio, location, skills')
        .eq('id', user.id)
        .single()

      if (profileErr) throw profileErr
      setProfile(artisan)

      // 3. Get all reviews for jobs assigned to this artisan
      const { data: reviewData, error: reviewErr } = await supabase
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
        .eq('is_draft', false)           // only final reviews
        .order('created_at', { ascending: false })

      if (reviewErr) throw reviewErr

      setReviews(reviewData || [])

      // 4. Calculate average rating
      if (reviewData?.length > 0) {
        const total = reviewData.reduce((sum, r) => sum + r.rating, 0)
        setAverageRating(total / reviewData.length)
        setReviewCount(reviewData.length)
      }
    } catch (err: any) {
      console.error('Profile load error:', err)
      toast.error('Failed to load profile and reviews')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-6xl text-[var(--orange)]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow p-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
          {profile?.profile_image ? (
            <Image
              src={profile.profile_image}
              alt={`${profile.first_name} ${profile.last_name}`}
              width={140}
              height={140}
              className="rounded-full object-cover border-4 border-[var(--orange)]/30 shadow-lg"
            />
          ) : (
            <div className="w-36 h-36 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              <FaUserTie size={60} />
            </div>
          )}

          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-[var(--blue)]">
              {profile?.first_name} {profile?.last_name}
            </h1>

            {/* Rating Summary */}
            <div className="flex items-center justify-center md:justify-start gap-3 mt-3">
              {averageRating !== null ? (
                <>
                  <div className="flex items-center gap-1">
                    <FaStar className="text-[var(--orange)] text-3xl" />
                    <span className="text-3xl font-bold text-[var(--blue)]">
                      {averageRating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-lg text-gray-600">
                    ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </>
              ) : (
                <span className="text-lg text-gray-500 italic">
                  No reviews yet
                </span>
              )}
            </div>

            {profile?.bio && (
              <p className="mt-4 text-gray-700 max-w-2xl">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-2xl font-bold text-[var(--blue)] mb-6">
            Customer Reviews
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaStar className="text-[var(--orange)] text-5xl mx-auto mb-4 opacity-50" />
              <p className="text-lg">You don't have any reviews yet.</p>
              <p className="mt-2">Complete more jobs to start receiving feedback!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-200 pb-8 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-4">
                    {/* Customer avatar */}
                    {review.job?.customer?.profile_image ? (
                      <Image
                        src={review.job.customer.profile_image}
                        alt="Customer"
                        width={56}
                        height={56}
                        className="rounded-full object-cover border-2 border-gray-100"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        <FaUserTie size={24} />
                      </div>
                    )}

                    <div className="flex-1">
                      {/* Job title & customer name */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-[var(--blue)]">
                            {review.job?.title || 'Job'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            by {review.job?.customer?.first_name || 'Customer'}{' '}
                            {review.job?.customer?.last_name || ''}
                          </p>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(s => (
                            <FaStar
                              key={s}
                              size={20}
                              className={s <= review.rating ? 'text-[var(--orange)]' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Review text */}
                      <p className="mt-3 text-gray-700">
                        {review.review_text || <em>No comment provided</em>}
                      </p>

                      {/* Date */}
                      <p className="mt-2 text-sm text-gray-500">
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
      </div>
    </div>
  )
}