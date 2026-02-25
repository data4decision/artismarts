// // components/review/CustomerReviewForm.tsx
// 'use client'

// import { useState } from 'react'
// import { Star } from 'lucide-react'
// import { supabase } from '@/lib/supabase'
// import toast from 'react-hot-toast'

// const ARTISAN_ID = '5390e0f4-c81d-4237-bfc1-7757c2c8d970'

// export default function CustomerReviewForm() {
//   const [rating, setRating] = useState<number>(0)
//   const [hover, setHover] = useState<number>(0)
//   const [comment, setComment] = useState('')
//   const [submitting, setSubmitting] = useState(false)

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     if (rating === 0) {
//       toast.error('Please select a rating (1–5 stars)')
//       return
//     }

//     if (comment.trim().length < 10) {
//       toast.error('Please write at least 10 characters in your review')
//       return
//     }

//     setSubmitting(true)

//     try {
//       // Get current logged-in user
//       const { data: { user } } = await supabase.auth.getUser()

//       if (!user) {
//         toast.error('You must be signed in to leave a review')
//         return
//       }

//       // Only allow this specific customer to submit (for your test)
//       if (user.id !== '788ff1cc-a2de-4b96-91d7-4568f07c4519') {
//         toast.error('Only the assigned customer can submit this review')
//         return
//       }

//       const { error } = await supabase
//         .from('reviews')
//         .insert({
//           artisan_id: ARTISAN_ID,
//           customer_id: user.id,
//           rating,
//           comment: comment.trim(),
//           created_at: new Date().toISOString(),
//         })

//       if (error) throw error

//       toast.success('Thank you! Your review has been submitted.')
//       setRating(0)
//       setComment('')
//     } catch (err: any) {
//       console.error('Review submission failed:', err)
//       toast.error(err.message || 'Failed to submit review. Try again.')
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   return (
//     <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
//       {/* Header */}
//       <div className="bg-[var(--blue)] px-6 py-8 md:px-10 md:py-10 text-[var(--white)]">
//         <h2 className="text-2xl md:text-3xl font-bold mb-3">
//           Review Your Experience
//         </h2>
//         <p className="text-[var(--white)]/90 text-lg">
//           Tell us how the artisan performed. Your honest feedback helps everyone.
//         </p>
//       </div>

//       {/* Form */}
//       <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-10">
//         {/* Rating */}
//         <div className="space-y-4">
//           <label className="block text-lg font-medium text-gray-800">
//             Overall Rating
//           </label>
//           <div className="flex gap-2">
//             {Array.from({ length: 5 }).map((_, i) => {
//               const value = i + 1
//               const active = (hover || rating) >= value

//               return (
//                 <button
//                   key={i}
//                   type="button"
//                   onClick={() => setRating(value)}
//                   onMouseEnter={() => setHover(value)}
//                   onMouseLeave={() => setHover(0)}
//                   className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
//                 >
//                   <Star
//                     size={48}
//                     className={`transition-colors ${
//                       active
//                         ? 'fill-[var(--orange)] text-[var(--orange)]'
//                         : 'text-gray-300 hover:text-gray-400'
//                     }`}
//                   />
//                 </button>
//               )
//             })}
//           </div>
//           {rating > 0 && (
//             <p className="text-sm text-gray-600">
//               {rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
//             </p>
//           )}
//         </div>

//         {/* Comment */}
//         <div className="space-y-4">
//           <label htmlFor="comment" className="block text-lg font-medium text-gray-800">
//             Your Review
//           </label>
//           <textarea
//             id="comment"
//             value={comment}
//             onChange={(e) => setComment(e.target.value)}
//             placeholder="Describe your experience... What was done well? Any suggestions?"
//             rows={6}
//             className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none resize-y min-h-[160px] text-gray-800 placeholder-gray-400 shadow-sm"
//           />
//         </div>

//         {/* Submit */}
//         <button
//           type="submit"
//           disabled={submitting || rating === 0}
//           className={`
//             w-full py-4 px-8 rounded-xl font-medium text-[var(--white)] transition-all shadow-md
//             ${submitting || rating === 0
//               ? 'bg-gray-400 cursor-not-allowed'
//               : 'bg-[var(--orange)] hover:bg-orange-600 active:bg-orange-700'
//             }
//           `}
//         >
//           {submitting ? 'Submitting...' : 'Submit Review'}
//         </button>
//       </form>
//     </div>
//   )
// }

import React from 'react'


const CustomerReviewForm = () => {
  return (
    <div>CustomerReviewForm</div>
  )
}

CustomerReviewForm.propTypes = {}

export default CustomerReviewForm