'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaSpinner, FaTrash, FaCalendarAlt } from 'react-icons/fa'
import Image from 'next/image'
import { Star } from 'lucide-react'

/* ====================== TYPES ====================== */

type AppRating = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  user_id: string
  profiles: {
    first_name?: string | null
    last_name?: string | null
    profile_image?: string | null
  } | null
}

/* ====================== PAGE ====================== */

export default function AdminAppRatingsPage() {
  const [ratings, setRatings] = useState<AppRating[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchAppRatings()
  }, [])

  const fetchAppRatings = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('app_ratings')
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id,
          profiles:profiles (
            first_name,
            last_name,
            profile_image
          )
        `)
        .order('created_at', { ascending: false })
        .returns<AppRating[]>()

      if (error) throw error

      console.log('✅ Ratings fetched:', data)
      setRatings(data || [])
    } catch (err: any) {
      console.error('❌ Fetch error:', err)

      toast.error(
        err.message?.includes('permission')
          ? 'Permission denied. Check RLS policies.'
          : 'Failed to load ratings'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rating permanently?')) return

    setDeletingId(id)

    try {
      const { error } = await supabase
        .from('app_ratings')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Rating deleted')

      setRatings(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete rating')
    } finally {
      setDeletingId(null)
    }
  }

  const averageRating = ratings.length
    ? (
        ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      ).toFixed(1)
    : '0.0'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-[var(--blue)]">
            App Ratings
          </h1>
          <p className="text-gray-600">
            What customers think about ArtisMarts
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-500">Average Rating</p>
          <div className="flex items-center gap-2 justify-end">
            <span className="text-5xl font-bold text-[var(--orange)]">
              {averageRating}
            </span>
            <Star
              className="text-[var(--orange)] w-10 h-10"
              fill="currentColor"
            />
          </div>
        </div>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="flex justify-center py-20">
          <FaSpinner className="animate-spin text-5xl text-[var(--orange)]" />
        </div>
      ) : ratings.length === 0 ? (
        /* EMPTY STATE */
        <div className="bg-white rounded-3xl shadow p-20 text-center">
          <Star className="text-7xl text-gray-200 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-700">
            No ratings yet
          </h3>
        </div>
      ) : (
        /* GRID */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ratings.map(rating => (
            <ReviewCard
              key={rating.id}
              review={{
                id: rating.id,
                rating: rating.rating,
                review_text: rating.comment || '',
                created_at: rating.created_at,
                customer: rating.profiles ?? null
              }}
              onDelete={() => handleDelete(rating.id)}
              isDeleting={deletingId === rating.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ====================== REVIEW CARD ====================== */

interface ReviewCardProps {
  review: {
    id: string
    rating: number
    review_text: string
    created_at: string
    customer?: {
      first_name?: string | null
      last_name?: string | null
      profile_image?: string | null
    } | null
  }
  onDelete: () => void
  isDeleting: boolean
}

function ReviewCard({ review, onDelete, isDeleting }: ReviewCardProps) {
  const customerName = review.customer
    ? [review.customer.first_name, review.customer.last_name]
        .filter(Boolean)
        .join(' ')
        .trim() || 'Anonymous Customer'
    : 'Anonymous Customer'

  const avatarUrl = review.customer?.profile_image
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${review.customer.profile_image}`
    : '/default-avatar.png'

  const formattedDate = new Date(review.created_at).toLocaleDateString(
    'en-GB',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }
  )

  return (
    <div className="bg-white rounded-3xl shadow hover:shadow-2xl transition p-8 relative">
      {/* HEADER */}
      <div className="flex items-start gap-4 mb-6">
        <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-gray-100">
          <Image
            src={avatarUrl}
            alt={customerName}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-lg text-gray-900 truncate">
              {customerName}
            </h4>

            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  className={
                    i < review.rating
                      ? 'fill-[var(--orange)] text-[var(--orange)]'
                      : 'text-gray-200'
                  }
                />
              ))}
            </div>
          </div>

          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <FaCalendarAlt /> {formattedDate}
          </p>
        </div>
      </div>

      {/* COMMENT */}
      {review.review_text ? (
        <div className="bg-gray-50 p-5 rounded-xl border-l-4 border-[var(--orange)] text-gray-700 italic">
          “{review.review_text}”
        </div>
      ) : (
        <p className="text-gray-400 italic">No comment provided</p>
      )}

      {/* DELETE */}
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="absolute bottom-6 right-6 text-red-500 hover:text-red-700 p-3 hover:bg-red-50 rounded-xl transition disabled:opacity-50"
      >
        {isDeleting ? (
          <FaSpinner className="animate-spin" />
        ) : (
          <FaTrash />
        )}
      </button>
    </div>
  )
}