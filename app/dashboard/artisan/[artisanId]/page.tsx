'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaStar, FaSpinner, FaUserTie, FaCheckCircle, FaChevronLeft, FaChevronRight, FaTimesCircle } from 'react-icons/fa'
import Image from 'next/image'

export default function PublicArtisanProfile() {
  const { artisanId } = useParams<{ artisanId: string }>()

  const [artisan, setArtisan] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Slider refs & state
  const sliderRef = useRef<HTMLDivElement>(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (!artisanId) {
      setError('Invalid artisan profile')
      setLoading(false)
      return
    }
    loadArtisanAndReviews()
  }, [artisanId])

  const loadArtisanAndReviews = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch artisan public profile + skills + verified
      const { data: artisanData, error: profileErr } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, profile_image, bio, skills, verified')
        .eq('id', artisanId)
        .single()

      if (profileErr) throw profileErr
      if (!artisanData) throw new Error('Artisan profile not found')

      setArtisan(artisanData)

      // Fetch final reviews
      const { data: reviewData, error: reviewErr } = await supabase
        .from('job_reviews')
        .select(`
          id,
          rating,
          review_text,
          created_at,
          job:job_id (title)
        `)
        .eq('job.assigned_artisan_id', artisanId)
        .eq('is_draft', false)
        .order('created_at', { ascending: false })

      if (reviewErr) throw reviewErr

      const reviewsList = reviewData || []
      setReviews(reviewsList)

      if (reviewsList.length > 0) {
        const total = reviewsList.reduce((sum, r) => sum + r.rating, 0)
        setAverageRating(Number((total / reviewsList.length).toFixed(1)))
        setReviewCount(reviewsList.length)
      }
    } catch (err: any) {
      console.error('Public profile load error:', err)
      setError(err.message || 'Failed to load artisan profile')
    } finally {
      setLoading(false)
    }
  }

  // Slider controls
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % reviews.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + reviews.length) % reviews.length)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FaSpinner className="animate-spin text-6xl text-[var(--orange)]" />
      </div>
    )
  }

  if (error || !artisan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <FaTimesCircle className="text-red-500 text-7xl mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Profile not found</h2>
          <p className="text-gray-600">{error || 'This artisan profile could not be loaded.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">

        {/* Artisan Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
          <div className="relative">
            {artisan.profile_image ? (
              <Image
                src={artisan.profile_image}
                alt={`${artisan.first_name} ${artisan.last_name}`}
                width={180}
                height={180}
                className="rounded-full object-cover border-4 border-[var(--orange)]/30 shadow-xl"
              />
            ) : (
              <div className="w-44 h-44 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 shadow-xl">
                <FaUserTie size={72} />
              </div>
            )}

            {/* Verified Badge */}
            {artisan.verified && (
              <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-2 shadow-lg">
                <FaCheckCircle size={24} />
              </div>
            )}
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--blue)] mb-3">
              {artisan.first_name} {artisan.last_name}
            </h1>

            {/* Rating Summary */}
            <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
              {averageRating !== null ? (
                <div className="flex items-center gap-3 bg-gray-50 px-6 py-4 rounded-xl shadow-sm">
                  <FaStar className="text-[var(--orange)] text-4xl" />
                  <span className="text-4xl font-bold text-[var(--blue)]">
                    {averageRating}
                  </span>
                  <span className="text-lg text-gray-600">
                    / 5 • {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                  </span>
                </div>
              ) : (
                <div className="text-lg text-gray-500 italic bg-gray-50 px-6 py-4 rounded-xl">
                  No reviews yet
                </div>
              )}
            </div>

            {/* Hire Button */}
            <Link
              href={`/jobs/create?artisan=${artisanId}`}
              className="inline-flex items-center px-8 py-4 bg-[var(--orange)] text-white font-semibold rounded-xl hover:bg-orange-600 transition shadow-md text-lg mb-6 md:mb-0"
            >
              Hire this Artisan
            </Link>

            {/* Bio */}
            {artisan.bio && (
              <p className="mt-6 text-gray-700 text-lg leading-relaxed max-w-3xl">
                {artisan.bio}
              </p>
            )}

            {/* Skills / Tags */}
            {artisan.skills?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-[var(--blue)] mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {artisan.skills.map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-[var(--blue)]/10 text-[var(--blue)] rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section – Horizontal Slider */}
        <div className="bg-white rounded-2xl shadow p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--blue)] mb-8">
            Customer Reviews
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-16 text-gray-500 border border-dashed border-gray-300 rounded-xl">
              <FaStar className="text-[var(--orange)] text-6xl mx-auto mb-6 opacity-40" />
              <p className="text-xl font-medium">No reviews yet</p>
              <p className="mt-3 text-lg">Be the first to hire and leave feedback!</p>
            </div>
          ) : (
            <div className="relative">
              {/* Slider Container */}
              <div 
                ref={(el) => {
                  if (el) sliderRef.current = el
                }}
                className="overflow-hidden"
              >
                <div 
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {reviews.map((review) => (
                    <div 
                      key={review.id}
                      className="min-w-full px-4"
                    >
                      <div className="bg-gray-50 rounded-xl p-6 md:p-8 shadow-sm">
                        <div className="flex items-start gap-5">
                          {/* Customer avatar */}
                          {review.job?.customer?.profile_image ? (
                            <Image
                              src={review.job.customer.profile_image}
                              alt="Customer"
                              width={64}
                              height={64}
                              className="rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                              <FaUserTie size={28} />
                            </div>
                          )}

                          <div className="flex-1">
                            {/* Job title */}
                            <h3 className="font-semibold text-lg text-[var(--blue)] mb-2">
                              {review.job?.title || 'Completed Job'}
                            </h3>

                            {/* Stars */}
                            <div className="flex items-center gap-1 mb-4">
                              {[1,2,3,4,5].map((s) => (
                                <FaStar
                                  key={s}
                                  size={24}
                                  className={s <= review.rating ? 'text-[var(--orange)]' : 'text-gray-300'}
                                />
                              ))}
                              <span className="ml-2 text-base font-medium text-gray-600">
                                {review.rating}/5
                              </span>
                            </div>

                            {/* Comment */}
                            <p className="text-gray-700 text-base leading-relaxed mb-4">
                              {review.review_text ? (
                                `"${review.review_text}"`
                              ) : (
                                <em className="text-gray-500">No written comment provided.</em>
                              )}
                            </p>

                            {/* Customer name & date */}
                            <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-gray-500">
                              <span>
                                by {review.job?.customer?.first_name || 'A satisfied customer'}{' '}
                                {review.job?.customer?.last_name ? review.job.customer.last_name.charAt(0) + '.' : ''}
                              </span>
                              <span className="mt-1 sm:mt-0">
                                {new Date(review.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slider Controls */}
              {reviews.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white p-4 rounded-full shadow-lg hover:bg-gray-100 transition z-10"
                    aria-label="Previous review"
                  >
                    <FaChevronLeft className="text-[var(--blue)] text-2xl" />
                  </button>

                  <button
                    onClick={nextSlide}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white p-4 rounded-full shadow-lg hover:bg-gray-100 transition z-10"
                    aria-label="Next review"
                  >
                    <FaChevronRight className="text-[var(--blue)] text-2xl" />
                  </button>

                  {/* Dots indicator */}
                  <div className="flex justify-center gap-3 mt-6">
                    {reviews.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`w-3 h-3 rounded-full transition-all ${
                          currentSlide === idx 
                            ? 'bg-[var(--orange)] scale-125' 
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        aria-label={`Go to review ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}