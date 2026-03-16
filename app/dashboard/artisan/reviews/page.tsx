'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaStar, FaSpinner, FaUserTie, FaArrowLeft, 
  FaExclamationTriangle, FaCheckCircle 
} from 'react-icons/fa'
import Image from 'next/image'

export default function ArtisanReviewsPage() {
  const router = useRouter()

  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMyReviews()
  }, [])

  const fetchMyReviews = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in')
        router.replace('/login')
        return
      }

      // Fetch reviews where the artisan was assigned to the job
      const { data, error } = await supabase
        .from('job_reviews')
        .select(`
          id,
          rating,
          review_text,
          created_at,
          job:job_id (
            id,
            title,
            customer:customer_id (first_name, last_name, profile_image)
          )
        `)
        .eq('job.assigned_artisan_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setReviews(data || [])
    } catch (err: any) {
      console.error('Failed to load reviews:', err)
      setError(err.message || 'Could not load your reviews')
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
        <div className="relative flex items-center justify-center">
        {/* Outer spinning ring */}
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-md"></div>
          {/* Inner static logo with subtle pulse */}
            <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
              <div className="bg-[var(--white)] rounded-full p-2 shadow-sm">
                  <Image src="/log.png" width={48} height={48}  priority alt="Loading..." className="object-contain"  />  
              </div>
            </div>
          </div>
       </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="text-red-500 text-7xl mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-[var(--blue)] mb-4">Error</h2>
          <p className="text-[var(--blue)]/80 mb-8">{error}</p>
          <button 
            onClick={fetchMyReviews}
            className="px-8 py-4 bg-[var(--blue)] text-white rounded-xl hover:bg-[var(--blue)]/70"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[var(--blue)]/70 hover:text-[var(--orange)] transition font-medium"
          >
            <FaArrowLeft /> Back
          </button>
          <h1 className="text-3xl font-bold text-[var(--blue)]">
            My Reviews
          </h1>
          <div className="w-10" /> {/* spacer */}
        </div>

        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <FaCheckCircle className="text-[var(--orange)] text-6xl mx-auto mb-6 opacity-50" />
            <h2 className="text-2xl font-semibold text-[var(--blue)]/80 mb-3">
              No reviews yet
            </h2>
            <p className="text-[var(--blue)] max-w-md mx-auto">
              Once customers complete and review your jobs, their feedback will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-2xl shadow border border-[var(--blue)]/20 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                  {/* Job & Customer Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {review.job?.customer?.profile_image ? (
                        <Image
                          src={review.job.customer.profile_image}
                          alt={`${review.job.customer.first_name} ${review.job.customer.last_name}`}
                          width={48}
                          height={48}
                          className="rounded-full object-cover border-2 border-[var(--blue)]/10"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[var(--blue)]/20 flex items-center justify-center text-gray-500">
                          <FaUserTie size={24} />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-[var(--blue)]">
                          {review.job?.title || 'Job'}
                        </h3>
                        <p className="text-sm text-[var(--blue)]">
                          From {review.job?.customer?.first_name || 'Customer'}{' '}
                          {review.job?.customer?.last_name || ''}
                        </p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          size={24}
                          className={star <= review.rating ? 'text-[var(--orange)]' : 'text-[var(--blue)]/30'}
                        />
                      ))}
                      <span className="ml-2 text-sm font-medium text-[var(--blue)]/70">
                        {review.rating}/5
                      </span>
                    </div>

                    {/* Review Text */}
                    {review.review_text ? (
                      <p className="text-[var(--blue)] leading-relaxed">
                        "{review.review_text}"
                      </p>
                    ) : (
                      <p className="text-[var(--blue)] italic">
                        No written comment provided.
                      </p>
                    )}

                    {/* Date */}
                    <p className="text-sm text-[var(--blue)] mt-4">
                      Reviewed on {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}