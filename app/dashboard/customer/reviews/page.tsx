// components/review/CustomerReviewForm.tsx
'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface CustomerReviewFormProps {
  artisanId: string
  onReviewSubmitted?: () => void
}

export default function CustomerReviewForm({
  artisanId,
  onReviewSubmitted,
}: CustomerReviewFormProps) {
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleStarClick = (value: number) => {
    setRating(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (comment.trim().length < 10) {
      toast.error('Review must be at least 10 characters long')
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('You must be signed in to submit a review')
        return
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          artisan_id: artisanId,
          customer_id: user.id,
          rating,
          comment: comment.trim(),
          // customer_name is optional — you can add it if you want to denormalize
          // customer_name: user.user_metadata?.full_name || null,
        })

      if (error) {
        console.error('Review insert error:', error)
        throw error
      }

      toast.success('Thank you! Your review has been submitted.')
      setRating(0)
      setComment('')
      onReviewSubmitted?.()
    } catch (err: any) {
      console.error('Failed to submit review:', err)
      toast.error(err.message || 'Failed to submit review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-[var(--blue)] mb-3">
        Leave a Review
      </h2>
      <p className="text-gray-600 mb-8">
        Share your experience with this artisan. Your feedback helps the community.
      </p>

      {/* Star Rating */}
      <div className="mb-8">
        <label className="block text-lg font-medium text-gray-700 mb-4">
          Overall Rating
        </label>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => {
            const starValue = i + 1
            const isActive = (hoverRating || rating) >= starValue

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleStarClick(starValue)}
                onMouseEnter={() => setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  size={44}
                  className={`transition-colors ${
                    isActive
                      ? 'fill-[var(--orange)] text-[var(--orange)]'
                      : 'text-gray-300 hover:text-gray-400'
                  }`}
                />
              </button>
            )
          })}
        </div>
        {rating > 0 && (
          <p className="mt-3 text-sm text-gray-600">
            {rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
          </p>
        )}
      </div>

      {/* Review Textarea */}
      <div className="mb-8">
        <label htmlFor="comment" className="block text-lg font-medium text-gray-700 mb-4">
          Your Review
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us about your experience... What did you like? Any suggestions?"
          rows={5}
          className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none resize-y min-h-[140px] text-gray-800 placeholder-gray-400 shadow-sm"
        />
      </div>
      <CustomerReviewForm artisanId="5390e0f4-c81d-4237-bfc1-7757c2c8d970" />

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0}
          className={`
            flex-1 py-4 px-8 rounded-xl font-medium text-[var(--white)] transition-all shadow-md
            ${isSubmitting || rating === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-[var(--orange)] hover:bg-orange-600 active:bg-orange-700'
            }
          `}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  )
}