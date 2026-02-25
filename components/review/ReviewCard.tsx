
import Image from 'next/image'
import { Star } from 'lucide-react'

type Review = {
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

interface ReviewCardProps {
  review: Review
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const customerName = review.customer
    ? [review.customer.first_name, review.customer.last_name]
        .filter(Boolean)
        .join(' ') || 'Anonymous Customer'
    : 'Anonymous Customer'

  const avatarUrl = review.customer?.profile_image || '/default-avatar.png'

  const formattedDate = new Date(review.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
      {/* Header: avatar + name + stars + date */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-100">
          <Image
            src={avatarUrl}
            alt={customerName}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">{customerName}</h4>
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={`${
                    i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-500">{formattedDate}</p>
        </div>
      </div>

      {/* Review text */}
      <p className="text-gray-700 leading-relaxed mb-5">{review.review_text}</p>

      {/* Photos (if any) */}
      {review.photos && review.photos.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-4">
          {review.photos.map((photo, idx) => (
            <div
              key={idx}
              className="relative w-24 h-24 md:w-28 md:h-28 rounded-lg overflow-hidden shadow-sm"
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
  )
}